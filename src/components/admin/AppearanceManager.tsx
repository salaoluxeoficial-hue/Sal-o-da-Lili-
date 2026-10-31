import React, { useState } from 'react';
import { Palette, Type, Layout, Sliders, CheckCircle2, RefreshCw, Sparkles, Layers } from 'lucide-react';
import { AppearanceSettings, DEFAULT_APPEARANCE, getInitialAppearance, saveAppearance } from '@/src/services/appearanceStorage';
import { cn } from '@/src/lib/utils';

export const AppearanceManager: React.FC = () => {
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => getInitialAppearance());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (updated?: AppearanceSettings) => {
    const toSave = updated || appearance;
    saveAppearance(toSave);
    setAppearance(toSave);
    showToast('Aparência e layout atualizados em todo o aplicativo!');
  };

  const handleReset = () => {
    saveAppearance(DEFAULT_APPEARANCE);
    setAppearance(DEFAULT_APPEARANCE);
    showToast('Aparência restaurada para o padrão de fábrica.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#d4af37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[#d4af37]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101010] border border-[#d4af37]/25 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Aparência & Dimensões do Aplicativo
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
              ADM Layout
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Ajuste a densidade das informações, tamanho de fontes, títulos, cartões e espaçamentos em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-2xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>

      {/* Appearance Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Font Size Control */}
        <div className="bg-[#101010] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Type size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tamanho Geral das Fontes</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pequena', label: 'Pequena (Compacta)' },
              { id: 'media', label: 'Média (Padrão)' },
              { id: 'grande', label: 'Grande (Acessível)' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  const updated = { ...appearance, fontSize: opt.id as any };
                  setAppearance(updated);
                  handleSave(updated);
                }}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold transition-all text-center",
                  appearance.fontSize === opt.id
                    ? "bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Title Scale Control */}
        <div className="bg-[#101010] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Escala dos Títulos</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compacto', label: 'Compacto' },
              { id: 'padrao', label: 'Padrão Salão' },
              { id: 'destacado', label: 'Destacado' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  const updated = { ...appearance, titleScale: opt.id as any };
                  setAppearance(updated);
                  handleSave(updated);
                }}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold transition-all text-center",
                  appearance.titleScale === opt.id
                    ? "bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Card Padding & Spacing */}
        <div className="bg-[#101010] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Layout size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Espaçamento dos Cartões</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compacto', label: 'Compacto' },
              { id: 'confortavel', label: 'Confortável' },
              { id: 'espacoso', label: 'Espaçoso' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  const updated = { ...appearance, cardPadding: opt.id as any };
                  setAppearance(updated);
                  handleSave(updated);
                }}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold transition-all text-center",
                  appearance.cardPadding === opt.id
                    ? "bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Density Control */}
        <div className="bg-[#101010] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Densidade de Informações</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compacto', label: 'Alta Densidade' },
              { id: 'confortavel', label: 'Equilibrada' },
              { id: 'expandido', label: 'Expandida' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  const updated = { ...appearance, density: opt.id as any };
                  setAppearance(updated);
                  handleSave(updated);
                }}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold transition-all text-center",
                  appearance.density === opt.id
                    ? "bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
