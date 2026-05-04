import React from 'react';
import { auth } from '../lib/firebase';
import { SoftCard } from '../components/ui/SoftUI';
import { LogOut, Cloud, ShieldCheck, Wifi, RefreshCw } from 'lucide-react';

export default function Settings() {
  const user = auth.currentUser;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-24 h-24 mb-6 relative">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
            alt="Profile" 
            className="w-full h-full rounded-3xl object-cover shadow-2xl border-4 border-white"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">{user?.displayName || 'Usuario'}</h2>
        <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-zinc-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sincronizado</span>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Cloud Sync</h3>
        <SoftCard className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 leading-tight">Respaldo solo por Wi-Fi</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Ahorra datos móviles</p>
              </div>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 leading-tight">Sincronización Automática</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Cambios en tiempo real</p>
              </div>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
            </div>
          </div>
        </SoftCard>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Cuenta</h3>
        <SoftCard>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 text-red-500 font-bold py-2"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            Cerrar Sesión
          </button>
        </SoftCard>
      </section>

      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-4 mt-8">
        <Cloud className="w-8 h-8 text-emerald-600 shrink-0" />
        <div>
          <h4 className="font-bold text-emerald-900 text-sm">Espacio de Almacenamiento</h4>
          <p className="text-xs text-emerald-700/70 mt-1">Tus datos están protegidos y guardados en tu espacio privado de Firebase/Google Drive.</p>
        </div>
      </div>
    </div>
  );
}
