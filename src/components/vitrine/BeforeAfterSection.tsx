import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowLeftRight, 
  User, 
  Scissors, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { ShowcaseBeforeAfter, ShowcaseCategory } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface BeforeAfterSectionProps {
  items: ShowcaseBeforeAfter[];
  onBookServiceByName?: (serviceName: string) => void;
}

const CATEGORIES: { id: ShowcaseCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas as Transformações' },
  { id: 'cabelo', label: 'Cabelo' },
  { id: 'barba', label: 'Barba' },
  { id: 'unhas', label: 'Unhas' },
  { id: 'estetica', label: 'Estética' },
  { id: 'maquiagem', label: 'Maquiagem' }
];

export const BeforeAfterSection: React.FC<BeforeAfterSectionProps> = ({ 
  items,
  onBookServiceByName 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ShowcaseCategory | 'todas'>('todas');
  const [activeSliders, setActiveSliders] = useState<Record<string, number>>({});

  const publishedItems = items
    .filter(i => i.published)
    .sort((a, b) => a.order - b.order);

  const filteredItems = publishedItems.filter(item => {
    if (selectedCategory === 'todas') return true;
    return item.category === selectedCategory;
  });

  const handleSliderChange = (id: string, value: number) => {
    setActiveSliders(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-2 border border-[#d4af37]/30">
            <Sparkles size={13} />
            <span>Resultados Reais</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Galeria Antes & Depois
          </h3>
          <p className="text-neutral-400 text-xs mt-0.5">
            Arraste o divisor central para comparar a transformação de cada cliente
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Transformations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <p className="text-neutral-400 text-sm">Nenhuma transformação cadastrada nesta categoria.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const sliderPos = activeSliders[item.id] !== undefined ? activeSliders[item.id] : 50;

            return (
              <div
                key={item.id}
                className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#d4af37]/40 transition-colors"
              >
                {/* Interactive Split Viewer Container */}
                <div className="relative h-72 sm:h-80 w-full overflow-hidden select-none bg-black">
                  {/* AFTER Image (Full background) */}
                  <img
                    src={item.afterImageUrl}
                    alt={`${item.title} - Depois`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[#d4af37] text-[10px] font-extrabold uppercase tracking-wider border border-[#d4af37]/40">
                    DEPOIS
                  </div>

                  {/* BEFORE Image (Clipped overlay) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={item.beforeImageUrl}
                      alt={`${item.title} - Antes`}
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%', minWidth: '100%', height: '100%' }}
                    />
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                      ANTES
                    </div>
                  </div>

                  {/* Vertical Dividing Line & Handle */}
                  <div
                    className="absolute top-0 bottom-0 z-20 w-0.5 bg-[#d4af37] cursor-ew-resize"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-lg border-2 border-black">
                      <ArrowLeftRight size={14} />
                    </div>
                  </div>

                  {/* Range input for smooth touch/drag */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => handleSliderChange(item.id, Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    aria-label="Arrastar para comparar Antes e Depois"
                  />
                </div>

                {/* Information Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-white font-bold text-base group-hover:text-[#d4af37] transition-colors">
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-neutral-300">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Professional & Action */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Scissors size={13} className="text-[#d4af37]" />
                        <span>{item.serviceName}</span>
                      </div>
                      {item.professionalName && (
                        <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                          <User size={12} />
                          <span>Especialista: {item.professionalName}</span>
                        </div>
                      )}
                    </div>

                    {onBookServiceByName && (
                      <button
                        onClick={() => onBookServiceByName(item.serviceName)}
                        className="px-3.5 py-1.5 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Calendar size={13} />
                        <span>Quero esse resultado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
