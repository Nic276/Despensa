import React from 'react';
import { User } from 'firebase/auth';
import { AppView } from '../../types';
import { Package, Search, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  user: User;
  view: AppView;
  onBack: () => void;
}

export default function Header({ user, view, onBack }: HeaderProps) {
  const getTitle = () => {
    switch (view) {
      case 'Inventory': return 'Despensa';
      case 'ShoppingList': return 'Lista';
      case 'Add': return 'Añadir';
      case 'Details': return 'Detalle';
      case 'Settings': return 'Ajustes';
      default: return 'Despensa';
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-zinc-200/50">
      <div className="flex justify-between items-center px-4 h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {view === 'Details' || view === 'Add' ? (
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-emerald-50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-zinc-500" />
            </button>
          ) : (
            <Package className="w-6 h-6 text-emerald-600" />
          )}
          <h1 className="text-xl font-extrabold text-emerald-600 tracking-tight">{getTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-emerald-50 transition-colors">
            <Search className="w-5 h-5 text-zinc-500" />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden ring-2 ring-emerald-100">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
