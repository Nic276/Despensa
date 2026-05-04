import React from 'react';
import { AppView } from '../../types';
import { LayoutGrid, ShoppingCart, PlusCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export default function BottomNav({ currentView, setView }: BottomNavProps) {
  const tabs: { view: AppView; label: string; icon: any }[] = [
    { view: 'Inventory', label: 'Inventario', icon: LayoutGrid },
    { view: 'ShoppingList', label: 'Lista', icon: ShoppingCart },
    { view: 'Add', label: 'Añadir', icon: PlusCircle },
    { view: 'Settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-zinc-200 flex justify-around items-center px-2 py-3 pb-safe z-50 rounded-t-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.view;
        
        return (
          <button
            key={tab.view}
            onClick={() => setView(tab.view)}
            className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 ${
              isActive ? 'text-emerald-600 bg-emerald-50' : 'text-zinc-400 hover:text-emerald-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-medium mt-1 uppercase tracking-tight">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-emerald-100/30 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
