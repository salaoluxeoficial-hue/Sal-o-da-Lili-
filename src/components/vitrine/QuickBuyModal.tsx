import React, { useState } from 'react';
import { ShoppingBag, X, Check, CreditCard, QrCode, Banknote, User } from 'lucide-react';
import { Product, Client, Order } from '@/src/types';
import { formatCurrency } from '@/src/lib/utils';

interface QuickBuyModalProps {
  product: Product | null;
  onClose: () => void;
  clients: Client[];
  onConfirmOrder: (order: Order, updatedProduct?: Product) => void;
}

export const QuickBuyModal: React.FC<QuickBuyModalProps> = ({
  product,
  onClose,
  clients,
  onConfirmOrder
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro'>('pix');

  const maxQty = Math.max(1, product.stock);
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientName = selectedClientId ? (selectedClient?.name || 'Cliente') : (guestName || 'Cliente Balcão');
  const totalPrice = product.price * quantity;
  const totalCost = product.costPrice * quantity;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || quantity > product.stock) return;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      clientId: selectedClientId || 'guest',
      clientName: clientName,
      clientPhone: selectedClient?.phone,
      items: [
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          costPrice: product.costPrice,
          quantity: quantity,
          imageUrl: product.imageUrl
        }
      ],
      totalAmount: totalPrice,
      totalCost: totalCost,
      paymentMethod: paymentMethod,
      paymentStatus: 'pago',
      stockDeducted: false, // processOrderSale will set it true and record movement
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      notes: 'Pedido realizado através da Vitrine Digital do Salão Luxe'
    };

    onConfirmOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleConfirm}
        className="bg-[#111111] border border-[#d4af37]/35 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center border border-[#d4af37]/30">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Adquirir Produto</h3>
              <p className="text-[11px] text-neutral-400">Checkout imediato da vitrine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Details Bar */}
        <div className="px-5 pt-1">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-contain bg-black p-1 border border-white/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-xs truncate">{product.name}</h4>
              <span className="text-[11px] text-neutral-400 block">{product.category}</span>
              <span className="text-sm font-extrabold text-[#d4af37] block mt-0.5">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-5 space-y-3 text-xs">
          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <label className="text-neutral-400 font-medium">Quantidade:</label>
            <div className="flex items-center gap-3 bg-black/60 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold hover:bg-[#d4af37] hover:text-black transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-white font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold hover:bg-[#d4af37] hover:text-black transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Client picker */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">Cliente Vinculado:</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Cliente Avulso / Balcão</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {!selectedClientId && (
            <div>
              <label className="block text-neutral-400 font-medium mb-1">Nome do Cliente:</label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Ex: João Victor"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">Forma de Pagamento:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <QrCode size={14} />
                <span>Pix</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <CreditCard size={14} />
                <span>Cartão Crédito</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <CreditCard size={14} />
                <span>Débito</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <Banknote size={14} />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161616] border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Total a Pagar</span>
            <span className="text-base font-extrabold text-[#d4af37]">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20"
            >
              <Check size={16} />
              <span>Confirmar Venda</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
