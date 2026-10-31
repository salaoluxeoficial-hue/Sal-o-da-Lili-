import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Heart, 
  CreditCard, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Ban, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Filter,
  Sparkles
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Client, Appointment, ClientPurchase, Service, Professional } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { getInitialClients, getInitialPurchases } from '@/src/services/clientStorage';
import { getInitialAppointments } from '@/src/services/agendaStorage';
import { initialServicesList } from '@/src/components/Services';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { ClientModal } from '@/src/components/clients/ClientModal';
import { ClientProfileDrawer } from '@/src/components/clients/ClientProfileDrawer';
import { AppointmentModal } from '@/src/components/agenda/AppointmentModal';
import { getInitialAbsences } from '@/src/services/agendaStorage';

export const initialClientsList = getInitialClients();

interface ClientsProps {
  onOpenClientPortal?: (client: Client) => void;
}

export const Clients: React.FC<ClientsProps> = ({ onOpenClientPortal }) => {
  // Shared persistent storages
  const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', getInitialAppointments());
  const [purchases, setPurchases] = useLocalStorage<ClientPurchase[]>('client_purchases', getInitialPurchases());
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [absences] = useLocalStorage('absences', getInitialAbsences());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'bloqueado'>('all');

  // Modals & Drawer states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [selectedProfileClient, setSelectedProfileClient] = useState<Client | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Direct Schedule modal for client
  const [isDirectScheduleOpen, setIsDirectScheduleOpen] = useState(false);
  const [scheduleForClient, setScheduleForClient] = useState<Client | null>(null);

  // Filter clients by search query (Name, Phone, WhatsApp) and Status
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')) ||
        (c.whatsapp && c.whatsapp.replace(/\D/g, '').includes(query.replace(/\D/g, '')));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'ativo').length;
    const blocked = clients.filter(c => c.status === 'bloqueado').length;
    const totalSpentSum = clients.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    const avgSpent = total > 0 ? totalSpentSum / total : 0;

    return { total, active, blocked, avgSpent };
  }, [clients]);

  // Open Add modal
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditClient = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  // Open Profile Drawer
  const handleOpenProfile = (client: Client) => {
    setSelectedProfileClient(client);
    setIsProfileDrawerOpen(true);
  };

  // Save / Update Client
  const handleSaveClient = (clientData: Client) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === clientData.id);
      if (exists) {
        return prev.map(c => c.id === clientData.id ? clientData : c);
      }
      return [clientData, ...prev];
    });

    if (selectedProfileClient?.id === clientData.id) {
      setSelectedProfileClient(clientData);
    }
  };

  // Delete client
  const handleDeleteClient = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir o cadastro deste cliente?')) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedProfileClient?.id === clientId) {
        setIsProfileDrawerOpen(false);
      }
    }
  };

  // Toggle Client Status (Ativo <-> Bloqueado)
  const handleToggleStatus = (clientId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextStatus = c.status === 'ativo' ? 'bloqueado' : 'ativo';
        return {
          ...c,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    if (selectedProfileClient?.id === clientId) {
      setSelectedProfileClient(prev => prev ? {
        ...prev,
        status: prev.status === 'ativo' ? 'bloqueado' : 'ativo'
      } : null);
    }
  };

  // Handle direct schedule button
  const handleOpenScheduleForClient = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (client.status === 'bloqueado') {
      alert('Atenção: Este cliente está com cadastro bloqueado. Desbloqueie o cadastro antes de agendar.');
      return;
    }
    setScheduleForClient(client);
    setIsDirectScheduleOpen(true);
  };

  // Add purchase record
  const handleAddPurchase = (purchase: ClientPurchase) => {
    setPurchases(prev => [purchase, ...prev]);
    // update client's total spent
    setClients(prev => prev.map(c => {
      if (c.id === purchase.clientId) {
        return {
          ...c,
          totalSpent: (c.totalSpent || 0) + purchase.amount,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));
  };

  // Save appointment scheduled from client drawer
  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev]);
    // update client's last visit and total spent
    setClients(prev => prev.map(c => {
      if (c.id === appointment.clientId) {
        return {
          ...c,
          lastVisit: appointment.date,
          totalSpent: (c.totalSpent || 0) + appointment.totalPrice,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Clientes</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
              Gestão & Fidelidade
            </span>
          </div>
          <p className="text-neutral-400 mt-1">
            Cadastro completo, credenciais para o portal do cliente, histórico e preferências.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenClientPortal && (
            <button
              onClick={() => onOpenClientPortal(clients[0])}
              className="flex items-center gap-2 bg-[#141414] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white px-4 py-3 rounded-xl font-bold text-xs transition-all"
              title="Acessar Área do Cliente"
            >
              <ExternalLink size={16} className="text-[#d4af37]" />
              Ver Área do Cliente
            </button>
          )}

          <button 
            onClick={handleOpenAddClient}
            className="flex items-center gap-2 bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/10"
          >
            <Plus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Total de Clientes</span>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Clientes Ativos</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Bloqueados / Suspensos</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{metrics.blocked}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
          <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Gasto Médio</span>
          <p className="text-2xl font-bold text-[#d4af37] mt-1">{formatCurrency(metrics.avgSpent)}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#111111] border border-[#d4af37]/15 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por nome, telefone ou WhatsApp..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-400 whitespace-nowrap">Status:</span>
          <div className="flex bg-[#141414] border border-white/10 rounded-xl p-1 w-full sm:w-auto">
            {(['all', 'ativo', 'bloqueado'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                  statusFilter === st ? "bg-[#d4af37] text-black" : "text-neutral-400 hover:text-white"
                )}
              >
                {st === 'all' ? 'Todos' : st === 'ativo' ? 'Ativos' : 'Bloqueados'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          const isBlocked = client.status === 'bloqueado';
          const initials = client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
          const whatsappClean = (client.whatsapp || client.phone).replace(/\D/g, '');

          return (
            <div 
              key={client.id} 
              onClick={() => handleOpenProfile(client)}
              className={cn(
                "bg-[#111111] border p-5 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-4",
                isBlocked
                  ? "border-rose-500/20 hover:border-rose-500/40 opacity-75"
                  : "border-[#d4af37]/15 hover:border-[#d4af37]/40 hover:bg-[#131313]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-[#d4af37]/30 overflow-hidden flex items-center justify-center text-[#d4af37] font-bold shrink-0">
                    {client.photoUrl ? (
                      <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-base group-hover:text-[#d4af37] transition-colors">
                        {client.name}
                      </h3>
                      <span className={cn(
                        "px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                        client.status === 'ativo' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      )}>
                        {client.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-neutral-500" />
                        {client.phone}
                      </span>
                      {client.whatsapp && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <MessageCircle size={12} />
                            WhatsApp
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-500">{client.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">
                    Total Gasto
                  </span>
                  <span className="text-white font-bold text-base">
                    {formatCurrency(client.totalSpent || 0)}
                  </span>
                </div>
              </div>

              {/* Preferences / Allergies Badge if any */}
              {(client.preferences || client.allergies) && (
                <div className="text-xs bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                  {client.allergies && (
                    <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                      <ShieldAlert size={12} />
                      Alergias: {client.allergies}
                    </span>
                  )}
                  {client.preferences && (
                    <span className="text-neutral-300 text-[11px] line-clamp-1">
                      Preferência: {client.preferences}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {/* Direct WhatsApp link */}
                  <a
                    href={`https://wa.me/55${whatsappClean}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-all"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </a>

                  {/* Toggle status (Ativar / Bloquear) */}
                  <button
                    onClick={(e) => handleToggleStatus(client.id, e)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                      isBlocked
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                        : "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
                    )}
                    title={isBlocked ? 'Desbloquear Cadastro' : 'Bloquear Cadastro'}
                  >
                    {isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </button>

                  {/* Quick Schedule for client */}
                  <button
                    onClick={(e) => handleOpenScheduleForClient(client, e)}
                    className="px-2.5 py-1 rounded-lg bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-black text-[11px] font-bold transition-all"
                  >
                    + Agendar
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenEditClient(client, e)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 transition-colors"
                    title="Editar Cadastro"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClient(client.id, e)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir Cadastro"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={18} className="text-neutral-600 group-hover:text-[#d4af37] transition-all ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="py-20 text-center space-y-3 bg-[#111111] border border-white/5 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-neutral-600">
            <Search size={32} />
          </div>
          <h4 className="text-base font-bold text-white">Nenhum cliente encontrado</h4>
          <p className="text-neutral-500 text-xs">
            Tente pesquisar por outros termos de nome, telefone ou verifique os filtros de status.
          </p>
        </div>
      )}

      {/* Client Full Profile Drawer */}
      <ClientProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        client={selectedProfileClient}
        onEditClient={(clientToEdit) => {
          setIsProfileDrawerOpen(false);
          setEditingClient(clientToEdit);
          setIsClientModalOpen(true);
        }}
        onToggleClientStatus={(clientId) => handleToggleStatus(clientId)}
        onScheduleForClient={(c) => {
          setIsProfileDrawerOpen(false);
          handleOpenScheduleForClient(c);
        }}
        onOpenClientPortal={(c) => {
          setIsProfileDrawerOpen(false);
          onOpenClientPortal?.(c);
        }}
        appointments={appointments}
        purchases={purchases}
        onAddPurchase={handleAddPurchase}
        services={services}
        professionals={professionals}
      />

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        existingClient={editingClient}
        services={services}
      />

      {/* Direct Scheduling Modal for Client */}
      {scheduleForClient && (
        <AppointmentModal
          isOpen={isDirectScheduleOpen}
          onClose={() => {
            setIsDirectScheduleOpen(false);
            setScheduleForClient(null);
          }}
          onSave={handleSaveAppointment}
          initialProfessionalId={professionals[0]?.id}
          clients={clients}
          onAddClient={handleSaveClient}
          professionals={professionals}
          services={services}
          appointments={appointments}
          absences={absences as any}
        />
      )}
    </div>
  );
};
