import React, { useState, useRef } from 'react';
import { pantryService } from '../services/pantryService';
import { SoftCard } from '../components/ui/SoftUI';
import { Camera, Loader2, Check, X, RefreshCw } from 'lucide-react';

interface AddProductProps {
  onComplete: () => void;
}

export default function AddProduct({ onComplete }: AddProductProps) {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('1');
  const [unit, setUnit] = useState('unidad');
  const [minStock, setMinStock] = useState('2');
  const [expirationDate, setExpirationDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simple resize using canvas if needed, but for now just take the base64
        // To be safe with Firestore limits, we should ideally downscale
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pantryService.addItem({
        name,
        stock: Number(stock),
        unit,
        minStock: Number(minStock),
        expirationDate,
        imageUrl
      });
      onComplete();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-zinc-900">Nuevo Producto</h2>
        <p className="text-zinc-500 text-sm">Registra un alimento en tu despensa.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SoftCard className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-zinc-300" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Foto</span>
                  </div>
                )}
              </div>
              <input 
                ref={fileInputRef}
                type="input" 
                className="hidden" 
                accept="image/*" 
                onChange={handleCapture}
                // @ts-ignore
                capture="environment"
              />
              {imageUrl && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-full shadow-lg active:scale-90 transition-all border-2 border-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Nombre</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Leche Entera"
              className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Stock Actual</label>
              <input 
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Unidad</label>
              <input 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Aviso Stock Bajo</label>
              <input 
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Vencimiento</label>
              <input 
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>
          </div>
        </SoftCard>

        <div className="flex gap-4 pt-4">
          <button 
            type="button"
            onClick={onComplete}
            className="flex-1 py-4 px-6 bg-white text-zinc-500 font-bold rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> Cancelar
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className="flex-[2] py-4 px-6 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-emerald-300"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {submitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
