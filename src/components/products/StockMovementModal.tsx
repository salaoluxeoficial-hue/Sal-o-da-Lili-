import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product, StockMovement, StockMovementType } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string;
  onConfirmMovement: (movement: StockMovement) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onConfirmMovement,
}) => {
  if (!isOpen) return null;

  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [type, setType] = useState<StockMovementType>('entrada');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Reposição de estoque');
  const [performedBy, setPerformedBy] = useState('Gerência de Estoque');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === productId);
  const currentStock = selectedProduct?.stock || 0;
  const numQuantity = parseInt(quantity, 10) || 0;

  const projectedStock = type === 'entrada' 
    ? currentStock + numQuantity 
    : Math.max(0, currentStock - numQuantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProduct) {
      setErrorMessage('Selecione um produto.');
      return;
    }

    if (numQuantity <= 0) {
      setErrorMessage('A quantidade deve ser maior que zero.');
      return;
    }

    if (type === 'saida' && numQuantity > currentStock) {
      setErrorMessage(`Estoque insuficiente! Saldo atual é de apenas ${currentStock} unidades.`);
      return;
    }

    const movement: StockMovement = {
      id: 'mov-' + Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type,
      quantity: numQuantity,
      previousStock: currentStock,
      newStock: projectedStock,
      reason: reason.trim() || (type === 'entrada' ? 'Entrada manual' : 'Saída manual'),
      date: new Date().toISOString(),
      performedBy: performedBy.trim() || 'Equipe Luxe',
      unitCost: selectedProduct.costPrice,
    };

    onConfirmMovement(movement);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Movimentação de Estoque</h3>
              <p className="text-neutral-400 text-xs">Registrar entrada ou saída de mercadorias.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tipo de Movimentação */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('entrada');
                  setReason('Reposição de estoque / Compra de fornecedor');
                }}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                  type === 'entrada'
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                )}
              >
                <ArrowUpRight size={16} />
                Entrada (Adicionar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('saida');
                  setReason('Consumo interno na bancada do salão');
                }}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                  type === 'saida'
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/10"
                    : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                )}
              >
                <ArrowDownRight size={16} />
                Saída (Baixa)
              </button>
            </div>
          </div>

          {/* Produto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Produto *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Estoque atual: {p.stock} un)
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade e Saldo Projetado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="p-3 bg-[#141414] border border-white/5 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Novo Saldo Projetado</span>
              <p className={cn(
                "text-lg font-bold mt-0.5",
                type === 'entrada' ? "text-emerald-400" : "text-amber-400"
              )}>
                {projectedStock} unidades
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Motivo / Justificativa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nota Fiscal 1234, Consumo no lavatório, Avaria..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Responsável pelo Lançamento
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-neutral-400 hover:bg-white/5 text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-xs transition-all shadow-md",
                type === 'entrada'
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              )}
            >
              Confirmar {type === 'entrada' ? 'Entrada' : 'Baixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
