import React, { useState, useEffect } from 'react';
import { pantryService } from '../services/pantryService';
import { ShoppingItem } from '../types';
import { SoftCard } from '../components/ui/SoftUI';
import { Info, Check, Package, ShoppingCart as CartIcon } from 'lucide-react';

export default function ShoppingList() {
  const [list, setList] = useState<ShoppingItem[]>([]);
  const [pantryItems, setPantryItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const [shoppingData, pantryData] = await Promise.all([
        pantryService.getShoppingList(),
        pantryService.getItems()
      ]);
      
      const stockMap: Record<string, number> = {};
      pantryData.forEach(item => {
        stockMap[item.name] = item.stock;
      });
      
      setPantryItems(stockMap);
      setList(shoppingData);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    try {
      await pantryService.toggleShoppingItem(item.id, !item.isChecked);
      setList(list.map(i => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando lista...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-zinc-900">Lista de Compras</h2>
        <div className="mt-4 bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-xl flex gap-3 text-emerald-800 text-sm">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>La lista se actualiza automáticamente según el nivel de stock en tu inventario.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-600/20 whitespace-nowrap">Todo</button>
      </div>

      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-50">
            <div className="text-4xl">📝</div>
            <p className="text-zinc-500 font-medium">Tu lista está vacía.</p>
          </div>
        ) : (
          list.map(item => (
            <div key={item.id}>
              <SoftCard className="flex items-center gap-4 py-4" onClick={() => handleToggle(item)}>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <CartIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-lg truncate transition-all ${item.isChecked ? 'text-zinc-300' : 'text-zinc-900'}`}>{item.name}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 opacity-60">
                      <Package className="w-3 h-3 text-zinc-400" />
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">En despensa: {pantryItems[item.name] || 0}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-orange-400" />
                      <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest leading-none">Comprar: {item.requiredQuantity}</p>
                    </div>
                  </div>
                </div>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${
                    item.isChecked 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]' 
                      : 'bg-white border-zinc-300 text-transparent shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[4px]" />
                </div>
              </SoftCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
