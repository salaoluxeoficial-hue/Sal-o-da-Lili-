import { Appointment, ProfessionalAbsence, AppointmentStatus } from '@/src/types';
import { format, addDays } from 'date-fns';

export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeToMinutes(startTime);
  const endMin = startMin + durationMinutes;
  return minutesToTime(endMin);
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  conflictingAppointment?: Appointment;
  conflictingAbsence?: ProfessionalAbsence;
}

/**
 * Checks whether an appointment can be placed without overlapping another active
 * appointment of the same professional or an absence/break.
 */
export function checkAppointmentConflict(params: {
  professionalId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
  excludeAppointmentId?: string;
}): ConflictCheckResult {
  const {
    professionalId,
    date,
    startTime,
    endTime,
    appointments,
    absences,
    excludeAppointmentId,
  } = params;

  const targetStart = timeToMinutes(startTime);
  const targetEnd = timeToMinutes(endTime);

  if (targetEnd <= targetStart) {
    return {
      hasConflict: true,
      reason: 'O horário de término deve ser após o horário de início.',
    };
  }

  // 1. Check absences / time blocks for the professional
  const professionalAbsences = absences.filter(
    (a) => a.professionalId === professionalId
  );

  for (const absence of professionalAbsences) {
    // Check if the date is within [absence.startDate, absence.endDate]
    if (date >= absence.startDate && date <= absence.endDate) {
      if (absence.allDay) {
        return {
          hasConflict: true,
          reason: `Profissional indisponível: ${absence.title} (${absence.type.toUpperCase()}) o dia todo.`,
          conflictingAbsence: absence,
        };
      } else if (absence.startTime && absence.endTime) {
        const absStart = timeToMinutes(absence.startTime);
        const absEnd = timeToMinutes(absence.endTime);

        // Overlap: start1 < end2 && end1 > start2
        if (targetStart < absEnd && targetEnd > absStart) {
          return {
            hasConflict: true,
            reason: `Profissional em ${absence.title} (${absence.startTime} às ${absence.endTime}).`,
            conflictingAbsence: absence,
          };
        }
      }
    }
  }

  // 2. Check existing appointments of the professional on that day
  const sameDayAppointments = appointments.filter(
    (app) =>
      app.professionalId === professionalId &&
      app.date === date &&
      app.status !== 'cancelado' &&
      app.id !== excludeAppointmentId
  );

  for (const existing of sameDayAppointments) {
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);

    if (targetStart < existingEnd && targetEnd > existingStart) {
      return {
        hasConflict: true,
        reason: `Horário colide com o agendamento de ${existing.clientName} (${existing.startTime} - ${existing.endTime}) - ${existing.serviceNames.join(', ')}.`,
        conflictingAppointment: existing,
      };
    }
  }

  return { hasConflict: false };
}

export interface TimeSlotOption {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

/**
 * Generates regular day time slots (e.g. 08:00 to 20:00 every 30 mins)
 * and evaluates their availability for a given duration.
 */
export function generateTimeSlots(params: {
  date: string;
  professionalId: string;
  totalDurationMinutes: number;
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
  excludeAppointmentId?: string;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
}): TimeSlotOption[] {
  const {
    date,
    professionalId,
    totalDurationMinutes,
    appointments,
    absences,
    excludeAppointmentId,
    startHour = 8,
    endHour = 20,
    stepMinutes = 30,
  } = params;

  const slots: TimeSlotOption[] = [];
  const startMinute = startHour * 60;
  const endMinute = endHour * 60;

  for (let m = startMinute; m < endMinute; m += stepMinutes) {
    const timeStr = minutesToTime(m);
    const calcEnd = minutesToTime(m + totalDurationMinutes);

    // If it exceeds salon closing time
    if (m + totalDurationMinutes > endMinute) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        reason: 'Ultrapassa o horário de funcionamento do salão (20:00)',
      });
      continue;
    }

    if (!professionalId) {
      slots.push({
        time: timeStr,
        isAvailable: true,
      });
      continue;
    }

    const conflict = checkAppointmentConflict({
      professionalId,
      date,
      startTime: timeStr,
      endTime: calcEnd,
      appointments,
      absences,
      excludeAppointmentId,
    });

    slots.push({
      time: timeStr,
      isAvailable: !conflict.hasConflict,
      reason: conflict.reason,
    });
  }

  return slots;
}

/**
 * Returns initial realistic appointments synchronized with the system date
 */
