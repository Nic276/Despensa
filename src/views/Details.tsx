import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { pantryService } from '../services/pantryService';
import { PantryItem, Movement } from '../types';
import { SoftCard, ProgressBar } from '../components/ui/SoftUI';
import { Plus, Minus, Bell, Trash2, Calendar, History, Camera } from 'lucide-react';

interface DetailsProps {
  itemId: string | null;
  onBack: () => void;
}

export default function Details({ itemId, onBack }: DetailsProps) {
  const [item, setItem] = useState<PantryItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalQty, setWithdrawalQty] = useState('1');
  const [selectedWithdrawalBatch, setSelectedWithdrawalBatch] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;

    // Listen to doc changes
    const path = `users/${auth.currentUser?.uid}/items/${itemId}`;
    const unsubscribe = onSnapshot(doc(db, path), (snap) => {
      if (snap.exists()) {
        const data = snap.id ? { id: snap.id, ...snap.data() } as PantryItem : null;
        setItem(data);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    loadMovements();

    return unsubscribe;
  }, [itemId]);

  const loadMovements = async () => {
    const all = await pantryService.getMovements();
    setMovements(all.filter(m => m.itemId === itemId));
  };

  const handleUpdate = async (delta: number, specificDate?: string) => {
    if (!item) return;
    const absQty = Math.abs(delta);
    const type = delta > 0 ? 'ingreso' : 'retiro';
    const newStock = Math.max(0, item.stock + delta);
    
    try {
      await pantryService.updateStock(item.id, newStock, type, absQty, specificDate);
      loadMovements();
      
      if (type === 'retiro') {
        setIsWithdrawing(false);
        setWithdrawalQty('1');
        setSelectedWithdrawalBatch(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      setLoading(true);
      await pantryService.deleteItem(item.id);
      onBack();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Procesando...</div>;
  if (!item) return <div className="p-8 text-center text-zinc-400">Producto no encontrado.</div>;

  return (
    <div className="space-y-6 pb-12">
      <SoftCard className="p-6">
        <div className="flex gap-6 items-start mb-8">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                <Camera className="w-12 h-12" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 leading-tight">{item.name}</h2>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-tighter opacity-60">{item.unit}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-50">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Stock Actual</p>
            <p className="text-4xl font-black text-emerald-600">{item.stock}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Min. Requerido</p>
            <p className="text-4xl font-black text-zinc-300">{item.minStock}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <ProgressBar progress={(item.stock / (item.minStock * 2)) * 100} />
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
            <span>Reposición</span>
            <span>Estable</span>
          </div>
        </div>
      </SoftCard>

      <div className="w-full">
        <button 
          onClick={() => setIsWithdrawing(!isWithdrawing)}
          className={`w-full rounded-2xl p-6 flex flex-col items-center gap-3 border border-zinc-50 shadow-lg active:scale-95 transition-all group ${isWithdrawing ? 'bg-red-50 ring-2 ring-red-500 ring-inset' : 'bg-white'}`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${isWithdrawing ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}>
            <Minus className="w-6 h-6" />
          </div>
          <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest">{isWithdrawing ? 'Cancelar Retiro' : 'Retirar del Inventario'}</span>
        </button>
      </div>

      {isWithdrawing && (
        <SoftCard className="p-6 bg-red-50/30 border-red-100 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-red-600 uppercase text-xs tracking-widest">Retirar del Inventario</h3>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-red-100">
                <span className="text-[10px] font-bold text-zinc-400">Cant:</span>
                <input 
                  type="number" 
                  value={withdrawalQty}
                  onChange={(e) => setWithdrawalQty(e.target.value)}
                  className="w-10 text-center font-black text-red-600 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Selecciona el Lote (Fecha de Vencimiento)</p>
              <div className="grid grid-cols-1 gap-2">
                {item.batches?.map((batch, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedWithdrawalBatch(batch.date)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedWithdrawalBatch === batch.date 
                        ? 'bg-red-500 border-red-600 text-white shadow-md' 
                        : 'bg-white border-zinc-100 text-zinc-600 hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className={`w-4 h-4 ${selectedWithdrawalBatch === batch.date ? 'text-red-100' : 'text-zinc-400'}`} />
                      <span className="font-bold">{batch.date || 'Sin fecha'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${selectedWithdrawalBatch === batch.date ? 'text-red-100' : 'text-zinc-400'}`}>Stock:</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${selectedWithdrawalBatch === batch.date ? 'bg-red-400 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                        {batch.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!selectedWithdrawalBatch || parseInt(withdrawalQty) <= 0}
              onClick={() => handleUpdate(-parseInt(withdrawalQty), selectedWithdrawalBatch!)}
              className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
            >
              Confirmar Retiro
            </button>
          </div>
        </SoftCard>
      )}

      <SoftCard className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lotes / Fechas de Vencimiento</p>
            </div>
          </div>

          <div className="space-y-2">
            {(item.batches && item.batches.length > 0) ? (
              item.batches.map((batch, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-sm font-bold text-zinc-700">{batch.date || 'Sin fecha'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">Stock:</span>
                    <span className="px-2 py-0.5 bg-white rounded-lg text-xs font-black text-zinc-900 border border-zinc-100 shadow-sm">
                      {batch.quantity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-zinc-300 text-[10px] font-bold uppercase tracking-wider italic">
                No hay lotes con fecha registrados
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-zinc-50">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Alertas de Stock</p>
            <p className="font-bold text-zinc-700">Activadas</p>
          </div>
          <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1">
            <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
          </div>
        </div>
      </SoftCard>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" /> Historial
          </h3>
          <button className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Ver Todo</button>
        </div>

        {movements.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-zinc-50 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {m.type === 'ingreso' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-zinc-700">{m.type === 'ingreso' ? 'Ingreso' : 'Retiro'} de stock</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">{m.timestamp?.toDate().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className={`font-black ${m.type === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                {m.type === 'ingreso' ? '+' : '-'}{m.quantity}
              </p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Stock: {m.newStock}</p>
            </div>
          </div>
        ))}

        {movements.length === 0 && (
          <p className="text-center py-8 text-zinc-400 text-sm">No hay movimientos recientes.</p>
        )}
      </div>
      
      <div className="flex gap-4 pt-12">
        {isConfirmingDelete ? (
          <div className="w-full flex flex-col gap-3">
            <p className="text-sm font-bold text-red-600 text-center">¿Confirmas la eliminación permanente?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-4 px-6 bg-zinc-100 text-zinc-500 font-bold rounded-2xl"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-[2] py-4 px-6 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20"
              >
                Eliminar para siempre
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfirmingDelete(true)}
            className="w-full py-4 px-6 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-5 h-5" /> Eliminar Producto
          </button>
        )}
      </div>
    </div>
  );
}
