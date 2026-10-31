import React, { useState } from 'react';
import { Image as ImageIcon, Play, X, ExternalLink, Sparkles } from 'lucide-react';
import { ShowcaseGalleryItem } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface SalonGalleryProps {
  items: ShowcaseGalleryItem[];
}

const CATEGORIES = [
  { id: 'todos', label: 'Toda a Galeria' },
  { id: 'ambiente', label: 'Ambiente & Design' },
  { id: 'espaco_vip', label: 'Espaço VIP & Noivas' },
  { id: 'procedimentos', label: 'Procedimentos' },
  { id: 'equipe', label: 'Equipe de Mestres' }
];

export const SalonGallery: React.FC<SalonGalleryProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [activeItem, setActiveItem] = useState<ShowcaseGalleryItem | null>(null);

  const published = items
    .filter(i => i.published)
    .sort((a, b) => a.order - b.order);

  const filtered = published.filter(item => {
    if (selectedCategory === 'todos') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon size={20} className="text-[#d4af37]" />
            <span>Nossa Estrutura & Bastidores</span>
          </h3>
          <p className="text-neutral-400 text-xs mt-0.5">
            Conheça o espaço planejado para o seu máximo conforto, bem-estar e privacidade
          </p>
        </div>

        {/* Filter Pills */}
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

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <p className="text-neutral-400 text-sm">Nenhuma foto ou vídeo cadastrado nesta categoria.</p>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group relative h-64 rounded-2xl overflow-hidden bg-black border border-white/10 hover:border-[#d4af37]/50 cursor-pointer shadow-lg transition-all"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {item.videoUrl && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-lg">
                  <Play size={14} className="fill-black ml-0.5" />
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#d4af37] block mb-0.5">
                  {item.category.replace('_', ' ')}
                </span>
                <h4 className="text-white font-bold text-sm leading-snug line-clamp-1">
                  {item.title}
                </h4>
                {item.caption && (
                  <p className="text-neutral-300 text-[11px] mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#161616]">
              <div>
                <h4 className="text-white font-bold text-sm sm:text-base">{activeItem.title}</h4>
                <span className="text-xs text-[#d4af37] uppercase font-bold tracking-wider">
                  {activeItem.category.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center overflow-auto max-h-[70vh]">
              {activeItem.videoUrl ? (
                activeItem.videoUrl.includes('youtube.com') || activeItem.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={activeItem.videoUrl.replace('watch?v=', 'embed/')}
                    title={activeItem.title}
                    className="w-full h-96 rounded-xl"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeItem.videoUrl}
                    controls
                    autoPlay
                    className="max-h-[65vh] max-w-full rounded-xl"
                  />
                )
              ) : (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>

            {activeItem.caption && (
              <div className="p-4 bg-[#141414] border-t border-white/5">
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {activeItem.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
