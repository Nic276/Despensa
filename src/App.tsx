import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { AppView } from './types';
import Inventory from './views/Inventory';
import ShoppingList from './views/ShoppingList';
import AddProduct from './views/AddProduct';
import Details from './views/Details';
import Settings from './views/Settings';
import Login from './views/Login';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>('Inventory');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navigateToDetails = (id: string) => {
    setSelectedItemId(id);
    setView('Details');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fbf4]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={signInWithGoogle} />;
  }

  const renderView = () => {
    switch (view) {
      case 'Inventory': return <Inventory onSelectItem={navigateToDetails} />;
      case 'ShoppingList': return <ShoppingList />;
      case 'Add': return <AddProduct onComplete={() => setView('Inventory')} />;
      case 'Details': return <Details itemId={selectedItemId} onBack={() => setView('Inventory')} />;
      case 'Settings': return <Settings />;
      default: return <Inventory onSelectItem={navigateToDetails} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] font-sans pb-24">
      <Header user={user} view={view} onBack={() => setView('Inventory')} />
      
      <main className="max-w-xl mx-auto px-5 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav currentView={view} setView={setView} />
    </div>
  );
}
