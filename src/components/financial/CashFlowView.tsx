import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  FileSpreadsheet, 
  Percent, 
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/src/lib/utils';
import { Expense, Appointment, Order, ProfessionalCommission } from '@/src/types';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';

interface CashFlowViewProps {
  expenses: Expense[];
  appointments: Appointment[];
  orders: Order[];
  commissions: ProfessionalCommission[];
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  expenses,
  appointments,
  orders,
  commissions,
}) => {
  // Aggregate Financial Results for DRE & Cash Flow
  const calculations = useMemo(() => {
    // 1. Revenues
    let serviceRevenue = 0;
    appointments.forEach(apt => {
      // Completed or paid appointments
      if (apt.status === 'concluido' || apt.paymentStatus === 'pago') {
        serviceRevenue += apt.totalPrice;
      }
    });

    let productRevenue = 0;
    let productCost = 0;
    orders.forEach(ord => {
      if (ord.paymentStatus === 'pago') {
        productRevenue += ord.totalAmount;
        productCost += ord.totalCost;
      }
    });

    const grossRevenue = serviceRevenue + productRevenue;

    // 2. Direct Costs (CMV + Professional Commissions)
    let totalCommissions = 0;
    commissions.forEach(c => {
      totalCommissions += c.commissionAmount;
    });

    const directCosts = productCost + totalCommissions;
    const grossProfit = grossRevenue - directCosts;
    const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    // 3. Operational Expenses
    let rentExpense = 0;
    let utilitiesExpense = 0;
    let marketingExpense = 0;
    let maintenanceExpense = 0;
    let otherExpenses = 0;
    let totalOperatingExpenses = 0;

    expenses.forEach(exp => {
      // Exclude commissions from expenses if already categorized to avoid duplicate counting
      if (exp.category === 'comissao') return;

      if (exp.status === 'paga') {
        totalOperatingExpenses += exp.amount;
        if (exp.category === 'aluguel') rentExpense += exp.amount;
        else if (exp.category === 'energia_agua') utilitiesExpense += exp.amount;
        else if (exp.category === 'marketing') marketingExpense += exp.amount;
        else if (exp.category === 'manutencao') maintenanceExpense += exp.amount;
        else otherExpenses += exp.amount;
      }
    });

    // 4. Net Profit
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      serviceRevenue,
      productRevenue,
      grossRevenue,
      productCost,
      totalCommissions,
      directCosts,
      grossProfit,
      grossMargin,
      rentExpense,
      utilitiesExpense,
      marketingExpense,
      maintenanceExpense,
      otherExpenses,
      totalOperatingExpenses,
      netProfit,
      netMargin
    };
  }, [expenses, appointments, orders, commissions]);

  // Cashflow timeline for charts (Last 7 days)
  const chartData = useMemo(() => {
    const days: { day: string; dateStr: string; receitas: number; despesas: number; saldo: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const label = format(d, 'dd/MM');

      let dayIncome = 0;
      let dayExpense = 0;

      // Income from appointments on this date
      appointments.forEach(a => {
        if (a.date === dateStr && (a.status === 'concluido' || a.paymentStatus === 'pago')) {
          dayIncome += a.totalPrice;
        }
      });

      // Income from orders on this date
      orders.forEach(o => {
        if (o.date === dateStr && o.paymentStatus === 'pago') {
          dayIncome += o.totalAmount;
        }
      });

      // Outflows from expenses paid on this date
      expenses.forEach(e => {
        if (e.paymentDate === dateStr && e.status === 'paga') {
          dayExpense += e.amount;
        }
      });

      days.push({
        day: label,
        dateStr,
        receitas: dayIncome,
        despesas: dayExpense,
        saldo: dayIncome - dayExpense
      });
    }

    return days;
  }, [appointments, orders, expenses]);

  return (
    <div className="space-y-6">
      {/* KPI Cards: Lucro Bruto e Líquido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Bruto</span>
            <DollarSign size={18} className="text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(calculations.grossRevenue)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Serviços ({formatCurrency(calculations.serviceRevenue)}) + Produtos ({formatCurrency(calculations.productRevenue)})
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Custos Diretos (CMV + Comissões)</span>
            <ArrowDownRight size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatCurrency(calculations.directCosts)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Custos variáveis diretamente atrelados à operação
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lucro Bruto</span>
            <TrendingUp size={18} className="text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold text-[#d4af37] tracking-tight">
            {formatCurrency(calculations.grossProfit)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Margem Bruta de <strong className="text-white">{calculations.grossMargin.toFixed(1)}%</strong>
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#121212] to-[#1c1809] p-5 rounded-2xl border border-[#d4af37]/30 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between text-[#d4af37] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido Real</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(calculations.netProfit)}
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Margem Líquida Final de <strong className="text-white">{calculations.netMargin.toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      {/* Cash Flow Evolution Chart */}
      <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-serif font-bold text-white tracking-wide">
              Evolução do Fluxo de Caixa (Últimos 7 dias)
            </h3>
            <p className="text-xs text-neutral-400">
              Comparativo diário entre entradas (recebimentos) e saídas (despesas pagas)
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141414', borderColor: '#d4af37', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="receitas" name="Entradas (Receitas)" fill="#d4af37" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Saídas (Despesas)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DRE - Demonstrativo do Resultado do Exercício */}
      <div className="bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                DRE - Demonstrativo de Resultado Gerencial
              </h3>
              <p className="text-xs text-neutral-400">
                Detalhamento contábil e estruturado de receitas, custos e margens de lucro
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 divide-y divide-white/5 text-xs text-neutral-300 space-y-4">
          {/* Seção 1: Receitas */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-sm font-bold text-white uppercase tracking-wider">
              <span>1. Receita Operacional Bruta</span>
              <span className="text-[#d4af37] font-serif text-base">{formatCurrency(calculations.grossRevenue)}</span>
            </div>
            <div className="pl-4 space-y-1 text-neutral-400">
              <div className="flex justify-between">
                <span>(+) Faturamento com Serviços Realizados</span>
                <span className="text-neutral-200">{formatCurrency(calculations.serviceRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Venda de Cosméticos e Produtos no Balcão</span>
                <span className="text-neutral-200">{formatCurrency(calculations.productRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Seção 2: Custos Diretos */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center text-sm font-bold text-amber-400 uppercase tracking-wider">
              <span>2. Custos Diretos Operacionais</span>
              <span className="font-serif text-base">(-) {formatCurrency(calculations.directCosts)}</span>
            </div>
            <div className="pl-4 space-y-1 text-neutral-400">
              <div className="flex justify-between">
                <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.productCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Comissões Repassadas aos Profissionais</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.totalCommissions)}</span>
              </div>
            </div>
          </div>

          {/* Seção 3: Lucro Bruto */}
          <div className="pt-4 flex justify-between items-center text-sm font-bold text-[#d4af37] bg-[#141414] p-3 rounded-xl border border-white/5">
            <span>(=) LUCRO BRUTO OPERACIONAL (Margem: {calculations.grossMargin.toFixed(1)}%)</span>
            <span className="font-serif text-base">{formatCurrency(calculations.grossProfit)}</span>
          </div>

          {/* Seção 4: Despesas Operacionais */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center text-sm font-bold text-rose-400 uppercase tracking-wider">
              <span>3. Despesas Operacionais e Administrativas</span>
              <span className="font-serif text-base">(-) {formatCurrency(calculations.totalOperatingExpenses)}</span>
            </div>
            <div className="pl-4 space-y-1 text-neutral-400">
              <div className="flex justify-between">
                <span>(-) Aluguel & Ocupação do Espaço</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.rentExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Energia, Água e Internet Fibra</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.utilitiesExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Marketing Digital & Tráfego Pago</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.marketingExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Manutenção e Equipamentos</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.maintenanceExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Demais Despesas Fixas e Variáveis</span>
                <span className="text-neutral-300">(-) {formatCurrency(calculations.otherExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Seção 5: Lucro Líquido Final */}
          <div className="pt-4 flex justify-between items-center text-base font-extrabold text-emerald-400 bg-gradient-to-r from-emerald-500/10 to-[#d4af37]/10 p-4 rounded-xl border border-emerald-500/20">
            <div>
              <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
              <span className="block text-xs font-normal text-neutral-400 mt-0.5">
                Margem Líquida sobre o faturamento: {calculations.netMargin.toFixed(1)}%
              </span>
            </div>
            <span className="font-serif text-xl tracking-tight">{formatCurrency(calculations.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
