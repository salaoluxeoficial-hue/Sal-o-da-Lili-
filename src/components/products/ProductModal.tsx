import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Image as ImageIcon, 
  Video, 
  Barcode, 
  Building2, 
  AlertCircle, 
  Percent, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Product, Supplier, ProductStatus } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { PRODUCT_CATEGORIES } from '@/src/services/productStorage';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  existingProduct?: Product | null;
  suppliers: Supplier[];
}

const PRODUCT_IMAGE_PRESETS = [
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608248597359-715764d85834?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProduct,
  suppliers,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cabelo');
  const [price, setPrice] = useState('65.00');
  const [costPrice, setCostPrice] = useState('28.00');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState<ProductStatus>('ativo');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description || '');
      setCategory(existingProduct.category);
      setPrice(String(existingProduct.price));
      setCostPrice(String(existingProduct.costPrice || (existingProduct.price * 0.45).toFixed(2)));
      setStock(String(existingProduct.stock));
      setMinStock(String(existingProduct.minStock));
      setImageUrl(existingProduct.imageUrl || '');
      setVideoUrl(existingProduct.videoUrl || '');
      setBarcode(existingProduct.barcode || '');
      setSupplierId(existingProduct.supplierId || suppliers[0]?.id || '');
      setStatus(existingProduct.status || 'ativo');
    } else {
      setName('');
      setDescription('');
      setCategory('Cabelo');
      setPrice('65.00');
      setCostPrice('28.00');
      setStock('10');
      setMinStock('5');
      setImageUrl(PRODUCT_IMAGE_PRESETS[0]);
      setVideoUrl('');
      setBarcode('789' + Math.floor(1000000000 + Math.random() * 9000000000));
      setSupplierId(suppliers[0]?.id || '');
      setStatus('ativo');
    }
    setErrorMessage(null);
  }, [existingProduct, isOpen, suppliers]);

  // Live profit calculation
  const numericPrice = parseFloat(price.replace(',', '.')) || 0;
  const numericCost = parseFloat(costPrice.replace(',', '.')) || 0;
  const unitProfit = Math.max(0, numericPrice - numericCost);
  const profitMargin = numericPrice > 0 ? (unitProfit / numericPrice) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do produto.');
      return;
    }

    if (numericPrice <= 0) {
      setErrorMessage('O preço de venda deve ser maior que zero.');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === supplierId);

    const productData: Product = {
      id: existingProduct?.id || 'prod-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      category,
      price: numericPrice,
      costPrice: numericCost,
      stock: parseInt(stock, 10) || 0,
      minStock: parseInt(minStock, 10) || 0,
      imageUrl: imageUrl.trim() || PRODUCT_IMAGE_PRESETS[0],
      videoUrl: videoUrl.trim() || undefined,
      barcode: barcode.trim() || undefined,
      supplierId: supplierId || undefined,
      supplierName: selectedSupplier?.name || undefined,
      status,
      salesCount: existingProduct?.salesCount || 0,
      createdAt: existingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(productData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {existingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="text-neutral-400 text-xs">
                Controle de inventário, custos, preços de venda e fornecedores.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Imagem do Produto & Presets */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-neutral-900 border-2 border-[#d4af37]/40 overflow-hidden shrink-0 flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-[#d4af37]" />
              )}
            </div>
            <div className="space-y-2 w-full text-center sm:text-left">
              <span className="text-xs font-bold text-neutral-300 block">Foto de Alta Resolução</span>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset)}
                    className={cn(
                      "w-8 h-8 rounded-lg overflow-hidden border-2 transition-all",
                      imageUrl === preset ? "border-[#d4af37] scale-110" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input
                type="url"
                placeholder="Ou cole a URL direta da imagem..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={13} className="text-[#d4af37]" />
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Pomada Modeladora Efeito Matte 80g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={13} className="text-[#d4af37]" />
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              >
                {PRODUCT_CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Descrição Detalhada do Produto
            </label>
            <textarea
              rows={2}
              placeholder="Benefícios, modo de uso, composição ou recomendações para o cliente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50 resize-none"
            />
          </div>

          {/* Preços e Lucratividade */}
          <div className="p-4 bg-gradient-to-br from-[#141414] to-[#101010] border border-[#d4af37]/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#d4af37]" />
                Precificação & Lucratividade
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">Margem:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] font-bold">
                  {profitMargin.toFixed(1)}%
                </span>
                <span className="text-neutral-400">• Lucro Un.:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(unitProfit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Custo de Aquisição (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                  Preço de Venda ao Consumidor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-[#181818] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* Estoque e Alerta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Quantidade Atual em Estoque *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} />
                Estoque Mínimo (Alerta de Reposição) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="5"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full bg-[#141414] border border-rose-500/30 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500/60"
              />
            </div>
          </div>

          {/* Fornecedor e Código de Barras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-[#d4af37]" />
                Fornecedor Associado
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              >
                <option value="">Nenhum / Próprio</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode size={13} className="text-[#d4af37]" />
                Código de Barras / SKU
              </label>
              <input
                type="text"
                placeholder="Ex: 7891000123456"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          {/* Vídeo Demonstrativo e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Video size={13} className="text-[#d4af37]" />
                Vídeo Demonstrativo (Link YouTube/Vimeo)
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Status no Catálogo
              </label>
              <div className="flex bg-[#141414] border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setStatus('ativo')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    status === 'ativo' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Ativo (Disponível)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inativo')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    status === 'inativo' ? "bg-neutral-500/20 text-neutral-300 border border-neutral-500/30" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Inativo (Pausado)
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-neutral-400 hover:bg-white/5 transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#d4af37] text-black py-3 px-6 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/10"
            >
              {existingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
