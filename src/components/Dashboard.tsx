import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  UserSquare2, 
  ChevronRight,
  Scissors,
  Store
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Appointment, Client, Order, Expense, Service, Product, ViewType } from '@/src/types';
import { getInitialAppointments, STATUS_LABELS } from '@/src/services/agendaStorage';
import { initialClientsList } from '@/src/components/Clients';
import { getInitialOrders, getInitialProducts } from '@/src/services/productStorage';
import { getInitialExpenses, getFinancialDashboardMetrics } from '@/src/services/financialStorage';
import { initialServicesList } from '@/src/components/Services';

const StatCard = ({ title, value, icon: Icon, trend, subtitle }: any) => (
  <div className="bg-[#111111] border border-[#d4af37]/15 p-5 sm:p-6 rounded-2xl hover:border-[#d4af37]/40 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-15 transition-opacity text-[#d4af37]">
      <Icon size={110} />
    </div>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37]">
        <Icon size={22} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border",
          trend.isPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"
        )}>
          {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.value}%
        </div>
      )}
    </div>
    <h3 className="text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">{title}</h3>
    <p className="text-white text-2xl font-extrabold tracking-tight">{value}</p>
    {subtitle && <p className="text-[11px] text-neutral-500 mt-1">{subtitle}</p>}
  </div>
);

interface DashboardProps {
  onNavigateToAgenda?: () => void;
  onNavigate?: (view: ViewType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAgenda, onNavigate }) => {
  const [appointments] = useLocalStorage<Appointment[]>('appointments', getInitialAppointments());
  const [clients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [orders] = useLocalStorage<Order[]>('orders', getInitialOrders());
  const [expenses] = useLocalStorage<Expense[]>('expenses', getInitialExpenses());
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [products] = useLocalStorage<Product[]>('products', getInitialProducts());

  const metrics = getFinancialDashboardMetrics({
    appointments,
    orders,
    expenses
  });

  // Upcoming appointments
  const upcomingAppointments = [...appointments]
    .filter(a => a.status !== 'cancelado')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 5);

  const featuredServices = services.slice(0, 3);
  const featuredProducts = products.filter(p => p.status === 'ativo').slice(0, 3);

  const handleQuickNav = (view: ViewType) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (view === 'agenda' && onNavigateToAgenda) {
      onNavigateToAgenda();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14120c] via-[#1c1810] to-[#0a0a0a] border border-[#d4af37]/25 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} />
              Salão Luxe • Painel de Controle Principal
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b]">Salão Luxe</span>
            </h1>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Gestão completa de agendamentos, clientes, estoque e faturamento financeiro. Tudo em um único lugar com atualização em tempo real.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
            <button
              onClick={() => handleQuickNav('area_cliente')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d4af37] text-black font-bold text-xs rounded-xl hover:bg-[#b8860b] transition-all shadow-lg shadow-[#d4af37]/20"
            >
              <UserSquare2 size={16} />
              Área do Cliente
            </button>
            <button
              onClick={() => handleQuickNav('vitrine')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-xl transition-all"
            >
              <Store size={16} className="text-[#d4af37]" />
              Vitrine Digital
            </button>
            <button
              onClick={() => handleQuickNav('agenda')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-xl transition-all"
            >
              <Calendar size={16} className="text-[#d4af37]" />
              Agenda
            </button>
            <button
              onClick={() => handleQuickNav('chat')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-xl transition-all"
            >
              <MessageSquare size={16} className="text-[#d4af37]" />
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Faturamento Bruto" 
          value={formatCurrency(metrics.totalGrossRevenue)} 
          icon={TrendingUp}
          trend={{ isPositive: true, value: 14.2 }}
          subtitle="Acumulado confirmado no sistema"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={String(clients.length)} 
          icon={Users}
          trend={{ isPositive: true, value: 8.5 }}
          subtitle="Base total cadastrada"
        />
        <StatCard 
          title="Agendamentos Realizados" 
          value={String(metrics.appointmentCount)} 
          icon={Calendar}
          subtitle="Serviços com histórico confirmado"
        />
        <StatCard 
          title="Vendas de Produtos" 
          value={String(metrics.paidOrdersCount)} 
          icon={ShoppingBag}
          subtitle="Pedidos pagos e baixados"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Performance Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#d4af37]/15 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp size={20} className="text-[#d4af37]" />
                Desempenho Semanal do Salão
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">Evolução do faturamento diário consolidado</p>
            </div>
            <button 
              onClick={() => handleQuickNav('financeiro')}
              className="text-xs font-bold text-[#d4af37] hover:underline flex items-center gap-1"
            >
              Financeiro <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyChartData}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0d', borderColor: '#d4af37', borderRadius: '16px', color: '#fff' }}
                  itemStyle={{ color: '#d4af37' }}
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Faturamento']}
                />
                <Area 
                  type="monotone" 
                  dataKey="vlr" 
                  stroke="#d4af37" 
                  fillOpacity={1} 
                  fill="url(#goldGradient)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-[#111111] border border-[#d4af37]/15 p-6 rounded-3xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Clock size={20} className="text-[#d4af37]" />
                Próximos Agendamentos
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">Atendimentos em destaque na agenda</p>
            </div>
            <button 
              onClick={() => handleQuickNav('agenda')}
              className="text-xs font-bold text-[#d4af37] hover:underline"
            >
              Agenda
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingAppointments.map((app) => {
              const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.confirmado;
              const initials = app.clientName.split(' ').map(n => n[0]).slice(0, 2).join('');

              return (
                <div 
                  key={app.id} 
                  onClick={() => handleQuickNav('agenda')}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#d4af37]/40 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold text-xs shadow-md">
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold group-hover:text-[#d4af37] transition-colors">
                        {app.clientName}
                      </h4>
                      <p className="text-neutral-400 text-xs line-clamp-1">
                        {app.serviceNames.join(' + ')} • <span className="text-neutral-500">{app.professionalName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-white text-xs font-bold flex items-center gap-1 justify-end">
                      <Clock size={12} className="text-[#d4af37]" />
                      {app.startTime}
                    </p>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      statusInfo.text
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {upcomingAppointments.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Nenhum agendamento futuro no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights: Services & Products Quick Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Services Showcase */}
        <div className="bg-[#111111] border border-[#d4af37]/15 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors size={18} className="text-[#d4af37]" />
                Serviços de Destaque
              </h3>
              <p className="text-neutral-400 text-xs">Principais procedimentos oferecidos</p>
            </div>
            <button 
              onClick={() => handleQuickNav('vitrine')}
              className="text-xs font-bold text-[#d4af37] hover:underline flex items-center gap-1"
            >
              Ver na Vitrine <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {featuredServices.map((service) => (
              <div 
                key={service.id}
                className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#d4af37]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{service.name}</h4>
                    <p className="text-xs text-neutral-400">{service.duration} min • {service.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#d4af37]">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Showcase */}
        <div className="bg-[#111111] border border-[#d4af37]/15 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#d4af37]" />
                Produtos de Alta Performance
              </h3>
              <p className="text-neutral-400 text-xs">Linha exclusiva para cuidados diários</p>
            </div>
            <button 
              onClick={() => handleQuickNav('produtos')}
              className="text-xs font-bold text-[#d4af37] hover:underline flex items-center gap-1"
            >
              Ver Produtos <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#d4af37]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 overflow-hidden shrink-0 border border-white/10">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{product.name}</h4>
                    <p className="text-xs text-neutral-400">Estoque: {product.stock} un • {product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#d4af37]">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
