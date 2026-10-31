import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Heart, 
  Share2, 
  Sparkles, 
  Scissors, 
  ChevronRight,
  Check
} from 'lucide-react';
import { Service } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { getServiceImage, shareContent } from '@/src/services/vitrineStorage';

interface ServicesShowcaseProps {
  services: Service[];
  favoriteIds: string[];
  onToggleFavorite: (id: string, type: 'servico' | 'produto') => void;
  onBookService: (service: Service) => void;
  onToast: (msg: string) => void;
}

const CATEGORIES = [
  { id: 'todas', label: 'Todos os Serviços' },
  { id: 'cabelo', label: 'Cabelo' },
  { id: 'barba', label: 'Barba' },
  { id: 'unhas', label: 'Unhas' },
  { id: 'estetica', label: 'Estética' },
  { id: 'maquiagem', label: 'Maquiagem' }
];

export const ServicesShowcase: React.FC<ServicesShowcaseProps> = ({
  services,
  favoriteIds,
  onToggleFavorite,
  onBookService,
  onToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState('todas');

  const filteredServices = services.filter(service => {
    if (selectedCategory === 'todas') return true;
    const cat = (service.category || '').toLowerCase();
    const name = service.name.toLowerCase();

    if (selectedCategory === 'cabelo') {
      return cat.includes('cabelo') || cat.includes('química') || cat.includes('quimica') || cat.includes('finalização') || name.includes('corte') || name.includes('escova') || name.includes('mechas');
    }
    if (selectedCategory === 'barba') {
      return cat.includes('barba') || name.includes('barba');
    }
    if (selectedCategory === 'unhas') {
      return cat.includes('unha') || cat.includes('manicure') || cat.includes('pedicure') || name.includes('unha') || name.includes('gel');
    }
    if (selectedCategory === 'estetica') {
      return cat.includes('estética') || cat.includes('estetica') || cat.includes('facial') || cat.includes('pele') || name.includes('limpeza') || name.includes('peeling');
    }
    if (selectedCategory === 'maquiagem') {
      return cat.includes('maquiagem') || cat.includes('make') || name.includes('maquiagem') || name.includes('make');
    }
    return cat.includes(selectedCategory);
  });

  const handleShare = async (service: Service) => {
    const success = await shareContent(
      `Salão Luxe - ${service.name}`,
      `Conheça o serviço exclusivo "${service.name}" no Salão Luxe por ${formatCurrency(service.price)} (${service.duration} min)!`,
      window.location.href
    );
    if (success) {
      onToast(`Link de "${service.name}" compartilhado com sucesso!`);
    } else {
      onToast(`Informações de "${service.name}" copiadas!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Pills Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors size={20} className="text-[#d4af37]" />
            <span>Menu Exclusivo de Procedimentos</span>
          </h3>
          <p className="text-neutral-400 text-xs mt-0.5">
            Trabalhos assinados por nossos especialistas com produtos importados de alta gama
          </p>
        </div>

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

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <p className="text-neutral-400 text-sm">Nenhum serviço nesta categoria no momento.</p>
          </div>
        ) : (
          filteredServices.map(service => {
            const isFav = favoriteIds.includes(service.id);
            const imageUrl = getServiceImage(service.name, service.category, service.imageUrl);

            return (
              <div
                key={service.id}
                className="bg-[#0e0e0e] border border-white/10 hover:border-[#d4af37]/40 rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xl"
              >
                {/* Photo & Overlays */}
                <div className="relative h-48 w-full overflow-hidden bg-black">
                  <img
                    src={imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-black/40" />

                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30">
                    {service.category}
                  </span>

                  {/* Actions: Favorite & Share */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleFavorite(service.id, 'servico')}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-md transition-all shadow-md",
                        isFav 
                          ? "bg-rose-500 text-white" 
                          : "bg-black/60 text-white hover:text-rose-400 hover:bg-black/80"
                      )}
                      title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Heart size={15} className={isFav ? "fill-white" : ""} />
                    </button>
                    <button
                      onClick={() => handleShare(service)}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-[#d4af37] backdrop-blur-md transition-all shadow-md"
                      title="Compartilhar serviço"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>

                  {/* Duration Chip */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    <Clock size={12} className="text-[#d4af37]" />
                    <span>{service.duration} min</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-white font-bold text-base group-hover:text-[#d4af37] transition-colors leading-snug">
                      {service.name}
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {service.description || 'Procedimento exclusivo realizado com técnicas avançadas e os melhores cosméticos profissionais.'}
                    </p>
                  </div>

                  {/* Price & Book CTA */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">A partir de</span>
                      <span className="text-lg font-extrabold text-[#d4af37]">
                        {formatCurrency(service.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => onBookService(service)}
                      className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 transform active:scale-95"
                    >
                      <Calendar size={14} />
                      <span>Agendar</span>
                    </button>
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
