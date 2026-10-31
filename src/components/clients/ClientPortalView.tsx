import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  Scissors, 
  Heart, 
  ShoppingBag, 
  ArrowLeft, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  DollarSign, 
  Sparkles,
  Plus,
  Headphones
} from 'lucide-react';
import { Client, Appointment, Service, Professional, ClientPurchase, ChatConversation } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { format } from 'date-fns';
import { PublicChat } from '@/src/components/chat/PublicChat';

interface ClientPortalViewProps {
  initialClient?: Client | null;
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  professionals: Professional[];
  purchases: ClientPurchase[];
  onBackToAdmin: () => void;
  onBookAppointment: (appointment: Appointment) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  initialClient,
  clients,
  appointments,
  services,
  professionals,
  purchases,
  onBackToAdmin,
  onBookAppointment,
}) => {
  // If no initialClient, show login screen
  const [loggedClient, setLoggedClient] = useState<Client | null>(initialClient || null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Portal navigation tabs
  const [activeTab, setActiveTab] = useState<'agendamentos' | 'novo_agendamento' | 'favoritos' | 'compras' | 'perfil' | 'chat'>('agendamentos');

  // Real-time chat sync for client
  const [conversations, setConversations] = useLocalStorage<ChatConversation[]>('chat_conversations', []);

  useEffect(() => {
    const handleChatSync = () => {
      try {
        const raw = localStorage.getItem('chat_conversations');
        if (raw) setConversations(JSON.parse(raw));
      } catch (e) {
        console.error('ClientPortal chat sync error:', e);
      }
    };
    window.addEventListener('salao-luxe-chat-sync', handleChatSync);
    window.addEventListener('storage', handleChatSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleChatSync);
      window.removeEventListener('storage', handleChatSync);
    };
  }, [setConversations]);

  const clientUnreadCount = useMemo(() => {
    if (!loggedClient) return 0;
    const conv = conversations.find(c => c.id === `conv-client-${loggedClient.id}`);
    return conv?.unreadCountParticipant || 0;
  }, [conversations, loggedClient]);

  // Booking state for online client booking
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(professionals[0]?.id || '');
  const [bookDate, setBookDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookTime, setBookTime] = useState('10:00');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Authenticate
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = clients.find(
      c => c.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (!found) {
      setLoginError('E-mail não cadastrado em nosso sistema.');
      return;
    }

    if (!found.hasPortalAccess) {
      setLoginError('O acesso ao portal ainda não foi liberado para este e-mail. Solicite liberação na recepção.');
      return;
    }

    if (found.password && found.password !== passwordInput) {
      setLoginError('Senha incorreta. Tente novamente ou peça redefinição na recepção.');
      return;
    }

    setLoggedClient(found);
  };

  const handleQuickLoginAs = (client: Client) => {
    setLoggedClient(client);
    setLoginError(null);
  };

  // Client's filtered data
  const clientAppointments = useMemo(() => {
    if (!loggedClient) return [];
    return appointments
      .filter(a => a.clientId === loggedClient.id)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      });
  }, [appointments, loggedClient]);

  const upcomingAppointments = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return clientAppointments.filter(a => a.date >= todayStr && a.status !== 'cancelado');
  }, [clientAppointments]);

  const pastAppointments = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return clientAppointments.filter(a => a.date < todayStr || a.status === 'concluido' || a.status === 'cancelado');
  }, [clientAppointments]);

  const clientPurchases = useMemo(() => {
    if (!loggedClient) return [];
    return purchases
      .filter(p => p.clientId === loggedClient.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, loggedClient]);

  const favoriteServices = useMemo(() => {
    if (!loggedClient) return [];
    const favIds = loggedClient.favoriteServiceIds || [];
    return services.filter(s => favIds.includes(s.id));
  }, [services, loggedClient]);

  // Online booking submit
  const handleClientBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedClient) return;

    if (loggedClient.status === 'bloqueado') {
      alert('Sua conta está suspensa no momento. Por favor, entre em contato com a gerência do salão.');
      return;
    }

    const service = services.find(s => s.id === selectedServiceId) || services[0];
    const professional = professionals.find(p => p.id === selectedProfessionalId) || professionals[0];

    // calculate end time
    const [h, m] = bookTime.split(':').map(Number);
    const endMinutes = h * 60 + m + (service?.duration || 30);
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newApp: Appointment = {
      id: 'apt-cli-' + Date.now(),
      clientId: loggedClient.id,
      clientName: loggedClient.name,
      clientPhone: loggedClient.phone,
      clientEmail: loggedClient.email,
      professionalId: professional.id,
      professionalName: professional.name,
      serviceIds: [service.id],
      serviceNames: [service.name],
      date: bookDate,
      startTime: bookTime,
      endTime: endTimeStr,
      totalDuration: service.duration,
      totalPrice: service.price,
      status: 'aguardando',
      notes: bookNotes.trim() ? `Solicitado pelo portal do cliente: ${bookNotes.trim()}` : 'Solicitado pelo portal do cliente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onBookAppointment(newApp);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveTab('agendamentos');
    }, 1500);
  };

  // LOGIN SCREEN
  if (!loggedClient) {
    return (
      <div className="min-h-[75vh] flex flex-col justify-center items-center p-4 animate-in fade-in duration-500">
        <div className="w-full max-w-md bg-[#101010] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto mb-2">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Área do Cliente</h2>
            <p className="text-neutral-400 text-xs">
              Acesse seus agendamentos, histórico de visitas e solicite novos horários.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Seu E-mail
              </label>
              <input 
                type="email"
                required
                placeholder="exemplo@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Sua Senha
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Informe sua senha"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl py-3 pl-3 pr-10 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
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
              className="w-full py-3 bg-[#d4af37] text-black font-bold text-xs rounded-xl hover:bg-[#b8860b] transition-all shadow-lg shadow-[#d4af37]/15 mt-2"
            >
              Acessar Minha Conta
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <span className="text-[10px] text-neutral-500 block text-center uppercase tracking-wider font-semibold">
              Clientes Cadastrados para Teste:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {clients.slice(0, 3).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleQuickLoginAs(c)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#d4af37]/20 border border-white/10 text-neutral-300 text-xs transition-colors"
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onBackToAdmin}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowLeft size={14} /> Voltar à Tela Inicial
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED CLIENT PORTAL
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header do Portal do Cliente */}
      <div className="bg-[#111111] border border-[#d4af37]/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-[#d4af37] overflow-hidden flex items-center justify-center text-base font-bold text-[#d4af37]">
            {loggedClient.photoUrl ? (
              <img src={loggedClient.photoUrl} alt={loggedClient.name} className="w-full h-full object-cover" />
            ) : (
              loggedClient.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Olá, {loggedClient.name}!</h1>
              {loggedClient.status === 'bloqueado' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase border border-rose-500/30">
                  Conta Suspensa
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-xs mt-0.5">
              Sua área exclusiva de agendamentos no Salão Luxe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('chat')}
            className="relative flex items-center gap-2 bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#d4af37]/30 transition-all"
          >
            <Headphones size={16} />
            <span>Chat Luxe</span>
            {clientUnreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                {clientUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('novo_agendamento')}
            className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#b8860b] transition-all shadow-md shadow-[#d4af37]/10"
          >
            <Plus size={16} />
            Agendar Horário
          </button>

          <button
            onClick={() => setLoggedClient(null)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            title="Sair da Conta do Cliente"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      {/* Account Blocked Alert */}
      {loggedClient.status === 'bloqueado' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>
            Seu cadastro está temporariamente bloqueado para novos agendamentos online. Por favor, entre em contato via WhatsApp com o salão.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-[#111111] border border-white/10 rounded-2xl p-1.5 overflow-x-auto gap-1">
        {[
          { id: 'agendamentos', label: `Meus Agendamentos (${upcomingAppointments.length})`, icon: Calendar },
          { id: 'novo_agendamento', label: 'Agendar Novo Atendimento', icon: Scissors },
          { id: 'favoritos', label: `Serviços Favoritos (${favoriteServices.length})`, icon: Heart },
          { id: 'compras', label: `Minhas Compras (${clientPurchases.length})`, icon: ShoppingBag },
          { id: 'chat', label: 'Atendimento Luxe', icon: Headphones },
          { id: 'perfil', label: 'Meus Dados Cadastrais', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MEUS AGENDAMENTOS */}
      {activeTab === 'agendamentos' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Próximos Atendimentos */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-[#d4af37]" />
              Próximos Agendamentos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map(app => {
                const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.confirmado;
                return (
                  <div key={app.id} className="p-5 rounded-2xl bg-[#111111] border border-[#d4af37]/25 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                        <Clock size={14} />
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
                      <h4 className="text-white font-bold text-sm">{app.serviceNames.join(' + ')}</h4>
                      <p className="text-neutral-400 text-xs mt-0.5">Profissional: {app.professionalName}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white font-bold text-xs">{formatCurrency(app.totalPrice)}</span>
                      <span className="text-neutral-500 text-[10px]">{app.totalDuration} min de atendimento</span>
                    </div>
                  </div>
                );
              })}

              {upcomingAppointments.length === 0 && (
                <div className="col-span-full py-12 text-center text-neutral-500 text-xs bg-[#111111] border border-white/5 rounded-2xl space-y-2">
                  <Calendar size={28} className="mx-auto opacity-30" />
                  <p>Você não tem nenhum atendimento agendado para os próximos dias.</p>
                  <button
                    onClick={() => setActiveTab('novo_agendamento')}
                    className="text-[#d4af37] font-bold text-xs hover:underline mt-2 inline-block"
                  >
                    + Clique aqui para agendar seu horário
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Histórico Anterior */}
          {pastAppointments.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-neutral-400" />
                Histórico de Atendimentos Anteriores
              </h3>
              <div className="space-y-2">
                {pastAppointments.map(app => (
                  <div key={app.id} className="p-4 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#d4af37] font-bold block">{app.date} às {app.startTime}</span>
                      <span className="text-white font-medium">{app.serviceNames.join(', ')}</span>
                      <span className="text-neutral-500 block text-[11px]">com {app.professionalName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold block">{formatCurrency(app.totalPrice)}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        app.status === 'concluido' ? "text-emerald-400" : "text-neutral-500"
                      )}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGENDAR NOVO ATENDIMENTO */}
      {activeTab === 'novo_agendamento' && (
        <div className="max-w-2xl mx-auto bg-[#111111] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Agendamento Online</h3>
            <p className="text-neutral-400 text-xs mt-1">
              Escolha seu serviço, o profissional da sua preferência e a data desejada.
            </p>
          </div>

          {bookingSuccess && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-in zoom-in">
              <CheckCircle2 size={18} />
              <span>Agendamento solicitado com sucesso! Você pode acompanhar o status na aba Meus Agendamentos.</span>
            </div>
          )}

          <form onSubmit={handleClientBooking} className="space-y-5">
            {/* Escolha do Serviço */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                1. Selecione o Serviço Desejado *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {services.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                      selectedServiceId === s.id
                        ? "bg-[#d4af37]/15 border-[#d4af37] text-white"
                        : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/20"
                    )}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{s.name}</p>
                      <p className="text-[10px] text-neutral-400">{s.duration} min • {formatCurrency(s.price)}</p>
                    </div>
                    {selectedServiceId === s.id && (
                      <CheckCircle2 size={16} className="text-[#d4af37]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Escolha do Profissional */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                2. Selecione o Profissional *
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              >
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.role}</option>
                ))}
              </select>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  3. Data Pretendida *
                </label>
                <input
                  type="date"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  4. Horário de Início *
                </label>
                <input
                  type="time"
                  required
                  step={1800}
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Observações ou Solicitações Especiais
              </label>
              <input
                type="text"
                placeholder="Ex: Gostaria de lavar o cabelo antes..."
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loggedClient.status === 'bloqueado'}
              className="w-full py-3 bg-[#d4af37] text-black font-bold text-xs rounded-xl hover:bg-[#b8860b] transition-all shadow-lg shadow-[#d4af37]/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Solicitação de Agendamento
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SERVIÇOS FAVORITOS */}
      {activeTab === 'favoritos' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Heart size={16} className="text-[#d4af37]" />
              Seus Serviços Preferidos
            </h3>
            <span className="text-xs text-neutral-400">Atalhos rápidos para agendar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favoriteServices.map(service => (
              <div 
                key={service.id}
                className="p-5 rounded-2xl bg-[#111111] border border-[#d4af37]/25 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-bold uppercase">
                      {service.category}
                    </span>
                    <Heart size={16} className="fill-[#d4af37] text-[#d4af37]" />
                  </div>
                  <h4 className="text-white font-bold text-sm mt-2">{service.name}</h4>
                  <p className="text-neutral-400 text-xs">{service.duration} minutos</p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-white font-bold text-xs">{formatCurrency(service.price)}</span>
                  <button
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setActiveTab('novo_agendamento');
                    }}
                    className="px-3 py-1.5 bg-[#d4af37] text-black rounded-lg text-xs font-bold hover:bg-[#b8860b] transition-all"
                  >
                    Agendar Este
                  </button>
                </div>
              </div>
            ))}

            {favoriteServices.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-500 text-xs bg-[#111111] border border-white/5 rounded-2xl">
                Nenhum serviço favoritado ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMPRAS & RECIBOS */}
      {activeTab === 'compras' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag size={16} className="text-[#d4af37]" />
            Suas Compras e Pagamentos Realizados
          </h3>

          <div className="space-y-3">
            {clientPurchases.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-bold block">{p.description}</span>
                  <span className="text-neutral-500 text-[11px]">{p.date} • {p.invoiceNumber || 'Recibo'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#d4af37] font-bold block">{formatCurrency(p.amount)}</span>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase">{p.status}</span>
                </div>
              </div>
            ))}

            {clientPurchases.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs bg-[#111111] border border-white/5 rounded-2xl">
                Nenhuma compra de produto ou pagamento avulso registrado em sua conta.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MEUS DADOS E PERFIL */}
      {activeTab === 'perfil' && (
        <div className="max-w-2xl mx-auto bg-[#111111] border border-[#d4af37]/20 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Header do Perfil */}
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold text-lg shadow-md shrink-0 overflow-hidden">
              {loggedClient.photoUrl ? (
                <img src={loggedClient.photoUrl} alt={loggedClient.name} className="w-full h-full object-cover" />
              ) : (
                loggedClient.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{loggedClient.name}</h3>
              <p className="text-neutral-400 text-xs truncate">{loggedClient.email} • {loggedClient.phone}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-[10px] font-bold uppercase border border-[#d4af37]/30">
                Cliente VIP Salão Luxe
              </span>
            </div>
          </div>

          {/* Atalhos Rápidos Compactos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => setActiveTab('novo_agendamento')}
              className="p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <Scissors size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Agendar</span>
            </button>
            <button
              onClick={() => setActiveTab('favoritos')}
              className="p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <Heart size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Favoritos</span>
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className="p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <ShoppingBag size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Compras</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="relative p-3 bg-white/5 hover:bg-[#d4af37]/15 border border-white/10 hover:border-[#d4af37]/40 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <Headphones size={18} className="text-[#d4af37]" />
              <span className="text-xs font-bold text-white group-hover:text-[#d4af37]">Chat Luxe</span>
              {clientUnreadCount > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                  {clientUnreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-4 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl space-y-1">
                <span className="text-neutral-500 block">E-mail Cadastrado</span>
                <span className="text-white font-semibold">{loggedClient.email}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-xl space-y-1">
                <span className="text-neutral-500 block">WhatsApp / Telefone</span>
                <span className="text-white font-semibold">{loggedClient.phone}</span>
              </div>
            </div>

            {loggedClient.preferences && (
              <div className="p-4 bg-white/5 rounded-xl space-y-1">
                <span className="text-neutral-500 block">Preferências Registradas</span>
                <span className="text-neutral-300 italic">"{loggedClient.preferences}"</span>
              </div>
            )}

            {/* Botão Sair da Conta do Cliente */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-neutral-400 text-xs">Encerrar sessão atual</span>
              <button
                onClick={() => setLoggedClient(null)}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Sair da conta e retornar ao início"
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ATENDIMENTO LUXE (CHAT) */}
      {activeTab === 'chat' && (
        <div className="animate-in fade-in">
          <PublicChat currentClient={loggedClient} />
        </div>
      )}
    </div>
  );
};
