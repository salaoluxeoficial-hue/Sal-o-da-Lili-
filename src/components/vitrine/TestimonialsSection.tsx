import React from 'react';
import { Star, CheckCircle, Quote, MessageSquareQuote } from 'lucide-react';
import { ShowcaseTestimonial } from '@/src/types';

interface TestimonialsSectionProps {
  testimonials: ShowcaseTestimonial[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const published = testimonials.filter(t => t.published);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquareQuote size={20} className="text-[#d4af37]" />
          <span>Experiências & Depoimentos Verificados</span>
        </h3>
        <p className="text-neutral-400 text-xs mt-0.5">
          O que nossos clientes dizem sobre o atendimento, técnica e atmosfera do Salão Luxe
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {published.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-neutral-400 text-sm">Nenhum depoimento publicado no momento.</p>
          </div>
        ) : (
          published.map(item => (
            <div
              key={item.id}
              className="bg-[#0e0e0e] border border-white/10 hover:border-[#d4af37]/35 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all relative group"
            >
              <Quote className="absolute top-4 right-4 text-white/5 group-hover:text-[#d4af37]/15 transition-colors" size={40} />

              <div className="space-y-4">
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-[#d4af37]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < item.rating ? "fill-[#d4af37]" : "text-white/20"}
                    />
                  ))}
                  <span className="text-xs text-neutral-400 ml-1.5 font-bold">{item.rating}.0</span>
                </div>

                {/* Comment quote */}
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed italic relative z-10">
                  "{item.comment}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center gap-3 mt-6">
                {item.clientPhotoUrl ? (
                  <img
                    src={item.clientPhotoUrl}
                    alt={item.clientName}
                    className="w-10 h-10 rounded-full object-cover border border-[#d4af37]/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-bold text-xs">
                    {item.clientName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-xs truncate">{item.clientName}</span>
                    {item.verified && (
                      <span title="Atendimento Verificado">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 block truncate">
                    {item.serviceOrProduct}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
