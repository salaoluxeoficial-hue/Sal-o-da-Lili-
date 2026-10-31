import React, { useState, useMemo } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Filter, 
  Calendar,
  Search,
  Plus,
  QrCode,
  Settings,
  CreditCard,
  CheckCircle2,
  Clock,
  Award,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { 
  Expense, 
  Appointment, 
  Order, 
  Professional, 
  ProfessionalCommission, 
  PixConfig, 
  PixCharge,
  FinancialPaymentMethod,
  FinancialTransaction
} from '@/src/types';
import { 
  getInitialExpenses, 
  calculateProfessionalCommissions, 
  exportToCSV,
  EXPENSE_CATEGORIES 
} from '@/src/services/financialStorage';
import { getDefaultPixConfig } from '@/src/services/pixService';
import { getInitialAppointments } from '@/src/services/agendaStorage';
import { getInitialOrders } from '@/src/services/productStorage';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { ExpenseModal } from '@/src/components/financial/ExpenseModal';
import { PixChargeModal } from '@/src/components/financial/PixChargeModal';
import { PixSettingsModal } from '@/src/components/financial/PixSettingsModal';
import { CommissionsView } from '@/src/components/financial/CommissionsView';
import { CashFlowView } from '@/src/components/financial/CashFlowView';
import { AccountsPayableReceivableView } from '@/src/components/financial/AccountsPayableReceivableView';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO,
  isToday,
  isSameWeek,
  isSameMonth
} from 'date-fns';

type FinancialTab = 'dashboard' | 'transacoes' | 'contas' | 'fluxo_dre' | 'comissoes';
type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'todos';

