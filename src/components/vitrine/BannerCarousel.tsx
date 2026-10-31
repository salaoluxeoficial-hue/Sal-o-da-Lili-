import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { ShowcaseBanner } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface BannerCarouselProps {
  banners: ShowcaseBanner[];
  onActionClick: (banner: ShowcaseBanner) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onActionClick }) => {
  const publishedBanners = banners
    .filter(b => b.published)
    .sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (publishedBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % publishedBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [publishedBanners.length, isPaused]);

  if (publishedBanners.length === 0) return null;

  const current = publishedBanners[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + publishedBanners.length) % publishedBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % publishedBanners.length);
  };

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden border border-[#d4af37]/30 shadow-2xl bg-black min-h-[380px] sm:min-h-[460px] md:min-h-[520px] flex items-center group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image / Video with Gradient Fade */}
      <div className="absolute inset-0 z-0">
        <img
          src={current.imageUrl}
          alt={current.title}
          className="w-full h-full object-cover object-center transition-all duration-1000 scale-105 group-hover:scale-100 filter brightness-75"
        />
        {/* Multi-stage Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 p-6 sm:p-12 md:p-16 max-w-2xl space-y-4">
        {current.badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] text-xs font-bold tracking-widest uppercase backdrop-blur-md">
            <Sparkles size={13} />
            <span>{current.badge}</span>
          </div>
        )}

        {current.subtitle && (
          <p className="text-[#d4af37] font-semibold text-xs sm:text-sm tracking-wider uppercase">
            {current.subtitle}
          </p>
        )}

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {current.title}
        </h2>

        <p className="text-neutral-300 text-xs sm:text-base leading-relaxed line-clamp-3 max-w-xl">
          {current.description}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={() => onActionClick(current)}
            className="px-6 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#e5c158] hover:from-[#e5c158] hover:to-[#d4af37] text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#d4af37]/25 flex items-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {current.ctaAction === 'agendar' ? (
              <Calendar size={18} />
            ) : current.ctaAction === 'produtos' ? (
              <ShoppingBag size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
            <span>{current.ctaText || 'Agendar Experiência'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {publishedBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-[#d4af37] text-white hover:text-black border border-white/10 hover:border-[#d4af37] transition-all backdrop-blur-md opacity-80 group-hover:opacity-100"
            aria-label="Banner anterior"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-[#d4af37] text-white hover:text-black border border-white/10 hover:border-[#d4af37] transition-all backdrop-blur-md opacity-80 group-hover:opacity-100"
            aria-label="Próximo banner"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Progress Indicators */}
      {publishedBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {publishedBanners.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentIndex === idx 
                  ? "w-8 bg-[#d4af37] shadow-sm shadow-[#d4af37]/50" 
                  : "w-2 bg-white/30 hover:bg-white/60"
              )}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
