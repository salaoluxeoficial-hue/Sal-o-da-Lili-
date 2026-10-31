import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#d4af37]">
        <Construction size={40} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-neutral-400 mt-2 max-w-md mx-auto">
          Esta seção está em desenvolvimento. Em breve você poderá gerenciar todas as funcionalidades de {title.toLowerCase()} aqui.
        </p>
      </div>
      <div className="flex gap-4">
        <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse delay-75" />
        <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse delay-150" />
      </div>
    </div>
  );
};
