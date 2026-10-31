import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Scissors, 
  LogOut, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  UserCheck,
  MessageSquare,
  Send,
  CheckCheck
} from 'lucide-react';
import { Professional, Appointment, ProfessionalCommission, ProfessionalAbsence, ChatMessage, ChatConversation } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { sendMessageDirectly, markConversationAsReadDirectly, ADMIN_PARTICIPANT_ID, getStoredMessages } from '@/src/services/chatStorage';
import { getInitialChatBranding, ChatBrandingSettings } from '@/src/services/chatBrandingStorage';
import { ChatAvatar } from '@/src/components/chat/ChatAvatar';

interface ProfessionalPortalViewProps {
  professionals: Professional[];
  appointments: Appointment[];
  commissions: ProfessionalCommission[];
  absences: ProfessionalAbsence[];
  onUpdateAppointmentStatus: (appId: string, newStatus: Appointment['status']) => void;
  onBackToPublic: () => void;
}

export const ProfessionalPortalView: React.FC<ProfessionalPortalViewProps> = ({
  professionals,
  appointments,
  commissions,
  absences,
  onUpdateAppointmentStatus,
  onBackToPublic
}) => {
  const [loggedProfessional, setLoggedProfessional] = useState<Professional | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'agenda' | 'comissoes' | 'perfil' | 'chat'>('agenda');

  // Real-time chat sync for logged professional
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chat_messages', getStoredMessages());
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [branding, setBranding] = useState<ChatBrandingSettings>(() => getInitialChatBranding());

  useEffect(() => {
    const handleBrandingSync = () => {
      setBranding(getInitialChatBranding());
    };
    window.addEventListener('salao-luxe-branding-sync', handleBrandingSync);
    window.addEventListener('storage', handleBrandingSync);
    return () => {
      window.removeEventListener('salao-luxe-branding-sync', handleBrandingSync);
      window.removeEventListener('storage', handleBrandingSync);
    };
  }, []);

  const defaultProConvId = loggedProfessional ? `conv-prof-${loggedProfessional.id}` : null;
  const [selectedProConvId, setSelectedProConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useLocalStorage<ChatConversation[]>('chat_conversations', []);

  useEffect(() => {
    if (defaultProConvId && !selectedProConvId) {
      setSelectedProConvId(defaultProConvId);
    }
  }, [defaultProConvId, selectedProConvId]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const rawMsgs = localStorage.getItem('chat_messages');
        if (rawMsgs) setMessages(JSON.parse(rawMsgs));
        const rawConvs = localStorage.getItem('chat_conversations');
        if (rawConvs) setConversations(JSON.parse(rawConvs));
      } catch (err) {
        console.error('Pro chat sync error:', err);
      }
    };

    window.addEventListener('salao-luxe-chat-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [setMessages, setConversations]);

  // Direct client conversations assigned to this professional
  const assignedClientConvs = useMemo(() => {
    if (!loggedProfessional) return [];
    return conversations.filter(c => c.assignedProfessionalId === loggedProfessional.id);
  }, [conversations, loggedProfessional]);

  const activeProConv = useMemo(() => {
    const targetId = selectedProConvId || defaultProConvId;
    if (!targetId) return null;
    return conversations.find(c => c.id === targetId) || null;
  }, [selectedProConvId, defaultProConvId, conversations]);

  const proUnreadCount = useMemo(() => {
    if (!loggedProfessional) return 0;
    const receptionConv = conversations.find(c => c.id === `conv-prof-${loggedProfessional.id}`);
    const receptionUnread = receptionConv?.unreadCountParticipant || 0;
    const clientUnreadSum = assignedClientConvs.reduce((acc, curr) => acc + (curr.unreadCountParticipant || 0), 0);
    return receptionUnread + clientUnreadSum;
  }, [conversations, loggedProfessional, assignedClientConvs]);

  const activeConvId = selectedProConvId || defaultProConvId;

  useEffect(() => {
    if (activeTab === 'chat' && activeConvId) {
      markConversationAsReadDirectly(activeConvId, 'participant');
    }
  }, [activeTab, activeConvId, messages.length]);

  const proMessages = useMemo(() => {
    if (!activeConvId) return [];
    return messages
      .filter(m => m.conversationId === activeConvId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeConvId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [proMessages, activeTab]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = professionals.find(
      p => p.name.toLowerCase().replace(/\s+/g, '') === emailInput.trim().toLowerCase().replace(/\s+/g, '') ||
           p.name.toLowerCase().includes(emailInput.trim().toLowerCase())
    );

    if (!found) {
      setLoginError('Profissional não encontrado no cadastro do Salão Luxe.');
      return;
    }

    if (passwordInput && passwordInput !== 'pro123' && passwordInput !== 'admin') {
      setLoginError('Senha incorreta. A senha padrão para profissionais é pro123.');
      return;
    }

    setLoggedProfessional(found);
  };

  const handleQuickLoginAs = (pro: Professional) => {
    setLoggedProfessional(pro);
    setLoginError(null);
  };

  // Filtered Appointments for logged professional only
  const proAppointments = useMemo(() => {
    if (!loggedProfessional) return [];
    return appointments
      .filter(a => a.professionalId === loggedProfessional.id)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [appointments, loggedProfessional]);

  // Filtered Commissions
  const proCommissions = useMemo(() => {
    if (!loggedProfessional) return [];
    return commissions.filter(c => c.professionalId === loggedProfessional.id);
  }, [commissions, loggedProfessional]);

  const totalCommissionsEarned = proCommissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);

  // Filtered Absences
  const proAbsences = useMemo(() => {
    if (!loggedProfessional) return [];
    return absences.filter(a => a.professionalId === loggedProfessional.id);
  }, [absences, loggedProfessional]);

  // LOGIN SCREEN FOR PROFESSIONALS
  if (!loggedProfessional) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center p-4 animate-in fade-in duration-500">
        <div className="w-full max-w-md bg-[#101010] border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto mb-3">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Espaço do Profissional</h2>
            <p className="text-neutral-400 text-xs">
              Acesso restrito para a equipe de especialistas do Salão Luxe.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Nome do Profissional ou E-mail
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Oliveira"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="pro123"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl py-3 pl-3 pr-10 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#d4af37] text-black font-bold text-sm rounded-xl hover:bg-[#b8860b] transition-all shadow-lg shadow-[#d4af37]/20 mt-2"
            >
              Acessar Meu Espaço
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-white/10 space-y-2 text-center">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
              Entrar como Profissional Cadastrado:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {professionals.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleQuickLoginAs(p)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#d4af37]/20 border border-white/10 text-neutral-300 text-xs transition-colors"
                >
                  {p.name.split(' ')[0]} ({p.role.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onBackToPublic}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowLeft size={14} /> Voltar à Área Pública
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED PROFESSIONAL DASHBOARD
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-[#111111] border border-[#d4af37]/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-[#d4af37] overflow-hidden flex items-center justify-center text-lg font-bold text-[#d4af37] shrink-0">
            {loggedProfessional.photoUrl ? (
              <img src={loggedProfessional.photoUrl} alt={loggedProfessional.name} className="w-full h-full object-cover" />
            ) : (
              loggedProfessional.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{loggedProfessional.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-[10px] font-bold uppercase border border-[#d4af37]/30">
                {loggedProfessional.role}
              </span>
            </div>
            <p className="text-neutral-400 text-xs mt-0.5">
              Comissão configurada: <span className="text-[#d4af37] font-bold">{loggedProfessional.commission}%</span> por serviço realizado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('chat')}
            className="relative flex items-center gap-2 bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#d4af37]/30 transition-all"
          >
            <MessageSquare size={16} />
            <span>Chat Recepção</span>
            {proUnreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                {proUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setLoggedProfessional(null)}
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-[#111111] border border-white/10 rounded-2xl p-1.5 overflow-x-auto gap-1">
        {[
          { id: 'agenda', label: `Minha Agenda (${proAppointments.length})`, icon: Calendar },
          { id: 'comissoes', label: `Minhas Comissões (${formatCurrency(totalCommissionsEarned)})`, icon: DollarSign },
          { id: 'chat', label: 'Chat Recepção', icon: MessageSquare, badge: proUnreadCount },
          { id: 'perfil', label: 'Meu Perfil & Horários', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
            {Boolean(tab.badge && tab.badge > 0) && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                activeTab === tab.id ? "bg-black text-white" : "bg-rose-500 text-white animate-pulse"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: MINHA AGENDA */}
      {activeTab === 'agenda' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-[#d4af37]" />
            Seus Atendimentos Agendados
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proAppointments.map(app => {
              const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.confirmado;

              return (
                <div key={app.id} className="p-5 rounded-2xl bg-[#111111] border border-[#d4af37]/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-[#d4af37] flex items-center gap-1.5">
                      <Clock size={15} />
                      {app.startTime} - {app.endTime} ({app.date})
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      statusInfo.bg,
                      statusInfo.text,
                      statusInfo.border
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-base">{app.serviceNames.join(' + ')}</h4>
                    <p className="text-neutral-300 text-xs mt-0.5">Cliente: <span className="text-white font-semibold">{app.clientName}</span> ({app.clientPhone})</p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-white font-bold text-xs">
                      Valor Total: {formatCurrency(app.totalPrice)}
                    </span>

                    {/* Quick status actions */}
                    <div className="flex gap-2">
                      {app.status !== 'em_atendimento' && app.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(app.id, 'em_atendimento')}
                          className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold hover:bg-amber-500/30"
                        >
                          Iniciar
                        </button>
                      )}
                      {app.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(app.id, 'concluido')}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold hover:bg-emerald-500/30"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {proAppointments.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-500 text-xs bg-[#111111] border border-white/5 rounded-2xl">
                Nenhum agendamento atribuído à sua agenda no momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MINHAS COMISSÕES */}
      {activeTab === 'comissoes' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign size={18} className="text-[#d4af37]" />
            Histórico de Comissões e Repasses
          </h3>

          <div className="space-y-2">
            {proCommissions.map(c => (
              <div key={c.id} className="p-4 bg-[#111111] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-bold block">{c.serviceNames.join(', ')}</span>
                  <span className="text-neutral-500 text-[11px]">Cliente: {c.clientName} • Data: {c.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#d4af37] font-bold block">{formatCurrency(c.commissionAmount)}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    c.status === 'pago' ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}

            {proCommissions.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs bg-[#111111] border border-white/5 rounded-2xl">
                Nenhuma comissão registrada até o momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MEU PERFIL PROFISSIONAL */}
      {activeTab === 'perfil' && (
        <div className="max-w-2xl mx-auto bg-[#111111] border border-[#d4af37]/20 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Header do Perfil Profissional */}
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold text-lg shadow-md shrink-0 overflow-hidden">
              {loggedProfessional.photoUrl ? (
                <img src={loggedProfessional.photoUrl} alt={loggedProfessional.name} className="w-full h-full object-cover" />
              ) : (
                loggedProfessional.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{loggedProfessional.name}</h3>
              <p className="text-neutral-400 text-xs truncate">{loggedProfessional.role} • Salão Luxe</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-[10px] font-bold uppercase border border-[#d4af37]/30">
                Especialista Credenciado
              </span>
            </div>
          </div>

          {/* Atalhos e Acesso ao Chat */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('chat')}
              className="p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <MessageSquare size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Abrir Chat Recepção</span>
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className="p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <Calendar size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Minha Agenda</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white/5 rounded-xl space-y-1">
              <span className="text-neutral-500 block">Especialidades</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {loggedProfessional.specialties.map(spec => (
                  <span key={spec} className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] font-bold text-[11px]">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl space-y-1">
              <span className="text-neutral-500 block">Percentual de Comissão</span>
              <span className="text-white font-extrabold text-sm">{loggedProfessional.commission}% por atendimento</span>
            </div>

            {proAbsences.length > 0 && (
              <div className="p-4 bg-white/5 rounded-xl space-y-2">
                <span className="text-neutral-500 block">Folgas e Pausas Registradas</span>
                {proAbsences.map(abs => (
                  <div key={abs.id} className="text-neutral-300">
                    • {abs.title} ({abs.startDate} até {abs.endDate})
                  </div>
                ))}
              </div>
            )}

            {/* Botão Sair da Conta do Profissional */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-neutral-400 text-xs">Encerrar sessão de profissional</span>
              <button
                onClick={() => setLoggedProfessional(null)}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Sair do perfil profissional"
              >
                <LogOut size={16} />
                <span>Sair do Perfil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHAT COM A RECEPÇÃO / ADM E CLIENTES DIRETO */}
      {activeTab === 'chat' && loggedProfessional && (
        <div className="bg-[#0a0a0a] border border-[#d4af37]/25 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[450px] max-h-[75vh] animate-in fade-in">
          {/* Sub-Header & Selector */}
          <div className="px-4 py-3 bg-[#121212] border-b border-[#d4af37]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <ChatAvatar config={branding.receptionChat} type="reception" size="md" showStatusDot={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {activeProConv?.participantName || branding.receptionChat.name}
                  </h3>
                  <span className="flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate mt-0.5">
                  {activeProConv?.assignedType === 'profissional_direto'
                    ? `Atendimento Direto com Cliente`
                    : 'Canal direto com Recepção & Gerência'}
                </p>
              </div>
            </div>

            {/* Conversation Switcher for Professional */}
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase hidden md:inline">Conversa:</span>
              <select
                value={activeConvId || ''}
                onChange={(e) => setSelectedProConvId(e.target.value)}
                className="bg-[#1a1a1a] border border-[#d4af37]/40 text-[#d4af37] font-semibold rounded-lg px-2.5 py-1 text-[11px] outline-none focus:border-[#d4af37] max-w-[200px] truncate"
              >
                <option value={`conv-prof-${loggedProfessional.id}`}>📢 Recepção (ADM / Gerência)</option>
                {assignedClientConvs.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.participantName} (Cliente Direto)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notice if taken over by ADM/Dono */}
          {activeProConv?.takenOverByAdmin && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-amber-300 text-[11px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>
                ⚡ Atendimento sob gestão da Gerência ({activeProConv.takenOverByRole === 'dono' ? 'Dono do Salão' : 'ADM Recepção'}). Histórico atualizado em tempo real.
              </span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {proMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <MessageSquare size={32} className="text-[#d4af37]" />
                <h4 className="text-white font-bold text-sm">Comunicação Inteligente Salão Luxe</h4>
                <p className="text-neutral-400 text-xs max-w-xs">
                  Envie mensagens, solicite orientações ou atenda clientes diretamente pelo seu painel profissional.
                </p>
              </div>
            ) : (
              proMessages.map(msg => {
                const isFromPro = msg.senderRole === 'profissional' && msg.senderId === loggedProfessional.id;
                const isFromDono = msg.senderRole === 'dono';
                const isFromAdmin = msg.senderRole === 'admin';

                return (
                  <div key={msg.id} className={cn("flex flex-col", isFromPro ? "items-end" : "items-start")}>
                    <div className="max-w-[80%] space-y-1">
                      <span className="text-[10px] text-neutral-400 font-semibold px-1 block">
                        {isFromPro ? 'Você (Equipe)' : (isFromDono ? '👑 Dono do Salão' : isFromAdmin ? '🏛️ ADM Recepção' : `👤 ${msg.senderName}`)}
                      </span>
                      <div className={cn(
                        "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                        isFromPro 
                          ? "bg-[#d4af37] text-black font-medium rounded-br-none" 
                          : "bg-[#1d1d1d] border border-white/10 text-white rounded-bl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-neutral-500 block text-right px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatInput.trim() || !activeConvId) return;

              const recipientId = activeProConv?.participantId || ADMIN_PARTICIPANT_ID;

              sendMessageDirectly({
                conversationId: activeConvId,
                senderId: loggedProfessional.id,
                senderName: loggedProfessional.name,
                senderRole: 'profissional',
                recipientId: recipientId,
                content: chatInput.trim(),
                participantDetails: {
                  type: 'profissional',
                  participantId: loggedProfessional.id,
                  participantName: loggedProfessional.name,
                  participantRoleDescription: loggedProfessional.role
                }
              });
              setChatInput('');
            }}
            className="p-3 bg-[#161616] border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Responder como ${loggedProfessional.name}...`}
              className="flex-1 bg-black/40 border border-white/10 focus:border-[#d4af37]/60 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 bg-[#d4af37] disabled:opacity-40 text-black font-extrabold rounded-xl hover:bg-[#b8860b] transition-all shadow-md shadow-[#d4af37]/20"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
