import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Calendar as CalendarIcon, 
  Coffee, 
  History as HistoryIcon,
  Filter, 
  Search, 
  User, 
  Scissors, 
  CheckCircle2, 
  Edit3, 
  RotateCcw, 
  Ban,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { 
  Appointment, 
  ProfessionalAbsence, 
  Client, 
  Professional, 
  Service, 
  AppointmentStatus 
} from '@/src/types';
import { 
  getInitialAppointments, 
  getInitialAbsences, 
  STATUS_LABELS,
  checkAppointmentConflict
} from '@/src/services/agendaStorage';
import { initialClientsList } from '@/src/components/Clients';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { initialServicesList } from '@/src/components/Services';
import { AppointmentModal } from '@/src/components/agenda/AppointmentModal';
import { RescheduleModal } from '@/src/components/agenda/RescheduleModal';
import { CancelModal } from '@/src/components/agenda/CancelModal';
import { AbsencesModal } from '@/src/components/agenda/AbsencesModal';
import { DailyView } from '@/src/components/agenda/DailyView';
import { WeeklyView } from '@/src/components/agenda/WeeklyView';
import { HistoryView } from '@/src/components/agenda/HistoryView';

import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  isToday as checkIsToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Agenda: React.FC = () => {
  // Shared persistent state
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>(
    'appointments',
    getInitialAppointments()
  );
  const [absences, setAbsences] = useLocalStorage<ProfessionalAbsence[]>(
    'absences',
    getInitialAbsences()
  );
  const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [professionals] = useLocalStorage<Professional[]>(
    'professionals',
    initialProfessionalsList
  );
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);

  // View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'history'>('monthly');

  // Filters
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('all');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>();
  const [modalInitialProfId, setModalInitialProfId] = useState<string | undefined>();

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);

  const [isAbsencesModalOpen, setIsAbsencesModalOpen] = useState(false);

  // Quick Client creation helper
  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
  };

  // Date Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'monthly') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'weekly') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'daily') {
      const prev = subDays(currentDate, 1);
      setCurrentDate(prev);
      setSelectedDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'weekly') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'daily') {
      const next = addDays(currentDate, 1);
      setCurrentDate(next);
      setSelectedDate(next);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Open Appointment modal helpers
  const handleOpenNewAppointment = (time?: string, professionalId?: string, dateStr?: string) => {
    setEditingAppointment(null);
    setModalInitialTime(time || '09:00');
    setModalInitialProfId(professionalId || professionals[0]?.id);
    setModalInitialDate(dateStr || format(selectedDate, 'yyyy-MM-dd'));
    setIsAppointmentModalOpen(true);
  };

  const handleOpenEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsAppointmentModalOpen(true);
  };

  const handleOpenReschedule = (appointment: Appointment) => {
    setReschedulingAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleOpenCancel = (appointment: Appointment) => {
    setCancelingAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  // Save / Update Appointment
  const handleSaveAppointment = (appointmentData: Appointment) => {
    setAppointments(prev => {
      const exists = prev.some(a => a.id === appointmentData.id);
      if (exists) {
        return prev.map(a => a.id === appointmentData.id ? appointmentData : a);
      }
      return [appointmentData, ...prev];
    });
  };

  // Quick Status change
  const handleUpdateStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  // Confirm Reschedule
  const handleConfirmReschedule = (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newProfessionalId: string,
    reason?: string
  ) => {
    const prof = professionals.find(p => p.id === newProfessionalId);

    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        const historyRecord = {
          previousDate: a.date,
          previousStartTime: a.startTime,
          previousEndTime: a.endTime,
          rescheduledAt: new Date().toISOString(),
          reason,
        };

        return {
          ...a,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          professionalId: newProfessionalId,
          professionalName: prof?.name || a.professionalName,
          status: 'confirmado',
          rescheduleHistory: [...(a.rescheduleHistory || []), historyRecord],
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  // Confirm Cancellation
  const handleConfirmCancel = (appointmentId: string, reason?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          status: 'cancelado',
          cancellationReason: reason,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  // Absences handlers
  const handleAddAbsence = (newAbsence: ProfessionalAbsence) => {
    setAbsences(prev => [newAbsence, ...prev]);
  };

  const handleDeleteAbsence = (id: string) => {
    if (confirm('Tem certeza que deseja remover este bloqueio?')) {
      setAbsences(prev => prev.filter(a => a.id !== id));
    }
  };

  // Filtered Appointments according to global filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchProf = selectedProfessionalFilter === 'all' || app.professionalId === selectedProfessionalFilter;
      const matchService = selectedServiceFilter === 'all' || app.serviceIds.includes(selectedServiceFilter);
      const matchStatus = selectedStatusFilter === 'all' || app.status === selectedStatusFilter;
      const matchSearch = !searchQuery.trim() || 
        app.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.clientPhone.includes(searchQuery) ||
        app.serviceNames.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchProf && matchService && matchStatus && matchSearch;
    });
  }, [appointments, selectedProfessionalFilter, selectedServiceFilter, selectedStatusFilter, searchQuery]);

  // Calendar monthly calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Selected Day summary data
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayAppointments = useMemo(() => {
    return filteredAppointments
      .filter(a => a.date === selectedDateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredAppointments, selectedDateStr]);

  const selectedDayAbsences = useMemo(() => {
    return absences.filter(
      a => selectedDateStr >= a.startDate && selectedDateStr <= a.endDate
    );
  }, [absences, selectedDateStr]);

  // Period header title text
  const periodTitle = useMemo(() => {
    if (viewMode === 'monthly') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (viewMode === 'weekly') {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(wStart, "dd 'de' MMM", { locale: ptBR })} - ${format(wEnd, "dd 'de' MMM yyyy", { locale: ptBR })}`;
    } else if (viewMode === 'daily') {
      return format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR });
    } else {
      return 'Histórico Completo';
    }
  }, [viewMode, currentDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Agenda</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
              Luxe Pro
            </span>
          </div>
          <p className="text-neutral-400 mt-1">
            Gestão integrada de horários, profissionais, serviços e bloqueios com prevenção de conflitos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsAbsencesModalOpen(true)}
            className="flex items-center gap-2 bg-[#141414] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Coffee size={16} className="text-[#d4af37]" />
            Folgas & Férias
          </button>

          <button 
            onClick={() => handleOpenNewAppointment()}
            className="flex items-center gap-2 bg-[#d4af37] text-black px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/10"
          >
            <Plus size={16} />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Main Calendar Navigation & Filters Toolbar */}
      <div className="bg-[#111111] border border-[#d4af37]/15 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            {viewMode !== 'history' && (
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
                <button 
                  onClick={handlePrev} 
                  className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleNext} 
                  className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                  title="Próximo"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <h2 className="text-lg sm:text-xl font-bold text-white capitalize min-w-[200px]">
              {periodTitle}
            </h2>

            {viewMode !== 'history' && (
              <button 
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-neutral-300 hover:text-[#d4af37] transition-all"
              >
                Hoje
              </button>
            )}
          </div>

          {/* View Mode Selector Tabs */}
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-full lg:w-auto">
            {(['daily', 'weekly', 'monthly', 'history'] as const).map((mode) => {
              const labels = {
                daily: 'Diário',
                weekly: 'Semanal',
                monthly: 'Mensal',
                history: 'Histórico',
              };
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all",
                    viewMode === mode 
                      ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20" 
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Bar (Profissional, Serviço, Status, Pesquisa) */}
        {viewMode !== 'history' && (
          <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
              <input 
                type="text"
                placeholder="Buscar cliente ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            {/* Professional filter */}
            <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-1">
              <User size={14} className="text-[#d4af37] shrink-0" />
              <select
                value={selectedProfessionalFilter}
                onChange={(e) => setSelectedProfessionalFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none"
              >
                <option value="all">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Service filter */}
            <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-1">
              <Scissors size={14} className="text-[#d4af37] shrink-0" />
              <select
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none"
              >
                <option value="all">Todos os Serviços</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-1">
              <Filter size={14} className="text-[#d4af37] shrink-0" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="aguardando">Aguardando</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODES RENDERING */}
      {viewMode === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Calendar Grid */}
          <div className="bg-[#111111] border border-[#d4af37]/15 rounded-2xl p-4 sm:p-6 overflow-hidden">
            {/* Weekdays row */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider py-2">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = checkIsToday(day);

                // Appointments for this day
                const dayApps = filteredAppointments.filter(a => a.date === dayStr);
                const dayAbs = absences.filter(
                  a => dayStr >= a.startDate && dayStr <= a.endDate
                );

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[105px] sm:min-h-[125px] p-2 rounded-xl transition-all border cursor-pointer flex flex-col justify-between group",
                      !isCurrentMonth && "opacity-25 bg-black/20 border-white/5",
                      isCurrentMonth && "bg-[#141414] border-white/5 hover:border-[#d4af37]/40",
                      isSelected && "border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-lg shadow-[#d4af37]/5 bg-[#171717]"
                    )}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isToday ? "bg-[#d4af37] text-black" : isSelected ? "text-[#d4af37] font-black" : "text-neutral-400 group-hover:text-white"
                      )}>
                        {format(day, 'd')}
                      </span>

                      {dayApps.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/10 text-neutral-300">
                          {dayApps.length}
                        </span>
                      )}
                    </div>

                    {/* Day badges (Apps and Absences) */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {/* Absences pill */}
                      {dayAbs.slice(0, 1).map(abs => (
                        <div 
                          key={abs.id} 
                          className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-300 font-semibold truncate flex items-center gap-1"
                          title={`${abs.professionalName}: ${abs.title}`}
                        >
                          <Coffee size={9} className="shrink-0" />
                          <span className="truncate">{abs.title}</span>
                        </div>
                      ))}

                      {/* Top 2 appointments preview */}
                      {dayApps.slice(0, 2).map(app => {
                        const statusInfo = STATUS_LABELS[app.status];
                        return (
                          <div 
                            key={app.id}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-medium truncate border flex items-center justify-between",
                              statusInfo.bg,
                              statusInfo.text,
                              statusInfo.border
                            )}
                          >
                            <span className="truncate">{app.startTime} {app.clientName}</span>
                          </div>
                        );
                      })}

                      {dayApps.length > 2 && (
                        <span className="text-[9px] text-neutral-500 font-semibold block text-center">
                          +{dayApps.length - 2} mais
                        </span>
                      )}
                    </div>

                    {/* Quick Add icon visible on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          handleOpenNewAppointment('09:00', undefined, dayStr);
                        }}
                        className="p-1 rounded bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black transition-all"
                        title="Agendar neste dia"
                      >
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drawer / Summary */}
          <div className="bg-[#111111] border border-[#d4af37]/20 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarIcon size={18} className="text-[#d4af37]" />
                  Atendimentos em {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {selectedDayAppointments.length} agendamento{selectedDayAppointments.length === 1 ? '' : 's'} • {selectedDayAbsences.length} bloqueio{selectedDayAbsences.length === 1 ? '' : 's'} de profissional
                </p>
              </div>

              <button
                onClick={() => handleOpenNewAppointment('09:00', undefined, selectedDateStr)}
                className="flex items-center gap-1.5 bg-[#d4af37] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all shadow-md"
              >
                <Plus size={14} />
                Agendar neste Dia
              </button>
            </div>

            {/* Absences of selected day */}
            {selectedDayAbsences.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee size={14} />
                  Ausências e Intervalos Cadastrados no Dia:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedDayAbsences.map(abs => (
                    <div key={abs.id} className="p-2 rounded-lg bg-black/40 text-xs text-neutral-300">
                      <span className="font-bold text-white block">{abs.professionalName}</span>
                      <span className="text-amber-400">{abs.title}</span>
                      <span className="text-neutral-500 block text-[11px]">
                        {abs.allDay ? 'Dia todo' : `${abs.startTime} às ${abs.endTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments of selected day */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {selectedDayAppointments.map(app => {
                const statusInfo = STATUS_LABELS[app.status];

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[#d4af37] font-bold text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {app.startTime} - {app.endTime}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        statusInfo.bg,
                        statusInfo.text,
                        statusInfo.border
                      )}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-white font-bold text-sm">{app.clientName}</h4>
                      <p className="text-neutral-400 text-xs">{app.serviceNames.join(' + ')}</p>
                      <p className="text-[#d4af37] text-xs font-semibold mt-1">
                        Profissional: {app.professionalName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-white font-bold text-xs">{formatCurrency(app.totalPrice)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenReschedule(app)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-neutral-300"
                        >
                          Remarcar
                        </button>
                        <button
                          onClick={() => handleOpenEditAppointment(app)}
                          className="p-1 hover:text-[#d4af37] text-neutral-400"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenCancel(app)}
                          className="p-1 hover:text-rose-400 text-neutral-400"
                          title="Cancelar"
                        >
                          <Ban size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedDayAppointments.length === 0 && (
                <div className="col-span-full py-8 text-center text-neutral-500 text-xs">
                  Nenhum atendimento agendado para esta data.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'daily' && (
        <DailyView 
          currentDate={currentDate}
          appointments={filteredAppointments}
          absences={absences}
          professionals={professionals}
          onOpenNewAppointment={handleOpenNewAppointment}
          onEditAppointment={handleOpenEditAppointment}
          onRescheduleAppointment={handleOpenReschedule}
          onCancelAppointment={handleOpenCancel}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {viewMode === 'weekly' && (
        <WeeklyView 
          currentDate={currentDate}
          appointments={filteredAppointments}
          absences={absences}
          professionals={professionals}
          onOpenNewAppointment={handleOpenNewAppointment}
          onEditAppointment={handleOpenEditAppointment}
          onRescheduleAppointment={handleOpenReschedule}
          onCancelAppointment={handleOpenCancel}
          onUpdateStatus={handleUpdateStatus}
          onSelectDay={(day) => {
            setSelectedDate(day);
            setCurrentDate(day);
            setViewMode('daily');
          }}
        />
      )}

      {viewMode === 'history' && (
        <HistoryView 
          appointments={appointments}
          professionals={professionals}
          services={services}
          onOpenNewAppointment={handleOpenNewAppointment}
          onEditAppointment={handleOpenEditAppointment}
        />
      )}

      {/* MODALS */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        existingAppointment={editingAppointment}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        initialProfessionalId={modalInitialProfId}
        clients={clients}
        onAddClient={handleAddClient}
        professionals={professionals}
        services={services}
        appointments={appointments}
        absences={absences}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        appointment={reschedulingAppointment}
        onConfirmReschedule={handleConfirmReschedule}
        professionals={professionals}
        appointments={appointments}
        absences={absences}
      />

      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        appointment={cancelingAppointment}
        onConfirmCancel={handleConfirmCancel}
      />

      <AbsencesModal
        isOpen={isAbsencesModalOpen}
        onClose={() => setIsAbsencesModalOpen(false)}
        absences={absences}
        onAddAbsence={handleAddAbsence}
        onDeleteAbsence={handleDeleteAbsence}
        professionals={professionals}
      />
    </div>
  );
};
