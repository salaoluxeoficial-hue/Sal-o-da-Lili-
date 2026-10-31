import React from 'react';
import { Appointment, Professional, ProfessionalAbsence, AppointmentStatus } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday as checkIsToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, User, Coffee, CheckCircle2 } from 'lucide-react';

interface WeeklyViewProps {
  currentDate: Date;
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
  professionals: Professional[];
  onOpenNewAppointment: (time?: string, professionalId?: string, dateStr?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onRescheduleAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onSelectDay: (date: Date) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentDate,
  appointments,
  absences,
  professionals,
  onOpenNewAppointment,
  onEditAppointment,
  onRescheduleAppointment,
  onCancelAppointment,
  onUpdateStatus,
  onSelectDay,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-4">
      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysInWeek.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isToday = checkIsToday(day);
          const isSelectedDay = isSameDay(day, currentDate);

          const dayAppointments = appointments
            .filter(a => a.date === dayStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const dayAbsences = absences.filter(
            a => dayStr >= a.startDate && dayStr <= a.endDate
          );

          const totalRevenue = dayAppointments
            .filter(a => a.status !== 'cancelado')
            .reduce((acc, a) => acc + a.totalPrice, 0);

          return (
            <div
              key={dayStr}
              className={cn(
                "bg-[#111111] border rounded-2xl flex flex-col min-h-[500px] transition-all",
                isToday 
                  ? "border-[#d4af37]/60 ring-1 ring-[#d4af37]/30" 
                  : isSelectedDay 
                    ? "border-[#d4af37]/30" 
                    : "border-white/5 hover:border-white/20"
              )}
            >
              {/* Day Header */}
              <div 
                onClick={() => onSelectDay(day)}
                className={cn(
                  "p-3 border-b border-white/5 text-center cursor-pointer transition-colors rounded-t-2xl",
                  isToday ? "bg-[#d4af37]/10" : "bg-white/[0.02] hover:bg-white/5"
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-lg font-black my-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full",
                  isToday ? "bg-[#d4af37] text-black" : "text-white"
                )}>
                  {format(day, 'd')}
                </span>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {dayAppointments.length} agendamento{dayAppointments.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Day Absences Indicator */}
              {dayAbsences.length > 0 && (
                <div className="p-2 space-y-1 bg-amber-500/5 border-b border-amber-500/10">
                  {dayAbsences.map(abs => (
                    <div 
                      key={abs.id} 
                      className="px-2 py-1 bg-amber-500/10 rounded text-[10px] text-amber-300 font-medium truncate flex items-center gap-1"
                      title={`${abs.professionalName}: ${abs.title}`}
                    >
                      <Coffee size={10} className="shrink-0" />
                      <span className="font-bold">{abs.professionalName.split(' ')[0]}:</span>
                      <span className="truncate">{abs.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Appointments for the Day */}
              <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[550px]">
                {dayAppointments.map(app => {
                  const statusInfo = STATUS_LABELS[app.status];

                  return (
                    <div
                      key={app.id}
                      onClick={() => onEditAppointment(app)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] group relative",
                        app.status === 'cancelado' 
                          ? "bg-white/[0.02] border-white/5 opacity-50" 
                          : "bg-white/5 border-white/5 hover:border-[#d4af37]/40"
                      )}
                    >
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <span className="text-[11px] font-bold text-[#d4af37] flex items-center gap-1">
                          <Clock size={10} />
                          {app.startTime}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase",
                          statusInfo.bg,
                          statusInfo.text
                        )}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <h4 className="text-white font-bold text-xs line-clamp-1 group-hover:text-[#d4af37] transition-colors">
                        {app.clientName}
                      </h4>
                      <p className="text-neutral-400 text-[10px] line-clamp-1 mt-0.5">
                        {app.serviceNames.join(', ')}
                      </p>
                      
                      <div className="pt-1.5 mt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500 font-medium">
                          {app.professionalName.split(' ')[0]}
                        </span>
                        <span className="text-white font-bold">
                          {formatCurrency(app.totalPrice)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {dayAppointments.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-neutral-600 text-xs">
                    <span>Sem agendamentos</span>
                  </div>
                )}
              </div>

              {/* Add Appointment Button on footer of each day */}
              <div className="p-2 border-t border-white/5 bg-[#0d0d0d] rounded-b-2xl">
                <button
                  onClick={() => onOpenNewAppointment('09:00', undefined, dayStr)}
                  className="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-[#d4af37]/15 text-neutral-400 hover:text-[#d4af37] text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Plus size={12} />
                  Agendar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
