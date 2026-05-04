import React from 'react';

interface SoftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const SoftCard = ({ children, className = '', onClick, ...props }: SoftCardProps) => (
  <div 
    onClick={onClick}
    {...props}
    className={`bg-white rounded-2xl p-4 border border-zinc-50 shadow-[12px_12px_24px_rgba(0,0,0,0.03),-8px_-8px_16px_rgba(255,255,255,0.9)] transition-all ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

interface ProgressBarProps {
  progress: number; // 0 to 100
  colorClass?: string;
}

export const ProgressBar = ({ progress, colorClass = 'bg-emerald-500' }: ProgressBarProps) => (
  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
    <div 
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
    />
  </div>
);
