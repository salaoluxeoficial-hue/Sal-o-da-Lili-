import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  User, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { Product, Client, Order, OrderItem, StockMovement, ClientPurchase } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { format } from 'date-fns';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  clients: Client[];
  products: Product[];
  onOrderCompleted: (order: Order, updatedProducts: Product[], newMovements: StockMovement[], newClientPurchase?: ClientPurchase) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  clients,
  products,
  onOrderCompleted,
}) => {
  if (!isOpen) return null;

  const [selectedClientId, setSelectedClientId] = useState<string>('balcao');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro'>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Total calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.costPrice * item.quantity), 0);
  }, [cart]);

  const totalProfit = Math.max(0, totalAmount - totalCost);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('A sacola está vazia.');
      return;
    }

    // Check stock availability
    for (const item of cart) {
      const currentProd = products.find(p => p.id === item.product.id);
      if (!currentProd || currentProd.stock < item.quantity) {
        setErrorMessage(`Estoque insuficiente para "${item.product.name}". Saldo disponível: ${currentProd?.stock || 0}.`);
        return;
      }
    }

    const orderId = 'ord-' + Date.now();
    const isPaid = paymentStatus === 'pago';

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      costPrice: item.product.costPrice,
      quantity: item.quantity,
      imageUrl: item.product.imageUrl,
    }));

    const newOrder: Order = {
      id: orderId,
      clientId: selectedClientId,
      clientName: selectedClientId === 'balcao' ? 'Consumidor Balcão' : (selectedClient?.name || 'Cliente'),
      clientPhone: selectedClient?.phone,
      items: orderItems,
      totalAmount,
      totalCost,
      paymentMethod,
      paymentStatus,
      stockDeducted: isPaid, // Strictly true ONLY if payment is paid!
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    // If paid, deduct stock and create stock movements
    let updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    if (isPaid) {
      for (const item of cart) {
        const prodIndex = updatedProducts.findIndex(p => p.id === item.product.id);
        if (prodIndex !== -1) {
          const oldStock = updatedProducts[prodIndex].stock;
          const nextStock = Math.max(0, oldStock - item.quantity);
          const oldSales = updatedProducts[prodIndex].salesCount || 0;

          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            stock: nextStock,
            salesCount: oldSales + item.quantity,
            updatedAt: new Date().toISOString(),
          };

          newMovements.push({
            id: 'mov-' + Date.now() + '-' + item.product.id,
            productId: item.product.id,
            productName: item.product.name,
            type: 'venda',
            quantity: item.quantity,
            previousStock: oldStock,
            newStock: nextStock,
            reason: `Venda balcão - Pedido #${orderId.toUpperCase()}`,
            date: new Date().toISOString(),
            performedBy: 'PDV Balcão',
            orderId,
            unitCost: item.product.costPrice,
          });
        }
      }
    }

    // Client purchase record if not generic balcao and paid
    let clientPurchaseRecord: ClientPurchase | undefined;
    if (isPaid && selectedClientId !== 'balcao' && selectedClient) {
      clientPurchaseRecord = {
        id: 'pur-' + Date.now(),
        clientId: selectedClient.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: cart.map(i => `${i.quantity}x ${i.product.name}`).join(', '),
        category: 'produto',
        amount: totalAmount,
        paymentMethod,
        status: 'pago',
        invoiceNumber: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      };
    }

    onOrderCompleted(newOrder, updatedProducts, newMovements, clientPurchaseRecord);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClearCart();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex justify-end animate-in fade-in duration-200">
      <div className="bg-[#0c0c0c] border-l border-[#d4af37]/30 w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 bg-gradient-to-r from-[#141414] to-[#0c0c0c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Sacola de Vendas & PDV</h3>
              <p className="text-neutral-400 text-xs">
                {cart.length} item{cart.length === 1 ? '' : 'ns'} na sacola de balcão
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

        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in zoom-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white">Venda Registrada com Sucesso!</h3>
            <p className="text-neutral-400 text-xs max-w-xs">
              {paymentStatus === 'pago' 
                ? 'Estoque atualizado e pagamento confirmado no sistema financeiro.'
                : 'Pedido registrado como pendente. O estoque não foi debitado e aguarda confirmação de pagamento.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Scrollable list of items and settings */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Client Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-[#d4af37]" />
                  Identificação do Cliente
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                >
                  <option value="balcao">Consumidor Balcão / Não Identificado</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Itens Adicionados
                  </label>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Esvaziar Sacola
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {cart.map(item => {
                    const hasStock = item.product.stock >= item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-xl bg-[#141414] border border-white/5 flex items-center justify-between gap-3"
                      >
                        <div className="w-12 h-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-white/10">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">Foto</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-xs truncate">{item.product.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                            <span>{formatCurrency(item.product.price)} un.</span>
                            <span>•</span>
                            <span className={cn(hasStock ? "text-neutral-500" : "text-rose-400 font-bold")}>
                              Estoque: {item.product.stock} un
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="text-right shrink-0">
                          <span className="text-white font-bold text-xs block">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-neutral-500 hover:text-rose-400 transition-colors mt-0.5"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length === 0 && (
                    <div className="py-12 text-center text-neutral-500 text-xs bg-[#141414] border border-white/5 rounded-2xl">
                      Nenhum produto adicionado à sacola ainda. Clique no ícone de sacola em qualquer produto do catálogo.
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Settings */}
              {cart.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-[#d4af37]" />
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'pix', label: 'PIX' },
                        { id: 'cartao_credito', label: 'Crédito' },
                        { id: 'cartao_debito', label: 'Débito' },
                        { id: 'dinheiro', label: 'Dinheiro' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={cn(
                            "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                            paymentMethod === m.id
                              ? "bg-[#d4af37] text-black border-[#d4af37]"
                              : "bg-[#141414] text-neutral-400 border-white/10 hover:text-white"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status (Regra: pendente não desconta estoque) */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Status do Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('pago')}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                          paymentStatus === 'pago'
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                        )}
                      >
                        <CheckCircle2 size={14} />
                        Pago Agora (Baixa Estoque)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('pendente')}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                          paymentStatus === 'pendente'
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                        )}
                      >
                        <Clock size={14} />
                        Pendente (Não Desconta)
                      </button>
                    </div>
                    {paymentStatus === 'pendente' && (
                      <p className="text-[11px] text-amber-400 pt-1">
                        * O pedido será salvo como pendente e o estoque físico só será descontado após a confirmação do pagamento.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Checkout Panel */}
            <div className="p-6 bg-[#141414] border-t border-white/10 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Subtotal dos Produtos:</span>
                  <span className="text-white font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Lucro Bruto Estimado:</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(totalProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-2 border-t border-white/5">
                  <span className="font-bold text-white">Total a Pagar:</span>
                  <span className="font-black text-xl text-[#d4af37]">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-neutral-400 hover:bg-white/5 text-xs transition-colors"
                >
                  Continuar Escolhendo
                </button>
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="flex-1 py-3 bg-[#d4af37] text-black font-bold text-xs rounded-xl hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar Venda ({formatCurrency(totalAmount)})
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
