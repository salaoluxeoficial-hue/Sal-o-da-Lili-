import React, { useState } from 'react';
import { X, DollarSign, ShoppingBag, CreditCard, Calendar, Plus } from 'lucide-react';
import { Client, ClientPurchase, Service } from '@/src/types';
import { format } from 'date-fns';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onAddPurchase: (purchase: ClientPurchase) => void;
  services: Service[];
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  client,
  onAddPurchase,
  services,
}) => {
  if (!isOpen) return null;

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'servico' | 'produto' | 'pacote'>('produto');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ClientPurchase['paymentMethod']>('pix');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (!description.trim() || parsedAmount <= 0) return;

    const newPurchase: ClientPurchase = {
      id: 'pur-' + Date.now(),
      clientId: client.id,
      date,
      description: description.trim(),
      category,
      amount: parsedAmount,
      paymentMethod,
      status: 'pago',
      invoiceNumber: `REC-${format(new Date(), 'yyyy')}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onAddPurchase(newPurchase);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Novo Registro de Compra / Pagamento</h3>
              <p className="text-neutral-400 text-xs">Para {client.name}</p>
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['produto', 'servico', 'pacote'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    category === cat
                      ? 'bg-[#d4af37] text-black border-[#d4af37]'
                      : 'bg-[#141414] text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Descrição do Item / Serviço *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pomada Efeito Matte 80g ou Tratamento Especial"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Forma de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          <div className="pt-3 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-neutral-400 hover:bg-white/5 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#d4af37] text-black py-2.5 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              Registrar Pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
