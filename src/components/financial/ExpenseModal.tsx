import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, Building2, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseStatus, FinancialPaymentMethod } from '@/src/types';
import { EXPENSE_CATEGORIES } from '@/src/services/financialStorage';
import { format } from 'date-fns';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('aluguel');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [status, setStatus] = useState<ExpenseStatus>('pendente');
  const [supplierName, setSupplierName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'mensal' | 'anual' | 'semanal'>('mensal');
  const [paymentMethod, setPaymentMethod] = useState<FinancialPaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialExpense) {
      setDescription(initialExpense.description);
      setCategory(initialExpense.category);
      setAmount(initialExpense.amount.toString());
      setDueDate(initialExpense.dueDate);
      setPaymentDate(initialExpense.paymentDate || '');
      setStatus(initialExpense.status);
      setSupplierName(initialExpense.supplierName || '');
      setIsRecurring(!!initialExpense.isRecurring);
      setRecurrenceInterval(initialExpense.recurrenceInterval || 'mensal');
      setPaymentMethod(initialExpense.paymentMethod || 'pix');
      setNotes(initialExpense.notes || '');
      setReceiptNumber(initialExpense.receiptNumber || '');
    } else {
      setDescription('');
      setCategory('aluguel');
      setAmount('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentDate('');
      setStatus('pendente');
      setSupplierName('');
      setIsRecurring(false);
      setRecurrenceInterval('mensal');
      setPaymentMethod('pix');
      setNotes('');
      setReceiptNumber('');
    }
    setError('');
  }, [initialExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim()) {
      setError('Informe a descrição da despesa.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido maior que zero.');
      return;
    }
    if (!dueDate) {
      setError('Informe a data de vencimento.');
      return;
    }

    const newExpense: Expense = {
      id: initialExpense?.id || `exp-${Date.now()}`,
      description: description.trim(),
      category,
      amount: parsedAmount,
      dueDate,
      paymentDate: status === 'paga' ? (paymentDate || dueDate) : undefined,
      status,
      supplierName: supplierName.trim() || undefined,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      createdAt: initialExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">
                {initialExpense ? 'Editar Despesa' : 'Novo Lançamento de Despesa'}
              </h2>
              <p className="text-xs text-neutral-400">
                Cadastre contas a pagar ou despesas já quitadas do salão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Descrição */}
          <div>
            <label className="text-neutral-300 font-semibold mb-1 block">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel do imóvel, Conta de Luz, Fatura Fornecedor..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Categoria e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Datas e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newSt = e.target.value as ExpenseStatus;
                  setStatus(newSt);
                  if (newSt === 'paga' && !paymentDate) {
                    setPaymentDate(dueDate || format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="pendente">Pendente (A pagar)</option>
                <option value="paga">Paga (Quitada)</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Data do Pagamento
              </label>
              <input
                type="date"
                disabled={status !== 'paga'}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white disabled:opacity-40 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Fornecedor e Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Fornecedor / Favorecido
              </label>
              <input
                type="text"
                placeholder="Ex: Enel, L'Oréal, Imobiliária..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as FinancialPaymentMethod)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="transferencia">Transferência / TED</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          {/* Recorrência e Nota Fiscal */}
          <div className="p-3.5 bg-[#141414] rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-medium block">Despesa Recorrente?</span>
                <span className="text-neutral-500 text-[11px]">
                  Repete periodicamente (ex: aluguel, luz, internet)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-[#d4af37] focus:ring-0 bg-white/10 border-white/20"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                <span className="text-neutral-400">Periodicidade:</span>
                <div className="flex gap-2">
                  {(['mensal', 'semanal', 'anual'] as const).map(interval => (
                    <button
                      type="button"
                      key={interval}
                      onClick={() => setRecurrenceInterval(interval)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        recurrenceInterval === interval 
                          ? 'bg-[#d4af37] text-black font-semibold' 
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NFe / Recibo & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Nº Nota Fiscal / Comprovante
              </label>
              <input
                type="text"
                placeholder="Ex: NF-12984, Boleto 4492"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-neutral-300 font-semibold mb-1 block">
                Observações
              </label>
              <input
                type="text"
                placeholder="Detalhes adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:bg-white/5 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black font-bold hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition"
            >
              {initialExpense ? 'Salvar Alterações' : 'Registrar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
