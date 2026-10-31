import React from 'react';
import { Appointment, Professional, ProfessionalAbsence, AppointmentStatus } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { 
  Clock, 
  User, 
  Phone, 
  MoreVertical, 
  Edit3, 
  Calendar, 
  Ban, 
  CheckCircle2, 
  PlayCircle, 
  Coffee, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyViewProps {
  currentDate: Date;
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
  professionals: Professional[];
  onOpenNewAppointment: (time?: string, professionalId?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onRescheduleAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  currentDate,
  appointments,
  absences,
  professionals,
  onOpenNewAppointment,
  onEditAppointment,
  onRescheduleAppointment,
  onCancelAppointment,
  onUpdateStatus,
}) => {
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  // Filter day appointments and absences
  const dayAppointments = appointments.filter(a => a.date === dateStr);

  const getAbsencesForProf = (profId: string) => {
    return absences.filter(
      a => a.professionalId === profId && dateStr >= a.startDate && dateStr <= a.endDate
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview stats for the day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
          <span className="text-neutral-500 text-xs font-medium">Atendimentos no Dia</span>
          <p className="text-2xl font-bold text-white mt-1">{dayAppointments.length}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
          <span className="text-neutral-500 text-xs font-medium">Confirmados / Em Curso</span>
          <p className="text-2xl font-bold text-[#d4af37] mt-1">
            {dayAppointments.filter(a => a.status === 'confirmado' || a.status === 'em_atendimento').length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
          <span className="text-neutral-500 text-xs font-medium">Concluídos</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {dayAppointments.filter(a => a.status === 'concluido').length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-xl">
          <span className="text-neutral-500 text-xs font-medium">Faturamento Estimado</span>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(
              dayAppointments
                .filter(a => a.status !== 'cancelado')
                .reduce((acc, a) => acc + a.totalPrice, 0)
            )}
          </p>
        </div>
      </div>

      {/* Columns per Professional */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map(prof => {
          const profAppointments = dayAppointments
            .filter(a => a.professionalId === prof.id)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const profAbsences = getAbsencesForProf(prof.id);
          const hasAllDayAbsence = profAbsences.some(a => a.allDay);

          return (
            <div 
              key={prof.id} 
              className="bg-[#111111] border border-[#d4af37]/15 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header Professional */}
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-[#d4af37] font-bold border border-[#d4af37]/20 text-sm">
                    {prof.photoUrl || prof.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{prof.name}</h3>
                    <p className="text-neutral-400 text-xs">{prof.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenNewAppointment('09:00', prof.id)}
                  className="p-1.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all"
                  title={`Agendar com ${prof.name}`}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Absences notice */}
              {profAbsences.length > 0 && (
                <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 space-y-1">
                  {profAbsences.map(abs => (
                    <div key={abs.id} className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Coffee size={13} className="shrink-0" />
                      <span className="font-semibold">{abs.title}:</span>
                      <span>
                        {abs.allDay ? 'Dia inteiro' : `${abs.startTime} - ${abs.endTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Appointments List for this professional */}
              <div className="p-4 flex-1 space-y-3 min-h-[300px]">
                {hasAllDayAbsence ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-neutral-500">
                    <Coffee size={32} className="text-amber-500/40 mb-2" />
                    <p className="text-xs font-semibold text-neutral-400">Profissional em folga/férias hoje.</p>
                  </div>
                ) : profAppointments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-neutral-600 space-y-2">
                    <Clock size={28} className="mx-auto opacity-40" />
                    <p className="text-xs">Nenhum atendimento agendado para hoje.</p>
                    <button
                      onClick={() => onOpenNewAppointment('09:00', prof.id)}
                      className="text-xs text-[#d4af37] hover:underline font-bold"
                    >
                      + Criar primeiro agendamento
                    </button>
                  </div>
                ) : (
                  profAppointments.map(app => {
                    const statusInfo = STATUS_LABELS[app.status];

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all space-y-2.5",
                          app.status === 'cancelado' 
                            ? "bg-white/[0.02] border-white/5 opacity-60" 
                            : "bg-white/5 border-white/5 hover:border-[#d4af37]/30"
                        )}
                      >
                        {/* Time & Status Badge */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 text-[#d4af37] font-bold text-xs">
                            <Clock size={13} />
                            <span>{app.startTime} - {app.endTime}</span>
                            <span className="text-[10px] text-neutral-500 font-normal">({app.totalDuration} min)</span>
                          </div>

                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            statusInfo.bg,
                            statusInfo.text,
                            statusInfo.border
                          )}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Client details */}
                        <div>
                          <h4 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                            <User size={13} className="text-neutral-500 shrink-0" />
                            {app.clientName}
                          </h4>
                          {app.clientPhone && (
                            <p className="text-neutral-400 text-[11px] flex items-center gap-1 ml-4 mt-0.5">
                              <Phone size={10} className="text-neutral-500" />
                              {app.clientPhone}
                            </p>
                          )}
                        </div>

                        {/* Services & Price */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-neutral-400 line-clamp-1 pr-2">
                            {app.serviceNames.join(' + ')}
                          </span>
                          <span className="text-white font-bold shrink-0">
                            {formatCurrency(app.totalPrice)}
                          </span>
                        </div>

                        {/* Notes if any */}
                        {app.notes && (
                          <p className="text-[11px] text-neutral-400 italic bg-black/30 p-2 rounded-lg border border-white/5">
                            "{app.notes}"
                          </p>
                        )}

                        {/* Cancellation reason if canceled */}
                        {app.status === 'cancelado' && app.cancellationReason && (
                          <p className="text-[11px] text-rose-400 italic bg-rose-500/5 p-1.5 rounded border border-rose-500/20">
                            Motivo: {app.cancellationReason}
                          </p>
                        )}

                        {/* Status Transitions & Quick Actions */}
                        {app.status !== 'cancelado' && (
                          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1">
                              {app.status === 'aguardando' && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, 'confirmado')}
                                  className="px-2 py-1 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#d4af37] hover:text-black rounded text-[10px] font-bold transition-all"
                                >
                                  Confirmar
                                </button>
                              )}
                              {app.status === 'confirmado' && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, 'em_atendimento')}
                                  className="px-2 py-1 bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white rounded text-[10px] font-bold transition-all"
                                >
                                  Iniciar
                                </button>
                              )}
                              {app.status === 'em_atendimento' && (
                                <button
                                  onClick={() => onUpdateStatus(app.id, 'concluido')}
                                  className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded text-[10px] font-bold transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 size={12} />
                                  Concluir
                                </button>
                              )}
                              {app.status === 'concluido' && (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Finalizado
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() => onRescheduleAppointment(app)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 rounded text-[10px] font-medium transition-colors"
                                title="Remarcar"
                              >
                                Remarcar
                              </button>
                              <button
                                onClick={() => onEditAppointment(app)}
                                className="p-1 text-neutral-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => onCancelAppointment(app)}
                                className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Cancelar"
                              >
                                <Ban size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
