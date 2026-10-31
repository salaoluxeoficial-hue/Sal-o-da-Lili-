import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Coffee, ShieldAlert, Award } from 'lucide-react';
import { Professional, ProfessionalAbsence, AbsenceType } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

interface AbsencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  absences: ProfessionalAbsence[];
  onAddAbsence: (absence: ProfessionalAbsence) => void;
  onDeleteAbsence: (id: string) => void;
  professionals: Professional[];
}

const TYPE_CONFIG: Record<AbsenceType, { label: string; bg: string; text: string }> = {
  folga: { label: 'Folga', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  intervalo: { label: 'Intervalo', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  almoco: { label: 'Almoço', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  ferias: { label: 'Férias', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  curso: { label: 'Curso / Treinamento', bg: 'bg-[#d4af37]/10', text: 'text-[#d4af37]' },
  outro: { label: 'Outro Bloqueio', bg: 'bg-neutral-500/10', text: 'text-neutral-400' },
};

export const AbsencesModal: React.FC<AbsencesModalProps> = ({
  isOpen,
  onClose,
  absences,
  onAddAbsence,
  onDeleteAbsence,
  professionals,
}) => {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [selectedProfFilter, setSelectedProfFilter] = useState('all');

  // Form states
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [type, setType] = useState<AbsenceType>('almoco');
  const [title, setTitle] = useState('Intervalo de Almoço');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [notes, setNotes] = useState('');

  const handleTypeChange = (newType: AbsenceType) => {
    setType(newType);
    if (newType === 'almoco') {
      setTitle('Intervalo de Almoço');
      setAllDay(false);
      setStartTime('12:00');
      setEndTime('13:00');
    } else if (newType === 'folga') {
      setTitle('Folga Semanal');
      setAllDay(true);
    } else if (newType === 'ferias') {
      setTitle('Período de Férias');
      setAllDay(true);
    } else if (newType === 'curso') {
      setTitle('Workshop / Aperfeiçoamento');
      setAllDay(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) return;

    const professional = professionals.find(p => p.id === professionalId);

    const newAbsence: ProfessionalAbsence = {
      id: 'abs-' + Date.now(),
      professionalId,
      professionalName: professional?.name || 'Profissional',
      type,
      title: title.trim() || TYPE_CONFIG[type].label,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      notes: notes.trim() || undefined,
    };

    onAddAbsence(newAbsence);
    setIsAdding(false);
  };

  const filteredAbsences = absences.filter(a => 
    selectedProfFilter === 'all' || a.professionalId === selectedProfFilter
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Coffee size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Folgas, Intervalos & Férias
              </h3>
              <p className="text-neutral-400 text-xs">
                Bloqueie horários de ausência dos profissionais para evitar conflitos na agenda.
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Filtrar por:</span>
              <select
                value={selectedProfFilter}
                onChange={(e) => setSelectedProfFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
              >
                <option value="all">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              <Plus size={16} />
              {isAdding ? 'Ver Lista' : 'Adicionar Bloqueio / Folga'}
            </button>
          </div>

          {/* Form to Add */}
          {isAdding ? (
            <form onSubmit={handleSave} className="bg-white/5 border border-[#d4af37]/30 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#d4af37]" />
                Novo Bloqueio de Horário
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Profissional *</label>
                  <select
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    required
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                  >
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.role}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Tipo de Ausência *</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as AbsenceType)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                  >
                    <option value="almoco">Almoço</option>
                    <option value="intervalo">Intervalo</option>
                    <option value="folga">Folga Semanal</option>
                    <option value="ferias">Férias</option>
                    <option value="curso">Curso / Capacitação</option>
                    <option value="outro">Outro Motivo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Título / Descrição *</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Almoço diário, Férias de Julho"
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Data Início *</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Data Término *</label>
                  <input 
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allDayCheckbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d4af37] bg-black border-white/20 focus:ring-0"
                />
                <label htmlFor="allDayCheckbox" className="text-xs font-medium text-neutral-300 cursor-pointer">
                  Ausência o dia todo (bloqueia qualquer agendamento na data)
                </label>
              </div>

              {!allDay && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Horário Início *</label>
                    <input 
                      type="time"
                      required={!allDay}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Horário Término *</label>
                    <input 
                      type="time"
                      required={!allDay}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d4af37] text-black text-xs font-bold py-2.5 rounded-xl hover:bg-[#d4af37]/90 transition-all shadow-md"
                >
                  Salvar Bloqueio
                </button>
              </div>
            </form>
          ) : null}

          {/* List of absences */}
          <div className="space-y-3">
            {filteredAbsences.map(abs => {
              const cfg = TYPE_CONFIG[abs.type] || TYPE_CONFIG.outro;
              return (
                <div 
                  key={abs.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#d4af37]/20 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>
                        {cfg.label}
                      </span>
                      <h4 className="text-white text-sm font-bold">{abs.title}</h4>
                    </div>
                    <p className="text-xs text-[#d4af37] font-medium">{abs.professionalName}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {abs.startDate === abs.endDate ? abs.startDate : `${abs.startDate} até ${abs.endDate}`}
                      </span>
                      {!abs.allDay && abs.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {abs.startTime} - {abs.endTime}
                        </span>
                      )}
                      {abs.allDay && <span className="text-neutral-500 font-semibold">• Dia inteiro</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteAbsence(abs.id)}
                    className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remover Bloqueio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            {filteredAbsences.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Nenhum bloqueio de horário registrado para este filtro.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0a0a0a] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/15 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
