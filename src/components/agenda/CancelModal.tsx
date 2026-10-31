import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Ban } from 'lucide-react';
import { Appointment } from '@/src/types';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirmCancel: (appointmentId: string, reason?: string) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirmCancel,
}) => {
  if (!isOpen || !appointment) return null;

  const [reason, setReason] = useState('Desistência do cliente');

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCancel(appointment.id, reason.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-rose-500/30 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-rose-500/10 flex items-center justify-between bg-gradient-to-r from-rose-950/20 to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <Ban size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Cancelar Agendamento</h3>
              <p className="text-neutral-400 text-xs">
                Esta ação liberará o horário na agenda.
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

        <form onSubmit={handleCancel} className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-1.5 text-xs text-neutral-300">
            <p className="font-bold text-white text-sm">{appointment.clientName}</p>
            <p className="text-neutral-400">{appointment.serviceNames.join(', ')}</p>
            <p className="text-rose-400 font-medium">
              {appointment.date} às {appointment.startTime} com {appointment.professionalName}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Motivo do Cancelamento
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500/50"
            >
              <option value="Desistência do cliente">Desistência do cliente</option>
              <option value="Imprevisto pessoal do cliente">Imprevisto pessoal do cliente</option>
              <option value="Indisponibilidade do profissional">Indisponibilidade do profissional</option>
              <option value="Agendamento duplicado/errôneo">Agendamento duplicado/errôneo</option>
              <option value="Outro motivo">Outro motivo</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-neutral-400 hover:bg-white/5 transition-all text-sm"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20"
            >
              Confirmar Cancelamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
