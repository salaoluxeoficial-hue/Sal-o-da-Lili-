import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Scissors, DollarSign, AlertTriangle, Check, Plus, Phone } from 'lucide-react';
import { Appointment, Client, Professional, Service, ProfessionalAbsence } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { 
  calculateEndTime, 
  checkAppointmentConflict, 
  generateTimeSlots, 
  STATUS_LABELS 
} from '@/src/services/agendaStorage';
import { format } from 'date-fns';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  existingAppointment?: Appointment | null;
  initialDate?: string;
  initialTime?: string;
  initialProfessionalId?: string;
  clients: Client[];
  onAddClient: (client: Client) => void;
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  absences: ProfessionalAbsence[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAppointment,
  initialDate,
  initialTime,
  initialProfessionalId,
  clients,
  onAddClient,
  professionals,
  services,
  appointments,
  absences,
}) => {
  const [clientId, setClientId] = useState('');
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [professionalId, setProfessionalId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [status, setStatus] = useState<'aguardando' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado'>('confirmado');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (existingAppointment) {
      setClientId(existingAppointment.clientId);
      setProfessionalId(existingAppointment.professionalId);
      setSelectedServiceIds(existingAppointment.serviceIds);
      setDate(existingAppointment.date);
      setStartTime(existingAppointment.startTime);
      setStatus(existingAppointment.status);
      setNotes(existingAppointment.notes || '');
    } else {
      setClientId(clients[0]?.id || '');
      setProfessionalId(initialProfessionalId || professionals[0]?.id || '');
      setSelectedServiceIds(services[0] ? [services[0].id] : []);
      setDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
      setStartTime(initialTime || '09:00');
      setStatus('confirmado');
      setNotes('');
    }
    setErrorMessage(null);
    setIsQuickClientOpen(false);
  }, [existingAppointment, isOpen, initialDate, initialTime, initialProfessionalId]);

  // Selected services calculation
  const selectedServices = useMemo(() => {
    return services.filter(s => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalDuration = useMemo(() => {
    const sum = selectedServices.reduce((acc, s) => acc + s.duration, 0);
    return sum > 0 ? sum : 30;
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices]);

  // Calculated End Time
  const endTime = useMemo(() => {
    return calculateEndTime(startTime, totalDuration);
  }, [startTime, totalDuration]);

  // Conflict verification in real-time
  const conflictResult = useMemo(() => {
    if (!professionalId || !date || !startTime) return { hasConflict: false };
    return checkAppointmentConflict({
      professionalId,
      date,
      startTime,
      endTime,
      appointments,
      absences,
      excludeAppointmentId: existingAppointment?.id,
    });
  }, [professionalId, date, startTime, endTime, appointments, absences, existingAppointment]);

  // Dynamic available time slots
  const timeSlots = useMemo(() => {
    return generateTimeSlots({
      date,
      professionalId,
      totalDurationMinutes: totalDuration,
      appointments,
      absences,
      excludeAppointmentId: existingAppointment?.id,
      startHour: 8,
      endHour: 20,
      stepMinutes: 30,
    });
  }, [date, professionalId, totalDuration, appointments, absences, existingAppointment]);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleCreateQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: Client = {
      id: 'cli-' + Date.now(),
      name: newClientName.trim(),
      phone: newClientPhone.trim() || '(11) 99999-9999',
      whatsapp: newClientPhone.trim() || '(11) 99999-9999',
      email: `${newClientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      status: 'ativo',
      hasPortalAccess: true,
      password: 'senha' + Math.floor(100 + Math.random() * 900),
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddClient(newClient);
    setClientId(newClient.id);
    setNewClientName('');
    setNewClientPhone('');
    setIsQuickClientOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientId) {
      setErrorMessage('Selecione ou cadastre um cliente.');
      return;
    }

    if (!professionalId) {
      setErrorMessage('Selecione um profissional.');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMessage('Selecione ao menos um serviço.');
      return;
    }

    // Strict conflict check before saving
    const conflict = checkAppointmentConflict({
      professionalId,
      date,
      startTime,
      endTime,
      appointments,
      absences,
      excludeAppointmentId: existingAppointment?.id,
    });

    if (conflict.hasConflict) {
      setErrorMessage(conflict.reason || 'Conflito de horário detectado para este profissional.');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    const professional = professionals.find(p => p.id === professionalId);

    const appointmentData: Appointment = {
      id: existingAppointment?.id || 'apt-' + Date.now(),
      clientId,
      clientName: client?.name || 'Cliente',
      clientPhone: client?.phone || '',
      clientEmail: client?.email,
      professionalId,
      professionalName: professional?.name || 'Profissional',
      serviceIds: selectedServiceIds,
      serviceNames: selectedServices.map(s => s.name),
      date,
      startTime,
      endTime,
      totalDuration,
      totalPrice,
      status,
      notes: notes.trim() || undefined,
      rescheduleHistory: existingAppointment?.rescheduleHistory,
      createdAt: existingAppointment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(appointmentData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {existingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
              <p className="text-neutral-400 text-xs">
                Preencha os detalhes do cliente, serviços e horário desejado.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Cliente & Profissional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-[#d4af37]" />
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(!isQuickClientOpen)}
                  className="text-xs font-bold text-[#d4af37] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} />
                  {isQuickClientOpen ? 'Fechar Cadastro' : 'Cadastrar Rápido'}
                </button>
              </div>

              {isQuickClientOpen ? (
                <div className="p-3 bg-white/5 border border-[#d4af37]/30 rounded-xl space-y-3">
                  <input 
                    type="text"
                    placeholder="Nome completo do cliente"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  <input 
                    type="text"
                    placeholder="WhatsApp / Telefone"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateQuickClient}
                      className="flex-1 bg-[#d4af37] text-black text-xs font-bold py-2 rounded-lg hover:bg-[#d4af37]/90 transition-all"
                    >
                      Salvar Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuickClientOpen(false)}
                      className="px-3 bg-white/10 text-neutral-400 text-xs font-medium py-2 rounded-lg hover:bg-white/15"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                >
                  <option value="" disabled>Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Profissional */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors size={14} className="text-[#d4af37]" />
                Profissional *
              </label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              >
                <option value="" disabled>Selecione um profissional...</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Seleção de Serviços */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Serviços a Realizar *
              </label>
              <span className="text-xs text-neutral-400">
                Selecione um ou mais serviços
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
              {services.map(s => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between",
                      isSelected 
                        ? "bg-[#d4af37]/15 border-[#d4af37] text-white" 
                        : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/20 hover:text-white"
                    )}
                  >
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-bold text-white line-clamp-1">{s.name}</p>
                      <p className="text-[11px] text-neutral-400">{s.duration} min • {formatCurrency(s.price)}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                      isSelected ? "bg-[#d4af37] border-[#d4af37] text-black" : "border-white/20"
                    )}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo Automático de Duração e Preço */}
            <div className="bg-[#141414] border border-[#d4af37]/20 p-4 rounded-xl flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#d4af37]" />
                <span className="text-xs text-neutral-300 font-medium">Duração Total:</span>
                <span className="text-sm font-bold text-white">{totalDuration} minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[#d4af37]" />
                <span className="text-xs text-neutral-300 font-medium">Valor Total:</span>
                <span className="text-base font-bold text-[#d4af37]">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 3. Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#d4af37]" />
                Data do Atendimento *
              </label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-[#d4af37]" />
                Horário de Início *
              </label>
              <div className="flex gap-2">
                <input 
                  type="time"
                  required
                  step={300} // 5 mins
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
                <div className="px-3 bg-white/5 border border-white/10 rounded-xl flex items-center whitespace-nowrap text-xs text-neutral-400">
                  Término: <strong className="text-white ml-1">{endTime}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Slots de Horários Disponíveis */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sugestão de Horários no Dia</span>
              <span className="text-[11px] font-normal text-neutral-500">Clique para selecionar</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-32 overflow-y-auto p-1">
              {timeSlots.map(slot => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setStartTime(slot.time)}
                  title={slot.reason || 'Disponível'}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center",
                    startTime === slot.time
                      ? "bg-[#d4af37] text-black border-[#d4af37] shadow-md shadow-[#d4af37]/20"
                      : slot.isAvailable
                        ? "bg-white/5 border-white/10 text-neutral-300 hover:border-[#d4af37]/50 hover:text-white"
                        : "bg-black/40 border-neutral-800 text-neutral-600 line-through cursor-not-allowed"
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>

          {/* Alerta de Conflito em Tempo Real */}
          {conflictResult.hasConflict && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{conflictResult.reason}</span>
            </div>
          )}

          {/* 4. Status & Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Status do Agendamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              >
                <option value="aguardando">Aguardando Confirmação</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Observações
              </label>
              <input
                type="text"
                placeholder="Ex: Alergia a produto químico, prefere café..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              {existingAppointment ? 'Atualizar Agendamento' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
