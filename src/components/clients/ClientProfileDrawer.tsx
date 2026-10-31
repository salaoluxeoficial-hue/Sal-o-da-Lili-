import React, { useState, useMemo } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Heart, 
  Lock, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  MessageCircle, 
  Edit3, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Ban, 
  ExternalLink,
  Tag
} from 'lucide-react';
import { Client, Appointment, ClientPurchase, Service, Professional } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { STATUS_LABELS } from '@/src/services/agendaStorage';
import { PAYMENT_METHOD_LABELS } from '@/src/services/clientStorage';
import { AddPurchaseModal } from '@/src/components/clients/AddPurchaseModal';

interface ClientProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEditClient: (client: Client) => void;
  onToggleClientStatus: (clientId: string) => void;
  onScheduleForClient: (client: Client) => void;
  onOpenClientPortal: (client: Client) => void;
  appointments: Appointment[];
  purchases: ClientPurchase[];
  onAddPurchase: (purchase: ClientPurchase) => void;
  services: Service[];
  professionals: Professional[];
}

export const ClientProfileDrawer: React.FC<ClientProfileDrawerProps> = ({
  isOpen,
  onClose,
  client,
  onEditClient,
  onToggleClientStatus,
  onScheduleForClient,
  onOpenClientPortal,
  appointments,
  purchases,
  onAddPurchase,
  services,
  professionals,
}) => {
  if (!isOpen || !client) return null;

  const [activeTab, setActiveTab] = useState<'geral' | 'agendamentos' | 'compras' | 'favoritos' | 'preferencias'>('geral');
  const [showPassword, setShowPassword] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);

  // Client's appointments
  const clientAppointments = useMemo(() => {
    return appointments
      .filter(a => a.clientId === client.id)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      });
  }, [appointments, client.id]);

  // Client's purchases
  const clientPurchases = useMemo(() => {
    return purchases
      .filter(p => p.clientId === client.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, client.id]);

  // Client's favorite services objects
  const favoriteServices = useMemo(() => {
    const favIds = client.favoriteServiceIds || [];
    return services.filter(s => favIds.includes(s.id));
  }, [services, client.favoriteServiceIds]);

  // Total spent calculation
  const totalCalculatedSpent = useMemo(() => {
    const fromCompletedApps = clientAppointments
      .filter(a => a.status === 'concluido')
      .reduce((acc, a) => acc + a.totalPrice, 0);

    const fromPurchases = clientPurchases
      .filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + p.amount, 0);

    return Math.max(client.totalSpent, fromCompletedApps + fromPurchases);
  }, [clientAppointments, clientPurchases, client.totalSpent]);

  // Format whatsapp URL clean numbers
  const whatsappDigits = (client.whatsapp || client.phone).replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappDigits}`;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-200">
      <div className="bg-[#0d0d0d] border-l border-[#d4af37]/25 w-full max-w-3xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header Card */}
        <div className="p-6 border-b border-[#d4af37]/15 bg-gradient-to-r from-[#141414] to-[#0d0d0d] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-[#d4af37]/40 overflow-hidden flex items-center justify-center font-bold text-lg text-[#d4af37]">
                {client.photoUrl ? (
                  <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  client.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black",
                client.status === 'ativo' ? "bg-emerald-500" : client.status === 'bloqueado' ? "bg-rose-500" : "bg-neutral-500"
              )} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{client.name}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  client.status === 'ativo' 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : client.status === 'bloqueado'
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                )}>
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-3">
                <span>{client.phone}</span>
                <span>•</span>
                <span>{client.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClient(client)}
              className="p-2 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-xl transition-colors"
              title="Editar Perfil"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-[#111111] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* WhatsApp Direct Link */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black text-xs font-bold transition-all"
            >
              <MessageCircle size={14} />
              Conversar no WhatsApp
            </a>

            {/* Toggle Status (Bloquear / Ativar) */}
            <button
              onClick={() => onToggleClientStatus(client.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                client.status === 'ativo'
                  ? "bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white"
                  : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black"
              )}
            >
              {client.status === 'ativo' ? (
                <>
                  <Ban size={14} />
                  Bloquear Cadastro
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Desbloquear e Ativar
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Client Portal view */}
            <button
              onClick={() => onOpenClientPortal(client)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] text-xs font-bold transition-all border border-white/10"
              title="Acessar Área do Cliente"
            >
              <ExternalLink size={13} />
              Área do Cliente
            </button>

            {/* Schedule direct button */}
            <button
              onClick={() => onScheduleForClient(client)}
              className="flex items-center gap-1.5 bg-[#d4af37] text-black px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              <Plus size={14} />
              Agendar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-[#141414] px-6 gap-2 overflow-x-auto">
          {[
            { id: 'geral', label: 'Visão Geral' },
            { id: 'agendamentos', label: `Agendamentos (${clientAppointments.length})` },
            { id: 'compras', label: `Compras & Pagamentos (${clientPurchases.length})` },
            { id: 'favoritos', label: `Favoritos (${favoriteServices.length})` },
            { id: 'preferencias', label: 'Preferências & Notas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "border-[#d4af37] text-[#d4af37]"
                  : "border-transparent text-neutral-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Total Gasto</span>
                  <p className="text-xl font-bold text-[#d4af37] mt-1">{formatCurrency(totalCalculatedSpent)}</p>
                </div>
                <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Atendimentos</span>
                  <p className="text-xl font-bold text-white mt-1">{clientAppointments.length}</p>
                </div>
                <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Compras Extras</span>
                  <p className="text-xl font-bold text-white mt-1">{clientPurchases.length}</p>
                </div>
                <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Última Visita</span>
                  <p className="text-sm font-bold text-neutral-300 mt-2">{client.lastVisit || 'Sem visitas'}</p>
                </div>
              </div>

              {/* Portal Access Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#141414] to-[#101010] border border-[#d4af37]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-[#d4af37]" />
                    <h4 className="text-sm font-bold text-white">Credenciais da Área do Cliente</h4>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    client.hasPortalAccess 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                  )}>
                    {client.hasPortalAccess ? 'Acesso Ativo' : 'Acesso Desativado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-neutral-500 block font-medium">Login (E-mail):</span>
                    <span className="text-white font-mono font-semibold">{client.email}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block font-medium">Senha Cadastrada:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white font-mono font-semibold">
                        {showPassword ? (client.password || 'senha123') : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-neutral-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-neutral-500 border-t border-white/5">
                  <span>Último acesso ao portal: {client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleDateString('pt-BR') : 'Ainda não acessou'}</span>
                  <button
                    onClick={() => onOpenClientPortal(client)}
                    className="text-[#d4af37] font-bold hover:underline flex items-center gap-1"
                  >
                    Entrar na Área do Cliente <ExternalLink size={11} />
                  </button>
                </div>
              </div>

              {/* Personal Info Details Card */}
              <div className="bg-[#141414] border border-white/5 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Dados de Contato & Nascimento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Telefone Principal</span>
                    <span className="text-white font-semibold">{client.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">WhatsApp</span>
                    <span className="text-white font-semibold">{client.whatsapp || client.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Data de Nascimento</span>
                    <span className="text-white font-semibold">{client.birthDate || 'Não informada'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Cadastrado em</span>
                    <span className="text-white font-semibold">
                      {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              {client.preferences && (
                <div className="bg-[#141414] border border-white/5 p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Preferências de Atendimento
                  </h4>
                  <p className="text-xs text-neutral-300 italic bg-black/30 p-3 rounded-xl border border-white/5">
                    "{client.preferences}"
                  </p>
                </div>
              )}

              {client.allergies && (
                <div className="bg-rose-500/10 border border-rose-500/25 p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Restrições e Alergias Registradas
                  </h4>
                  <p className="text-xs text-rose-200">
                    {client.allergies}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE AGENDAMENTOS */}
          {activeTab === 'agendamentos' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Histórico Completo de Visitas & Agendamentos
                </h4>
                <button
                  onClick={() => onScheduleForClient(client)}
                  className="flex items-center gap-1 text-xs text-[#d4af37] font-bold hover:underline"
                >
                  <Plus size={14} />
                  Novo Agendamento
                </button>
              </div>

              <div className="space-y-3">
                {clientAppointments.map(app => {
                  const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.confirmado;
                  return (
                    <div 
                      key={app.id} 
                      className="p-4 rounded-xl bg-[#141414] border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-[#d4af37] font-bold text-xs flex items-center gap-1">
                            <Calendar size={13} />
                            {app.date}
                          </span>
                          <span className="text-neutral-400 text-xs flex items-center gap-1">
                            <Clock size={12} />
                            {app.startTime} - {app.endTime}
                          </span>
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

                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="text-white font-semibold">{app.serviceNames.join(' + ')}</p>
                          <p className="text-neutral-400 text-[11px]">Profissional: {app.professionalName}</p>
                        </div>
                        <span className="text-white font-bold text-sm">
                          {formatCurrency(app.totalPrice)}
                        </span>
                      </div>

                      {app.notes && (
                        <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-white/5">
                          "{app.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}

                {clientAppointments.length === 0 && (
                  <div className="py-16 text-center text-neutral-500 text-xs space-y-2">
                    <Calendar size={32} className="mx-auto opacity-30" />
                    <p>Nenhum agendamento registrado para este cliente.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPRAS E PAGAMENTOS */}
          {activeTab === 'compras' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Produtos, Serviços e Recibos
                </h4>
                <button
                  onClick={() => setIsAddPurchaseOpen(true)}
                  className="flex items-center gap-1 text-xs text-[#d4af37] font-bold hover:underline"
                >
                  <Plus size={14} />
                  Adicionar Compra / Pagamento
                </button>
              </div>

              <div className="space-y-3">
                {clientPurchases.map(purchase => (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-xl bg-[#141414] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          purchase.category === 'produto' ? "bg-blue-500/10 text-blue-400" : "bg-[#d4af37]/10 text-[#d4af37]"
                        )}>
                          {purchase.category}
                        </span>
                        <h5 className="text-white font-bold text-xs">{purchase.description}</h5>
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-3">
                        <span>{purchase.date}</span>
                        <span>•</span>
                        <span>{PAYMENT_METHOD_LABELS[purchase.paymentMethod]}</span>
                        {purchase.invoiceNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-neutral-500">{purchase.invoiceNumber}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-bold text-sm block">
                        {formatCurrency(purchase.amount)}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold uppercase">
                        {purchase.status}
                      </span>
                    </div>
                  </div>
                ))}

                {clientPurchases.length === 0 && (
                  <div className="py-16 text-center text-neutral-500 text-xs space-y-2">
                    <ShoppingBag size={32} className="mx-auto opacity-30" />
                    <p>Nenhuma compra de produto ou pagamento avulso registrado.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SERVIÇOS FAVORITOS */}
          {activeTab === 'favoritos' && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Serviços Marcados como Favoritos
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteServices.map(service => (
                  <div
                    key={service.id}
                    className="p-4 rounded-xl bg-[#141414] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-bold uppercase">
                          {service.category}
                        </span>
                        <Heart size={16} className="fill-[#d4af37] text-[#d4af37]" />
                      </div>
                      <h5 className="text-white font-bold text-sm mt-2">{service.name}</h5>
                      <p className="text-neutral-400 text-xs">{service.duration} minutos</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-white font-bold">{formatCurrency(service.price)}</span>
                      <button
                        onClick={() => onScheduleForClient(client)}
                        className="px-3 py-1 bg-[#d4af37] text-black rounded-lg text-xs font-bold hover:bg-[#d4af37]/90 transition-all"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                ))}

                {favoriteServices.length === 0 && (
                  <div className="col-span-full py-16 text-center text-neutral-500 text-xs">
                    Nenhum serviço favorito adicionado ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PREFERÊNCIAS & NOTAS */}
          {activeTab === 'preferencias' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                  Preferências de Estilo & Atendimento
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {client.preferences || 'Nenhuma preferência cadastrada.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Restrições Químicas & Alergias
                </h4>
                <p className="text-xs text-rose-200 leading-relaxed">
                  {client.allergies || 'Nenhuma alergia ou restrição química informada.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Observações Internas da Equipe
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {client.notes || 'Nenhuma observação interna cadastrada.'}
                </p>
              </div>

              <button
                onClick={() => onEditClient(client)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
              >
                Editar Preferências e Notas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={isAddPurchaseOpen}
        onClose={() => setIsAddPurchaseOpen(false)}
        client={client}
        onAddPurchase={onAddPurchase}
        services={services}
      />
    </div>
  );
};
