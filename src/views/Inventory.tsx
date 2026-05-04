import React, { useState, useEffect } from 'react';
import { pantryService } from '../services/pantryService';
import { PantryItem } from '../types';
import { SoftCard, ProgressBar } from '../components/ui/SoftUI';
import { MoreVertical, AlertTriangle, Calendar, Plus, Minus, Trash2, Camera } from 'lucide-react';

interface InventoryProps {
  onSelectItem: (id: string) => void;
}

export default function Inventory({ onSelectItem }: InventoryProps) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await pantryService.getItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStockColor = (item: PantryItem) => {
    if (item.stock === 0) return 'bg-red-500';
    if (item.stock <= item.minStock) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando inventario...</div>;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <input 
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white rounded-2xl px-6 py-4 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)] border-zinc-100 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Stock Crítico</h3>
            <p className="text-xs text-red-700/80">{items.filter(i => i.stock <= i.minStock).length} artículos necesitan reposición.</p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <Calendar className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-orange-900">Vencimientos</h3>
            <p className="text-xs text-orange-700/80">Revisa tus productos pronto.</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} onClick={() => onSelectItem(item.id)} className="cursor-pointer active:scale-[0.98] transition-transform">
            <SoftCard className="group overflow-hidden">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-zinc-900 leading-tight">{item.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.stock === 0 ? 'bg-red-100 text-red-700' : 
                    item.stock <= item.minStock ? 'bg-orange-100 text-orange-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.stock === 0 ? 'Agotado' : item.stock <= item.minStock ? 'Bajo Stock' : 'Stock OK'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-1">Vence: {item.expirationDate || 'Sin fecha'}</p>
                
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-zinc-600">Stock: {item.stock} {item.unit}</span>
                    <span className="text-zinc-400">Min: {item.minStock}</span>
                  </div>
                  <ProgressBar progress={(item.stock / (item.minStock * 2)) * 100} colorClass={getStockColor(item)} />
                </div>
              </div>
            </div>
          </SoftCard>
        </div>
      ))}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="text-4xl">🛒</div>
            <p className="text-zinc-400">No se encontraron productos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
