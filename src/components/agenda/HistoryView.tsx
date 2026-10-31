import React, { useState, useMemo } from 'react';
import { Appointment, Professional, Service, AppointmentStatus } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { format, isWithinInterval, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface HistoryViewProps {
  appointments: Appointment[];
  professionals: Professional[];
  services: Service[];
  onOpenNewAppointment: (time?: string, professionalId?: string, dateStr?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  appointments,
  professionals,
  services,
  onOpenNewAppointment,
  onEditAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profFilter, setProfFilter] = useState<string>('all');
  const [datePeriod, setDatePeriod] = useState<'all' | 'today' | 'month' | 'last30'>('month');

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    return appointments.filter(app => {
      // Search
      const matchesSearch = 
        app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.clientPhone.includes(searchTerm) ||
        app.serviceNames.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      // Professional
      const matchesProf = profFilter === 'all' || app.professionalId === profFilter;

      // Date Period
      let matchesDate = true;
      if (datePeriod === 'today') {
        matchesDate = app.date === todayStr;
      } else if (datePeriod === 'month') {
        matchesDate = app.date >= monthStart && app.date <= monthEnd;
      } else if (datePeriod === 'last30') {
        matchesDate = app.date >= last30Days;
      }

      return matchesSearch && matchesStatus && matchesProf && matchesDate;
    }).sort((a, b) => {
      // Sort desc by date, then by startTime
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.startTime.localeCompare(a.startTime);
    });
  }, [appointments, searchTerm, statusFilter, profFilter, datePeriod]);

  // Overall metrics
  const metrics = useMemo(() => {
    const total = filteredAppointments.length;
    const completed = filteredAppointments.filter(a => a.status === 'concluido').length;
    const canceled = filteredAppointments.filter(a => a.status === 'cancelado').length;
    const revenue = filteredAppointments
      .filter(a => a.status === 'concluido')
      .reduce((acc, a) => acc + a.totalPrice, 0);

    return { total, completed, canceled, revenue };
  }, [filteredAppointments]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Total de Registros</span>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Concluídos com Sucesso</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.completed}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Cancelados</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{metrics.canceled}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Faturamento Concluído</span>
          <p className="text-2xl font-bold text-[#d4af37] mt-1">{formatCurrency(metrics.revenue)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#111111] border border-[#d4af37]/15 p-4 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input 
              type="text"
              placeholder="Buscar cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
          >
            <option value="all">Todos os Status</option>
            <option value="aguardando">Aguardando</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Professional Filter */}
          <select
            value={profFilter}
            onChange={(e) => setProfFilter(e.target.value)}
            className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
          >
            <option value="all">Todos os Profissionais</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Period Filter */}
          <div className="flex bg-[#141414] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setDatePeriod('today')}
              className={cn(
                "flex-1 py-1 rounded-lg text-[11px] font-bold transition-all",
                datePeriod === 'today' ? "bg-[#d4af37] text-black" : "text-neutral-400 hover:text-white"
              )}
            >
              Hoje
            </button>
            <button
              onClick={() => setDatePeriod('month')}
              className={cn(
                "flex-1 py-1 rounded-lg text-[11px] font-bold transition-all",
                datePeriod === 'month' ? "bg-[#d4af37] text-black" : "text-neutral-400 hover:text-white"
              )}
            >
              Este Mês
            </button>
            <button
              onClick={() => setDatePeriod('last30')}
              className={cn(
                "flex-1 py-1 rounded-lg text-[11px] font-bold transition-all",
                datePeriod === 'last30' ? "bg-[#d4af37] text-black" : "text-neutral-400 hover:text-white"
              )}
            >
              30 Dias
            </button>
            <button
              onClick={() => setDatePeriod('all')}
              className={cn(
                "flex-1 py-1 rounded-lg text-[11px] font-bold transition-all",
                datePeriod === 'all' ? "bg-[#d4af37] text-black" : "text-neutral-400 hover:text-white"
              )}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-neutral-500 text-xs uppercase tracking-wider bg-white/[0.02]">
                <th className="px-5 py-4 font-semibold">Data & Horário</th>
                <th className="px-5 py-4 font-semibold">Cliente</th>
                <th className="px-5 py-4 font-semibold">Profissional</th>
                <th className="px-5 py-4 font-semibold">Serviços</th>
                <th className="px-5 py-4 font-semibold">Valor</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredAppointments.map(app => {
                const statusInfo = STATUS_LABELS[app.status];

                return (
                  <tr 
                    key={app.id} 
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Date & Time */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#d4af37]" />
                        {app.date}
                      </div>
                      <div className="text-neutral-400 text-[11px] mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {app.startTime} - {app.endTime} ({app.totalDuration} min)
                      </div>
                      {app.rescheduleHistory && app.rescheduleHistory.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <RotateCcw size={10} /> Remarcado ({app.rescheduleHistory.length}x)
                        </span>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{app.clientName}</div>
                      <div className="text-neutral-400 text-[11px]">{app.clientPhone}</div>
                    </td>

                    {/* Professional */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-neutral-200">{app.professionalName}</div>
                    </td>

                    {/* Services */}
                    <td className="px-5 py-4">
                      <div className="text-neutral-300 font-medium">
                        {app.serviceNames.join(', ')}
                      </div>
                      {app.notes && (
                        <div className="text-neutral-500 text-[11px] italic truncate max-w-xs mt-0.5">
                          "{app.notes}"
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 font-bold text-white">
                      {formatCurrency(app.totalPrice)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block",
                        statusInfo.bg,
                        statusInfo.text,
                        statusInfo.border
                      )}>
                        {statusInfo.label}
                      </span>
                      {app.status === 'cancelado' && app.cancellationReason && (
                        <div className="text-[10px] text-rose-400/80 mt-1 max-w-[160px] truncate" title={app.cancellationReason}>
                          {app.cancellationReason}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onEditAppointment(app)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-[#d4af37] text-neutral-300 hover:text-black rounded-lg text-xs font-bold transition-all"
                      >
                        Ver / Editar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-500">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
