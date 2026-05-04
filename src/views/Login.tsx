import React from 'react';
import { SoftCard } from '../components/ui/SoftUI';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8">
        <svg className="w-16 h-16 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18l1 7H2l1-7z" /><path d="M2 12h20" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" /><path d="M10 16h4" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">PantryControl</h1>
      <p className="text-zinc-500 mb-12 max-w-xs">Organiza tu hogar, reduce el desperdicio y ahorra tiempo.</p>
      
      <SoftCard className="w-full max-w-sm">
        <button 
          onClick={onLogin}
          className="w-full py-4 px-6 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-6 h-6" />
          Continuar con Google
        </button>
      </SoftCard>
      
      <p className="mt-12 text-xs text-zinc-400">Tus datos se sincronizan automáticamente en la nube.</p>
    </div>
  );
}
