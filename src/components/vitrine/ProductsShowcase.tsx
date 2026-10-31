import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Share2, 
  Play, 
  Sparkles, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';
import { Product } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { shareContent } from '@/src/services/vitrineStorage';

interface ProductsShowcaseProps {
  products: Product[];
  favoriteIds: string[];
  onToggleFavorite: (id: string, type: 'servico' | 'produto') => void;
  onBuyProduct: (product: Product) => void;
  onToast: (msg: string) => void;
}

export const ProductsShowcase: React.FC<ProductsShowcaseProps> = ({
  products,
  favoriteIds,
  onToggleFavorite,
  onBuyProduct,
  onToast
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const activeProducts = products
    .filter(p => p.status === 'ativo')
    .slice(0, 8); // Showcase top products

  const handleShare = async (product: Product) => {
    const success = await shareContent(
      `Salão Luxe - ${product.name}`,
      `Adquira o produto "${product.name}" na boutique do Salão Luxe por ${formatCurrency(product.price)}!`,
      window.location.href
    );
    if (success) {
      onToast(`Link de "${product.name}" compartilhado!`);
    } else {
      onToast(`Dados de "${product.name}" copiados com sucesso!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#d4af37]" />
            <span>Boutique & Cosméticos Home Care</span>
          </h3>
          <p className="text-neutral-400 text-xs mt-0.5">
            Os mesmos produtos e linhas profissionais utilizados em nossas bancadas
          </p>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <p className="text-neutral-400 text-sm">Nenhum produto em destaque no momento.</p>
          </div>
        ) : (
          activeProducts.map(product => {
            const isFav = favoriteIds.includes(product.id);
            const inStock = product.stock > 0;

            return (
              <div
                key={product.id}
                className="bg-[#0e0e0e] border border-white/10 hover:border-[#d4af37]/40 rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xl"
              >
                {/* Photo with Overlay */}
                <div className="relative h-52 w-full overflow-hidden bg-black flex items-center justify-center p-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-black/30 pointer-events-none" />

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10">
                    {product.category}
                  </span>

                  {/* Video Play trigger if video exists */}
                  {product.videoUrl && (
                    <button
                      onClick={() => setActiveVideoUrl(product.videoUrl!)}
                      className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#d4af37]/90 hover:bg-[#d4af37] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      title="Assistir ao vídeo do produto"
                    >
                      <Play size={18} className="fill-black ml-0.5" />
                    </button>
                  )}

                  {/* Favorite & Share buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleFavorite(product.id, 'produto')}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-md transition-all shadow-md",
                        isFav 
                          ? "bg-rose-500 text-white" 
                          : "bg-black/60 text-white hover:text-rose-400 hover:bg-black/80"
                      )}
                      title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Heart size={14} className={isFav ? "fill-white" : ""} />
                    </button>
                    <button
                      onClick={() => handleShare(product)}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-[#d4af37] backdrop-blur-md transition-all shadow-md"
                      title="Compartilhar produto"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>

                  {/* Stock Status Pill */}
                  <div className="absolute bottom-3 left-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      inStock 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    )}>
                      {inStock ? `${product.stock} em estoque` : 'Esgotado'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-white font-semibold text-sm group-hover:text-[#d4af37] transition-colors line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Buy Action */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-[#d4af37]">
                      {formatCurrency(product.price)}
                    </span>

                    <button
                      onClick={() => onBuyProduct(product)}
                      disabled={!inStock}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
                        inStock
                          ? "bg-white/10 hover:bg-[#d4af37] text-white hover:text-black active:scale-95"
                          : "bg-white/5 text-neutral-600 cursor-not-allowed"
                      )}
                    >
                      <ShoppingBag size={14} />
                      <span>{inStock ? 'Comprar' : 'Indisponível'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Video Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#d4af37]/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white text-sm font-bold flex items-center gap-2">
                <Play size={16} className="text-[#d4af37]" />
                Vídeo Demonstrativo do Produto
              </span>
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center min-h-[300px]">
              {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={activeVideoUrl.replace('watch?v=', 'embed/')}
                  title="Vídeo do Produto"
                  className="w-full h-80 rounded-xl"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-96 rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
