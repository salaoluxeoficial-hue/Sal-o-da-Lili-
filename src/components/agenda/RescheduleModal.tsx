import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, AlertTriangle, ArrowRight, User, Scissors } from 'lucide-react';
import { Appointment, Professional, ProfessionalAbsence, RescheduleRecord } from '@/src/types';
import { calculateEndTime, checkAppointmentConflict, generateTimeSlots } from '@/src/services/agendaStorage';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirmReschedule: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newProfessionalId: string,
    reason?: string
  ) => void;
  professionals: Professional[];
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirmReschedule,
  professionals,
  appointments,
  absences,
}) => {
  if (!isOpen || !appointment) return null;

  const [newDate, setNewDate] = useState(appointment.date);
  const [newStartTime, setNewStartTime] = useState(appointment.startTime);
  const [newProfessionalId, setNewProfessionalId] = useState(appointment.professionalId);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const newEndTime = useMemo(() => {
    return calculateEndTime(newStartTime, appointment.totalDuration);
  }, [newStartTime, appointment.totalDuration]);

  // Check for conflicts
  const conflictResult = useMemo(() => {
    return checkAppointmentConflict({
      professionalId: newProfessionalId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      appointments,
      absences,
      excludeAppointmentId: appointment.id,
    });
  }, [newProfessionalId, newDate, newStartTime, newEndTime, appointments, absences, appointment.id]);

  // Dynamic slot suggestions
  const timeSlots = useMemo(() => {
    return generateTimeSlots({
      date: newDate,
      professionalId: newProfessionalId,
      totalDurationMinutes: appointment.totalDuration,
      appointments,
      absences,
      excludeAppointmentId: appointment.id,
      startHour: 8,
      endHour: 20,
      stepMinutes: 30,
    });
  }, [newDate, newProfessionalId, appointment.totalDuration, appointments, absences, appointment.id]);

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const conflict = checkAppointmentConflict({
      professionalId: newProfessionalId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      appointments,
      absences,
      excludeAppointmentId: appointment.id,
    });

    if (conflict.hasConflict) {
      setErrorMessage(conflict.reason || 'Conflito de horário detectado no novo momento escolhido.');
      return;
    }

    onConfirmReschedule(
      appointment.id,
      newDate,
      newStartTime,
      newEndTime,
      newProfessionalId,
      reason.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Remarcar Agendamento</h3>
              <p className="text-neutral-400 text-xs">
                Selecione a nova data e horário para {appointment.clientName}.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current appointment info */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Cliente:</span>
              <span className="font-bold text-white">{appointment.clientName} ({appointment.clientPhone})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Serviços:</span>
              <span className="text-neutral-200">{appointment.serviceNames.join(', ')} ({appointment.totalDuration} min)</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-neutral-400">Horário Atual:</span>
              <span className="text-[#d4af37] font-semibold">
                {appointment.date} das {appointment.startTime} às {appointment.endTime}
              </span>
            </div>
          </div>

          {/* New details */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Profissional
              </label>
              <select
                value={newProfessionalId}
                onChange={(e) => setNewProfessionalId(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              >
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Nova Data *
                </label>
                <input 
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Novo Horário *
                </label>
                <input 
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>
            </div>

            <div className="text-xs text-neutral-400 bg-[#141414] border border-white/10 p-3 rounded-xl flex items-center justify-between">
              <span>Novo término previsto:</span>
              <strong className="text-white">{newEndTime}</strong>
            </div>

            {/* Quick slots */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Horários Sugeridos
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setNewStartTime(slot.time)}
                    className={cn(
                      "py-1 rounded text-xs font-bold border transition-all",
                      newStartTime === slot.time
                        ? "bg-[#d4af37] text-black border-[#d4af37]"
                        : slot.isAvailable
                          ? "bg-white/5 border-white/10 text-neutral-300 hover:border-[#d4af37]"
                          : "bg-black/30 border-neutral-900 text-neutral-600 line-through"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            {conflictResult.hasConflict && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {conflictResult.reason}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Motivo da Remarcação (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Pedido do cliente via WhatsApp"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-neutral-400 hover:bg-white/5 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={conflictResult.hasConflict}
              className={cn(
                "flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all shadow-lg",
                conflictResult.hasConflict
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-[#d4af37] text-black hover:bg-[#d4af37]/90 shadow-[#d4af37]/10"
              )}
            >
              Confirmar Remarcação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