export const Financial: React.FC = () => {
  // Shared persistent state
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', getInitialExpenses());
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', getInitialAppointments());
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', getInitialOrders());
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [storedCommissions, setStoredCommissions] = useLocalStorage<ProfessionalCommission[]>('professional_commissions', []);
  const [pixConfig, setPixConfig] = useLocalStorage<PixConfig>('pix_config', getDefaultPixConfig());

  // Navigation and filters
  const [activeTab, setActiveTab] = useState<FinancialTab>('dashboard');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('mes');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'todos' | FinancialPaymentMethod>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isPixSettingsOpen, setIsPixSettingsOpen] = useState(false);
  const [pixChargeData, setPixChargeData] = useState<{
    isOpen: boolean;
    amount: number;
    clientName: string;
    description: string;
    referenceType?: 'servico' | 'produto' | 'avulso';
    referenceId?: string;
  }>({
    isOpen: false,
    amount: 0,
    clientName: '',
    description: '',
  });

  // Calculate synchronized commissions
  const commissions = useMemo(() => {
    return calculateProfessionalCommissions({
      appointments,
      professionals,
      existingCommissions: storedCommissions,
    });
  }, [appointments, professionals, storedCommissions]);

  // Master unified transactions list (avoiding duplication)
  const masterTransactions = useMemo(() => {
    const list: FinancialTransaction[] = [];

    // 1. Service revenues from appointments
    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;
      const isPaid = apt.paymentStatus === 'pago' || apt.status === 'concluido';
      list.push({
        id: `tx-apt-${apt.id}`,
        type: 'receita',
        origin: 'servico',
        referenceId: apt.id,
        description: `Serviço: ${apt.serviceNames.join(' + ')}`,
        category: 'Serviços Salão',
        amount: apt.totalPrice,
        date: apt.date,
        paymentMethod: apt.paymentMethod || 'cartao_credito',
        paymentStatus: isPaid ? 'pago' : 'pendente',
        clientOrRecipientName: apt.clientName,
        professionalId: apt.professionalId,
        professionalName: apt.professionalName,
        createdAt: apt.createdAt || new Date().toISOString(),
      });
    });

    // 2. Product sales revenues from orders
    orders.forEach(ord => {
      if (ord.paymentStatus === 'cancelado') return;
      list.push({
        id: `tx-ord-${ord.id}`,
        type: 'receita',
        origin: 'produto',
        referenceId: ord.id,
        description: `Venda Balcão #${ord.id}: ${ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`,
        category: 'Produtos & Cosméticos',
        amount: ord.totalAmount,
        cost: ord.totalCost,
        date: ord.date,
        paymentMethod: ord.paymentMethod,
        paymentStatus: ord.paymentStatus,
        clientOrRecipientName: ord.clientName,
        createdAt: ord.createdAt || new Date().toISOString(),
      });
    });

    // 3. Operational expenses
    expenses.forEach(exp => {
      list.push({
        id: `tx-exp-${exp.id}`,
        type: 'despesa',
        origin: 'despesa_avulsa',
        referenceId: exp.id,
        description: exp.description,
        category: EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || exp.category,
        amount: exp.amount,
        date: exp.paymentDate || exp.dueDate,
        paymentMethod: exp.paymentMethod || 'boleto',
        paymentStatus: exp.status === 'paga' ? 'pago' : exp.status === 'vencida' ? 'pendente' : 'pendente',
        clientOrRecipientName: exp.supplierName || 'Fornecedor',
        createdAt: exp.createdAt || new Date().toISOString(),
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, orders, expenses]);

  // Filtered transactions by period, payment method, and search
  const filteredTransactions = useMemo(() => {
    const today = new Date();

    return masterTransactions.filter(tx => {
      const txDate = parseISO(tx.date);

      // Period filter
      let matchesPeriod = true;
      if (periodFilter === 'hoje') {
        matchesPeriod = isToday(txDate);
      } else if (periodFilter === 'semana') {
        matchesPeriod = isSameWeek(txDate, today, { weekStartsOn: 1 });
      } else if (periodFilter === 'mes') {
        matchesPeriod = isSameMonth(txDate, today);
      }

      // Payment method filter
      const matchesMethod = paymentMethodFilter === 'todos' || tx.paymentMethod === paymentMethodFilter;

      // Search term
      const matchesSearch = 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.clientOrRecipientName && tx.clientOrRecipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesPeriod && matchesMethod && matchesSearch;
    });
  }, [masterTransactions, periodFilter, paymentMethodFilter, searchTerm]);

  // Periodic metrics calculations (Diário, Semanal, Mensal)
  const periodicMetrics = useMemo(() => {
    const today = new Date();
    let dailyRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;

    let serviceRevenueMonth = 0;
    let productRevenueMonth = 0;
    let totalExpenseMonth = 0;

    masterTransactions.forEach(tx => {
      if (tx.paymentStatus !== 'pago') return;
      const txDate = parseISO(tx.date);

      if (tx.type === 'receita') {
        if (isToday(txDate)) dailyRevenue += tx.amount;
        if (isSameWeek(txDate, today, { weekStartsOn: 1 })) weeklyRevenue += tx.amount;
        if (isSameMonth(txDate, today)) {
          monthlyRevenue += tx.amount;
          if (tx.origin === 'servico') serviceRevenueMonth += tx.amount;
          if (tx.origin === 'produto') productRevenueMonth += tx.amount;
        }
      } else if (tx.type === 'despesa') {
        if (isSameMonth(txDate, today)) {
          totalExpenseMonth += tx.amount;
        }
      }
    });

    const netBalanceMonth = monthlyRevenue - totalExpenseMonth;

    return {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      serviceRevenueMonth,
      productRevenueMonth,
      totalExpenseMonth,
      netBalanceMonth
    };
  }, [masterTransactions]);

  // Handler: Pay commission to professional
  const handlePayCommission = (comm: ProfessionalCommission) => {
    const confirmPay = window.confirm(
      `Confirmar liquidação de comissão no valor de ${formatCurrency(comm.commissionAmount)} para ${comm.professionalName}?`
    );
    if (!confirmPay) return;

    const paidAt = new Date().toISOString();
    const updatedComm: ProfessionalCommission = {
      ...comm,
      status: 'pago',
      paidAt,
      paymentMethod: 'pix'
    };

    // Update commission record
    setStoredCommissions(prev => {
      const idx = prev.findIndex(p => p.id === comm.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedComm;
        return copy;
      }
      return [...prev, updatedComm];
    });

    // Create single expense record in category 'comissao'
    const commissionExpense: Expense = {
      id: `exp-comm-${comm.id}`,
      description: `Comissão Atendimento: ${comm.professionalName} (${comm.serviceNames.join(', ')})`,
      category: 'comissao',
      amount: comm.commissionAmount,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'paga',
      supplierName: comm.professionalName,
      isRecurring: false,
      paymentMethod: 'pix',
      notes: `Liquidado para profissional referente ao agendamento #${comm.appointmentId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExpenses(prev => [commissionExpense, ...prev]);
  };

  // Handler: Settle expense
  const handleSettleExpense = (expense: Expense) => {
    const updated = expenses.map(e => {
      if (e.id === expense.id) {
        return {
          ...e,
          status: 'paga' as const,
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          updatedAt: new Date().toISOString()
        };
      }
      return e;
    });
    setExpenses(updated);
  };

  // Handler: Receive Appointment Payment
  const handleReceiveAppointmentPayment = (appointment: Appointment, method: FinancialPaymentMethod) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointment.id) {
        return {
          ...a,
          paymentStatus: 'pago',
          paymentMethod: method as any,
          status: a.status === 'aguardando' ? 'confirmado' : a.status,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    }));
  };

  // Handler: Receive Order Payment
  const handleReceiveOrderPayment = (order: Order, method: FinancialPaymentMethod) => {
    setOrders(prev => prev.map(o => {
      if (o.id === order.id) {
        return {
          ...o,
          paymentStatus: 'pago',
          paymentMethod: method as any,
          stockDeducted: true
        };
      }
      return o;
    }));
  };

  // Handler: Open Pix charge modal
  const handleOpenPixCharge = (
    amount: number, 
    clientName: string, 
    description: string, 
    referenceType: 'servico' | 'produto' | 'avulso' = 'avulso', 
    referenceId?: string
  ) => {
    setPixChargeData({
      isOpen: true,
      amount,
      clientName,
      description,
      referenceType,
      referenceId
    });
  };

  // Callback when Pix payment is confirmed via Webhook or Manual Verification
  const handlePixPaymentConfirmed = (charge: PixCharge) => {
    if (charge.referenceType === 'servico' && charge.referenceId) {
      const realId = charge.referenceId.replace('apt-', '');
      const apt = appointments.find(a => a.id === realId);
      if (apt) {
        handleReceiveAppointmentPayment(apt, 'pix');
      }
    } else if (charge.referenceType === 'produto' && charge.referenceId) {
      const realId = charge.referenceId.replace('ord-', '');
      const ord = orders.find(o => o.id === realId);
      if (ord) {
        handleReceiveOrderPayment(ord, 'pix');
      }
    }
    setPixChargeData(prev => ({ ...prev, isOpen: false }));
  };

  // Export transactions to CSV
  const handleExportTransactions = () => {
    exportToCSV({
      filename: `extrato_financeiro_${format(new Date(), 'yyyy-MM-dd')}`,
      headers: ['Data', 'Tipo', 'Categoria', 'Descrição', 'Cliente / Favorecido', 'Valor (R$)', 'Forma Pagto', 'Status'],
      rows: filteredTransactions.map(tx => [
        tx.date,
        tx.type === 'receita' ? 'RECEITA' : 'DESPESA',
        tx.category,
        tx.description,
        tx.clientOrRecipientName || '-',
        (tx.type === 'despesa' ? -tx.amount : tx.amount).toFixed(2),
        tx.paymentMethod.toUpperCase(),
        tx.paymentStatus.toUpperCase()
      ])
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-[#d4af37]/20 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#d4af37]/10 text-[#d4af37] rounded-xl border border-[#d4af37]/30">
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                Módulo Financeiro & Pagamentos
              </h1>
              <p className="text-xs text-neutral-400">
                Faturamento diário, semanal, mensal, contas a pagar/receber, DRE, comissões e Pix oficial
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pix Quick Charge */}
          <button
            onClick={() => handleOpenPixCharge(150.00, 'Cliente Balcão', 'Atendimento Salão Luxe', 'avulso')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 rounded-xl text-xs font-semibold transition"
          >
            <QrCode size={16} className="text-[#d4af37]" />
            <span>Cobrar com Pix</span>
          </button>

          {/* Pix Settings */}
          <button
            onClick={() => setIsPixSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition"
            title="Configurar Chave Pix e Gateway"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Chave Pix & Gateway</span>
          </button>

          {/* New Expense */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black font-bold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition"
          >
            <Plus size={16} />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10">
        {[
          { id: 'dashboard', label: 'Painel & Faturamento', icon: TrendingUp },
          { id: 'transacoes', label: 'Extrato de Pagamentos', icon: CreditCard },
          { id: 'contas', label: 'Contas a Pagar & Receber', icon: Layers },
          { id: 'fluxo_dre', label: 'Fluxo de Caixa & DRE', icon: FileSpreadsheet },
          { id: 'comissoes', label: 'Comissões dos Profissionais', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinancialTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition whitespace-nowrap",
                isActive 
                  ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD & FATURAMENTO */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Periodic KPI Cards: Diário, Semanal, Mensal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Diário */}
            <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Hoje</span>
                <Clock size={18} className="text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(periodicMetrics.dailyRevenue)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Receitas liquidadas no dia de hoje
              </p>
            </div>

            {/* Semanal */}
            <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Semanal</span>
                <Calendar size={18} className="text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400 tracking-tight">
                {formatCurrency(periodicMetrics.weeklyRevenue)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Acumulado dos últimos 7 dias
              </p>
            </div>

            {/* Mensal */}
            <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Mensal</span>
                <TrendingUp size={18} className="text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold text-[#d4af37] tracking-tight">
                {formatCurrency(periodicMetrics.monthlyRevenue)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Mês atual ({format(new Date(), 'MMMM/yyyy')})
              </p>
            </div>

            {/* Saldo Líquido do Mês */}
            <div className="bg-gradient-to-br from-[#121212] to-[#1c1809] p-5 rounded-2xl border border-[#d4af37]/30 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between text-[#d4af37] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Líquido Mensal</span>
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {formatCurrency(periodicMetrics.netBalanceMonth)}
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                Receitas Menos Despesas Pagas
              </p>
            </div>
          </div>

          {/* Revenue Breakdown: Serviços vs Produtos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Receita com Serviços Realizados
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(periodicMetrics.serviceRevenueMonth)}
                </div>
                <span className="text-xs text-neutral-500 block mt-1">
                  Atendimentos concluídos pelos profissionais da equipe
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                <Sparkles size={28} />
              </div>
            </div>

            <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Receita com Produtos & Vendas Balcão
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(periodicMetrics.productRevenueMonth)}
                </div>
                <span className="text-xs text-neutral-500 block mt-1">
                  Vendas de cosméticos, pomadas e tratamentos home-care
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingBag size={28} />
              </div>
            </div>
          </div>

          {/* Integrated Cash Flow Preview */}
          <CashFlowView 
            expenses={expenses}
            appointments={appointments}
            orders={orders}
            commissions={commissions}
          />
        </div>
      )}

      {/* TAB 2: EXTRATO DE TRANSAÇÕES */}
      {activeTab === 'transacoes' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Bar */}
          <div className="bg-[#0c0c0c] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por descrição, cliente, favorecido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Period Filter */}
              <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/5">
                {(['hoje', 'semana', 'mes', 'todos'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                      periodFilter === p 
                        ? "bg-[#d4af37] text-black font-semibold shadow-sm" 
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7 Dias' : p === 'mes' ? 'Este Mês' : 'Todos'}
                  </button>
                ))}
              </div>

              {/* Payment Method Filter */}
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
                className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="todos">Todas Formas de Pagamento</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportTransactions}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl text-xs font-semibold border border-white/10 transition"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#141414] uppercase tracking-wider text-neutral-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">Tipo</th>
                    <th className="px-6 py-4 font-semibold">Descrição</th>
                    <th className="px-6 py-4 font-semibold">Cliente / Favorecido</th>
                    <th className="px-6 py-4 font-semibold">Forma de Pagto</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                        Nenhuma transação financeira encontrada para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.type === 'receita' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ArrowUpCircle size={12} /> Receita
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <ArrowDownCircle size={12} /> Despesa
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{tx.description}</div>
                          <span className="text-[10px] text-neutral-500">{tx.category}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-neutral-300">
                          {tx.clientOrRecipientName || '-'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-md bg-white/5 text-[11px] text-neutral-300 font-medium">
                            {tx.paymentMethod.toUpperCase()}
                          </span>
                        </td>

                        <td className={cn(
                          "px-6 py-4 whitespace-nowrap font-bold text-sm",
                          tx.type === 'receita' ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {tx.type === 'despesa' ? `- ${formatCurrency(tx.amount)}` : `+ ${formatCurrency(tx.amount)}`}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.paymentStatus === 'pago' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 size={12} /> Liquidado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                              <Clock size={12} /> Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAS A PAGAR & RECEBER */}
      {activeTab === 'contas' && (
        <AccountsPayableReceivableView 
          expenses={expenses}
          appointments={appointments}
          orders={orders}
          onSettleExpense={handleSettleExpense}
          onReceiveAppointmentPayment={handleReceiveAppointmentPayment}
          onReceiveOrderPayment={handleReceiveOrderPayment}
          onOpenPixCharge={handleOpenPixCharge}
          onOpenNewExpense={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
        />
      )}

      {/* TAB 4: FLUXO DE CAIXA & DRE */}
      {activeTab === 'fluxo_dre' && (
        <CashFlowView 
          expenses={expenses}
          appointments={appointments}
          orders={orders}
          commissions={commissions}
        />
      )}

      {/* TAB 5: COMISSÕES DOS PROFISSIONAIS */}
      {activeTab === 'comissoes' && (
        <CommissionsView 
          commissions={commissions}
          professionals={professionals}
          onPayCommission={handlePayCommission}
        />
      )}

      {/* MODAL: Nova / Edição de Despesa */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        initialExpense={editingExpense}
        onSave={(savedExp) => {
          setExpenses(prev => {
            const idx = prev.findIndex(e => e.id === savedExp.id);
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = savedExp;
              return copy;
            }
            return [savedExp, ...prev];
          });
        }}
      />

      {/* MODAL: Cobrança Pix */}
      <PixChargeModal
        isOpen={pixChargeData.isOpen}
        onClose={() => setPixChargeData(prev => ({ ...prev, isOpen: false }))}
        amount={pixChargeData.amount}
        clientName={pixChargeData.clientName}
        description={pixChargeData.description}
        referenceType={pixChargeData.referenceType}
        referenceId={pixChargeData.referenceId}
        config={pixConfig}
        onPaymentConfirmed={handlePixPaymentConfirmed}
      />

      {/* MODAL: Configurações Pix & Gateway */}
      <PixSettingsModal
        isOpen={isPixSettingsOpen}
        onClose={() => setIsPixSettingsOpen(false)}
        config={pixConfig}
        onSave={(newCfg) => setPixConfig(newCfg)}
      />
    </div>
  );
};
