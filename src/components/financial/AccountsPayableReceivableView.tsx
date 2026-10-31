import React, { useState, useMemo } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  QrCode, 
  CreditCard, 
  DollarSign,
  User,
  Building2,
  Check
} from 'lucide-react';
import { Expense, Appointment, Order, FinancialPaymentMethod } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { EXPENSE_CATEGORIES } from '@/src/services/financialStorage';
import { isPast, parseISO, isToday } from 'date-fns';

interface AccountsPayableReceivableViewProps {
  expenses: Expense[];
  appointments: Appointment[];
  orders: Order[];
  onSettleExpense: (expense: Expense) => void;
  onReceiveAppointmentPayment: (appointment: Appointment, method: FinancialPaymentMethod) => void;
  onReceiveOrderPayment: (order: Order, method: FinancialPaymentMethod) => void;
  onOpenPixCharge: (amount: number, clientName: string, description: string, refType: 'servico' | 'produto' | 'avulso', refId?: string) => void;
  onOpenNewExpense: () => void;
}

export const AccountsPayableReceivableView: React.FC<AccountsPayableReceivableViewProps> = ({
  expenses,
  appointments,
  orders,
  onSettleExpense,
  onReceiveAppointmentPayment,
  onReceiveOrderPayment,
  onOpenPixCharge,
  onOpenNewExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'pagar' | 'receber'>('pagar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'pagos' | 'vencidos'>('pendentes');

  // Contas a pagar computations
  const payableStats = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let paid = 0;

    expenses.forEach(exp => {
      if (exp.status === 'paga') {
        paid += exp.amount;
      } else {
        pending += exp.amount;
        const due = parseISO(exp.dueDate);
        if (isPast(due) && !isToday(due)) {
          overdue += exp.amount;
        }
      }
    });

    return { pending, overdue, paid };
  }, [expenses]);

  // Contas a receber computations (from appointments pending + orders pending)
  const receivableStats = useMemo(() => {
    let pendingAppointments = 0;
    let pendingOrders = 0;

    appointments.forEach(apt => {
      // Pending if completed or in progress but not paid yet
      const isPaid = apt.paymentStatus === 'pago';
      const isCancelled = apt.status === 'cancelado';
      if (!isPaid && !isCancelled) {
        pendingAppointments += apt.totalPrice;
      }
    });

    orders.forEach(ord => {
      if (ord.paymentStatus === 'pendente') {
        pendingOrders += ord.totalAmount;
      }
    });

    return {
      total: pendingAppointments + pendingOrders,
      appointments: pendingAppointments,
      orders: pendingOrders
    };
  }, [appointments, orders]);

  // Filtered expenses (Contas a Pagar)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.supplierName && exp.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

      const due = parseISO(exp.dueDate);
      const isOverdue = isPast(due) && !isToday(due) && exp.status !== 'paga';

      if (statusFilter === 'pendentes') return matchesSearch && exp.status !== 'paga';
      if (statusFilter === 'pagos') return matchesSearch && exp.status === 'paga';
      if (statusFilter === 'vencidos') return matchesSearch && isOverdue;

      return matchesSearch;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [expenses, searchTerm, statusFilter]);

  // Filtered receivables (Contas a Receber)
  const filteredReceivables = useMemo(() => {
    const list: {
      id: string;
      type: 'servico' | 'produto';
      title: string;
      clientName: string;
      clientPhone?: string;
      amount: number;
      date: string;
      status: 'pendente' | 'pago';
      rawAppointment?: Appointment;
      rawOrder?: Order;
    }[] = [];

    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;
      const isPaid = apt.paymentStatus === 'pago';
      list.push({
        id: `apt-${apt.id}`,
        type: 'servico',
        title: `Serviço: ${apt.serviceNames.join(' + ')}`,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        amount: apt.totalPrice,
        date: apt.date,
        status: isPaid ? 'pago' : 'pendente',
        rawAppointment: apt
      });
    });

    orders.forEach(ord => {
      if (ord.paymentStatus === 'cancelado') return;
      list.push({
        id: `ord-${ord.id}`,
        type: 'produto',
        title: `Venda Balcão #${ord.id}: ${ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`,
        clientName: ord.clientName,
        clientPhone: ord.clientPhone,
        amount: ord.totalAmount,
        date: ord.date,
        status: ord.paymentStatus === 'pago' ? 'pago' : 'pendente',
        rawOrder: ord
      });
    });

    return list.filter(item => {
      const matchesSearch = 
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === 'pendentes') return matchesSearch && item.status === 'pendente';
      if (statusFilter === 'pagos') return matchesSearch && item.status === 'pago';

      return matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] p-5 rounded-2xl border border-[#d4af37]/20 shadow-xl">
        <div className="flex gap-2 p-1 bg-[#141414] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('pagar')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition",
              activeTab === 'pagar'
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <ArrowDownCircle size={16} className="text-rose-400" />
            <span>Contas a Pagar</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
              {formatCurrency(payableStats.pending)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('receber')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition",
              activeTab === 'receber'
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <ArrowUpCircle size={16} className="text-emerald-400" />
            <span>Contas a Receber</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
              {formatCurrency(receivableStats.total)}
            </span>
          </button>
        </div>

        {activeTab === 'pagar' && (
          <button
            onClick={onOpenNewExpense}
            className="px-4 py-2 bg-[#d4af37] text-black font-semibold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition flex items-center gap-1.5"
          >
            <span>+ Lançar Nova Despesa</span>
          </button>
        )}
      </div>

      {/* KPI Cards according to selected tab */}
      {activeTab === 'pagar' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Total Pendente a Pagar</span>
            <div className="text-2xl font-bold text-white mt-1">
              {formatCurrency(payableStats.pending)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Boletos, aluguéis e fornecedores</p>
          </div>

          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-rose-400 uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle size={14} /> Contas Vencidas
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {formatCurrency(payableStats.overdue)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Exigem regularização prioritária</p>
          </div>

          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-emerald-400 uppercase tracking-wider block">Total Quitado (Pago)</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {formatCurrency(payableStats.paid)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Despesas devidamente liquidadas</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Total a Receber</span>
            <div className="text-2xl font-bold text-[#d4af37] mt-1">
              {formatCurrency(receivableStats.total)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Créditos pendentes de liquidação</p>
          </div>

          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">De Serviços (Agenda)</span>
            <div className="text-2xl font-bold text-white mt-1">
              {formatCurrency(receivableStats.appointments)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Atendimentos aguardando acerto</p>
          </div>

          <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">De Produtos (Vendas)</span>
            <div className="text-2xl font-bold text-white mt-1">
              {formatCurrency(receivableStats.orders)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Pedidos de balcão a receber</p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#0c0c0c] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder={activeTab === 'pagar' ? 'Buscar despesa ou fornecedor...' : 'Buscar cliente ou item...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['todos', 'pendentes', 'pagos', ...(activeTab === 'pagar' ? ['vencidos'] : [])] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap",
                statusFilter === st
                  ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                  : "bg-white/5 text-neutral-400 hover:text-white"
              )}
            >
              {st === 'todos' ? 'Todos' : st === 'pendentes' ? 'Pendentes' : st === 'pagos' ? 'Pagos / Quitados' : 'Vencidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === 'pagar' ? (
            /* Contas a Pagar Table */
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#141414] uppercase tracking-wider text-neutral-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold">Fornecedor</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      Nenhuma conta a pagar encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => {
                    const due = parseISO(exp.dueDate);
                    const isOverdue = isPast(due) && !isToday(due) && exp.status !== 'paga';

                    return (
                      <tr key={exp.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={cn(
                            "font-medium",
                            isOverdue ? "text-rose-400 font-bold" : "text-white"
                          )}>
                            {new Date(exp.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                          {isOverdue && (
                            <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={11} /> Vencida
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{exp.description}</div>
                          {exp.receiptNumber && (
                            <div className="text-[10px] text-neutral-500 font-mono">
                              Doc: {exp.receiptNumber}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 text-neutral-300 border border-white/5">
                            {EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || exp.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-neutral-300 flex items-center gap-1.5">
                            <Building2 size={13} className="text-neutral-500" />
                            {exp.supplierName || 'Geral'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white text-sm">
                          {formatCurrency(exp.amount)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {exp.status === 'paga' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={12} /> Paga
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Clock size={12} /> Vencida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock size={12} /> A Pagar
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {exp.status !== 'paga' ? (
                            <button
                              onClick={() => onSettleExpense(exp)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <Check size={13} />
                              <span>Quitar / Baixar</span>
                            </button>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">
                              Pago em {exp.paymentDate ? new Date(exp.paymentDate).toLocaleDateString('pt-BR') : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Contas a Receber Table */
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#141414] uppercase tracking-wider text-neutral-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Tipo / Referência</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Opções de Recebimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                      Nenhum recebimento pendente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <User size={13} className="text-[#d4af37]" />
                          {item.clientName}
                        </div>
                        {item.clientPhone && (
                          <div className="text-[10px] text-neutral-500">{item.clientPhone}</div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-neutral-200">{item.title}</div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                          Origem: {item.type === 'servico' ? 'Atendimento no Salão' : 'Venda de Balcão'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-bold text-white text-sm">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Liquidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={12} /> A Receber
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {item.status === 'pendente' ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Receive via Pix */}
                            <button
                              onClick={() => onOpenPixCharge(
                                item.amount, 
                                item.clientName, 
                                item.title, 
                                item.type, 
                                item.id
                              )}
                              className="px-2.5 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-semibold rounded-lg border border-[#d4af37]/40 transition text-xs flex items-center gap-1"
                              title="Cobrar via QR Code Pix"
                            >
                              <QrCode size={13} />
                              <span>Cobrar Pix</span>
                            </button>

                            {/* Settle via Card/Cash */}
                            <button
                              onClick={() => {
                                if (item.type === 'servico' && item.rawAppointment) {
                                  onReceiveAppointmentPayment(item.rawAppointment, 'cartao_credito');
                                } else if (item.type === 'produto' && item.rawOrder) {
                                  onReceiveOrderPayment(item.rawOrder, 'cartao_credito');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-lg border border-white/10 transition text-xs flex items-center gap-1"
                              title="Confirmar recebimento (Cartão / Dinheiro)"
                            >
                              <CreditCard size={13} />
                              <span>Cartão / Dinheiro</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} /> Pago
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