export function getInitialAppointments(): Appointment[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  return [
    {
      id: 'apt-1',
      clientId: '1',
      clientName: 'Carlos Alberto',
      clientPhone: '(11) 98888-7777',
      clientEmail: 'carlos@email.com',
      professionalId: '1',
      professionalName: 'Ricardo Silva',
      serviceIds: ['1', '3'],
      serviceNames: ['Corte Masculino', 'Barba Terapia'],
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      totalDuration: 60,
      totalPrice: 105.00,
      status: 'confirmado',
      notes: 'Cliente prefere corte degradê navalhado e toalha quente na barba.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-2',
      clientId: '2',
      clientName: 'Mariana Costa',
      clientPhone: '(11) 97777-6666',
      clientEmail: 'mariana@email.com',
      professionalId: '2',
      professionalName: 'Ana Oliveira',
      serviceIds: ['4', '5'],
      serviceNames: ['Coloração', 'Escova Modeladora'],
      date: today,
      startTime: '14:00',
      endTime: '16:45',
      totalDuration: 165,
      totalPrice: 260.00,
      status: 'em_atendimento',
      notes: 'Avaliação de mechas e teste de mecha aprovado anteriormente.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-3',
      clientId: '3',
      clientName: 'Roberto Junior',
      clientPhone: '(11) 96666-5555',
      clientEmail: 'roberto@email.com',
      professionalId: '1',
      professionalName: 'Ricardo Silva',
      serviceIds: ['1'],
      serviceNames: ['Corte Masculino'],
      date: today,
      startTime: '10:30',
      endTime: '11:00',
      totalDuration: 30,
      totalPrice: 60.00,
      status: 'concluido',
      notes: 'Corte tradicional na tesoura.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-4',
      clientId: '2',
      clientName: 'Mariana Costa',
      clientPhone: '(11) 97777-6666',
      clientEmail: 'mariana@email.com',
      professionalId: '2',
      professionalName: 'Ana Oliveira',
      serviceIds: ['2', '5'],
      serviceNames: ['Corte Feminino', 'Escova Modeladora'],
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:45',
      totalDuration: 105,
      totalPrice: 200.00,
      status: 'aguardando',
      notes: 'Primeiro horário da manhã para evento à tarde.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-5',
      clientId: '1',
      clientName: 'Carlos Alberto',
      clientPhone: '(11) 98888-7777',
      clientEmail: 'carlos@email.com',
      professionalId: '1',
      professionalName: 'Ricardo Silva',
      serviceIds: ['3'],
      serviceNames: ['Barba Terapia'],
      date: dayAfter,
      startTime: '16:00',
      endTime: '16:30',
      totalDuration: 30,
      totalPrice: 45.00,
      status: 'confirmado',
      notes: 'Manutenção semanal.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Returns initial realistic professional absences (vacations, breaks, day-offs)
 */
export function getInitialAbsences(): ProfessionalAbsence[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayAfter = format(addDays(new Date(), 4), 'yyyy-MM-dd');

  return [
    {
      id: 'abs-1',
      professionalId: '1',
      professionalName: 'Ricardo Silva',
      type: 'almoco',
      title: 'Intervalo de Almoço',
      startDate: today,
      endDate: today,
      startTime: '12:00',
      endTime: '13:00',
      allDay: false,
      notes: 'Horário reservado diariamente para almoço.',
    },
    {
      id: 'abs-2',
      professionalId: '2',
      professionalName: 'Ana Oliveira',
      type: 'almoco',
      title: 'Intervalo de Almoço',
      startDate: today,
      endDate: today,
      startTime: '12:30',
      endTime: '13:30',
      allDay: false,
      notes: 'Horário reservado para almoço.',
    },
    {
      id: 'abs-3',
      professionalId: '1',
      professionalName: 'Ricardo Silva',
      type: 'curso',
      title: 'Workshop de Visagismo Masculino',
      startDate: dayAfter,
      endDate: dayAfter,
      allDay: true,
      notes: 'Treinamento profissional externo.',
    },
  ];
}

export const STATUS_LABELS: Record<AppointmentStatus, { label: string; bg: string; text: string; border: string }> = {
  aguardando: {
    label: 'Aguardando',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  confirmado: {
    label: 'Confirmado',
    bg: 'bg-[#d4af37]/10',
    text: 'text-[#d4af37]',
    border: 'border-[#d4af37]/30',
  },
  em_atendimento: {
    label: 'Em Atendimento',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};
