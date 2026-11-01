import { useState, useEffect } from 'react';
import { Sidebar } from '@/src/components/Sidebar';
import { Dashboard } from '@/src/components/Dashboard';
import { PublicHome } from '@/src/components/public/PublicHome';
import { PublicChat } from '@/src/components/chat/PublicChat';
import { PublicSidebar } from '@/src/components/public/PublicSidebar';
import { PWAInstallModal } from '@/src/components/pwa/PWAInstallModal';
import { ProfessionalPortalView } from '@/src/components/professionals/ProfessionalPortalView';
import { Services, initialServicesList } from '@/src/components/Services';
import { Professionals, initialProfessionalsList } from '@/src/components/Professionals';
import { Clients, initialClientsList } from '@/src/components/Clients';
import { Agenda } from '@/src/components/Agenda';
import { Products } from '@/src/components/Products';
import { Financial } from '@/src/components/Financial';
import { Settings } from '@/src/components/Settings';
import { Orders } from '@/src/components/Orders';
import { Chat } from '@/src/components/Chat';
import { Vitrine } from '@/src/components/Vitrine';
import { ClientPortalView } from '@/src/components/clients/ClientPortalView';
import { BottomNavigation } from '@/src/components/BottomNavigation';
import { AIAssistantButton } from '@/src/components/AIAssistantButton';
import { AdminAuthModal } from '@/src/components/admin/AdminAuthModal';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Client, Appointment, ClientPurchase, Service, Professional, ViewType, ChatConversation, ProfessionalCommission, ProfessionalAbsence } from '@/src/types';
import { getInitialPurchases } from '@/src/services/clientStorage';
import { getInitialAppointments, getInitialAbsences } from '@/src/services/agendaStorage';
import { getInitialConversations } from '@/src/services/chatStorage';
import { getInitialCommissions } from '@/src/services/financialStorage';
import { SupabaseRLSTest } from '@/src/components/SupabaseRLSTest';
import { supabase } from '@/src/lib/supabase';
import { Menu, Search, Bell, LogOut, ShieldCheck, Home, ArrowLeft } from 'lucide-react';

export default function App() {
  // Area separation state: 'publica' vs 'administrativa'
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useLocalStorage<boolean>('admin_authenticated_session', false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);

  // Active view states
  const [currentPublicView, setCurrentPublicView] = useState<ViewType | 'espaco_profissional' | 'galeria'>('dashboard');
  const [currentAdminView, setCurrentAdminView] = useState<ViewType>('dashboard');

  // Sidebar & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPublicSidebarOpen, setIsPublicSidebarOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  // Shared state for synchronization
  const [clients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', getInitialAppointments());
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [purchases] = useLocalStorage<ClientPurchase[]>('client_purchases', getInitialPurchases());
  const [commissions] = useLocalStorage<ProfessionalCommission[]>('commissions', getInitialCommissions());
  const [absences] = useLocalStorage<ProfessionalAbsence[]>('absences', getInitialAbsences());
  const [chatConversations, setChatConversations] = useLocalStorage<ChatConversation[]>(
    'chat_conversations', 
    getInitialConversations(initialClientsList, initialProfessionalsList)
  );

  useEffect(() => {
    const handleChatSync = () => {
      try {
        const rawConvs = localStorage.getItem('chat_conversations');
        if (rawConvs) setChatConversations(JSON.parse(rawConvs));
      } catch (e) {
        console.error('App chat sync error:', e);
      }
    };
    window.addEventListener('salao-luxe-chat-sync', handleChatSync);
    window.addEventListener('storage', handleChatSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleChatSync);
      window.removeEventListener('storage', handleChatSync);
    };
  }, [setChatConversations]);

  // Main useEffect RLS test query for chat_conversations count
  useEffect(() => {
    async function testSupabaseRLS() {
      try {
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const { data: authData } = await supabase.auth.signInAnonymously();
          user = authData?.user || null;
        }
        const { count, error } = await supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('[Main useEffect Supabase RLS Test] Query chat_conversations failed:', error.message);
        } else {
          console.log('[Main useEffect Supabase RLS Test] chat_conversations count query succeeded! Total:', count, 'User:', user?.id);
        }
      } catch (err) {
        console.error('[Main useEffect Supabase RLS Test] Exception:', err);
      }
    }
    testSupabaseRLS();
  }, []);

  const totalUnreadChat = chatConversations.reduce((acc, curr) => acc + (curr.unreadCountAdmin || 0), 0);

  const handleBookFromPortal = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
  };

  const handleUpdateAppointmentStatus = (appId: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  // Access Control Handler
  const handleOpenAdminPanelRequest = () => {
    if (isAdminAuthenticated) {
      setIsAdminMode(true);
    } else {
      setShowAdminAuthModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminAuthModal(false);
    setIsAdminMode(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminMode(false);
    setCurrentPublicView('dashboard');
  };

  // Dynamic Sidebar option selector
  const handleDynamicMenuSelect = (target: string) => {
    if (target === 'pwa_install') {
      setIsPWAInstallModalOpen(true);
      return;
    }
    if (target === 'area_restrita_admin') {
      handleOpenAdminPanelRequest();
      return;
    }
    if (target === 'area_cliente') {
      if (!portalClient) setPortalClient(clients[0] || null);
      setCurrentPublicView('area_cliente');
      return;
    }
    if (target === 'espaco_profissional') {
      setCurrentPublicView('espaco_profissional');
      return;
    }
    if (target === 'galeria' || target === 'vitrine') {
      setCurrentPublicView('vitrine');
      return;
    }
    handlePublicViewChange(target as ViewType);
  };

  const handlePublicViewChange = (view: ViewType) => {
    if (view === 'area_cliente' && !portalClient) {
      setPortalClient(clients[0] || null);
    }
    // Check if view requires admin permissions
    const adminOnlyViews: ViewType[] = ['agenda', 'profissionais', 'clientes', 'servicos', 'produtos', 'pedidos', 'financeiro', 'configuracoes'];
    
    if (adminOnlyViews.includes(view)) {
      if (!isAdminAuthenticated) {
        setShowAdminAuthModal(true);
        return;
      } else {
        setIsAdminMode(true);
        setCurrentAdminView(view);
        return;
      }
    }
    setCurrentPublicView(view);
  };

  const handleAdminViewChange = (view: ViewType) => {
    if (view === 'area_cliente' && !portalClient) {
      setPortalClient(clients[0] || null);
    }
    setCurrentAdminView(view);
  };

  // --------------------------------------------------------------------------
  // RENDER 1: ÁREA PÚBLICA DO SALÃO LUXE
  // --------------------------------------------------------------------------
  const renderPublicView = () => {
    switch (currentPublicView) {
      case 'dashboard':
        return <PublicHome onNavigate={handlePublicViewChange} />;
      case 'area_cliente':
        return (
          <ClientPortalView 
            initialClient={portalClient}
            clients={clients}
            appointments={appointments}
            services={services}
            professionals={professionals}
            purchases={purchases}
            onBackToAdmin={() => handlePublicViewChange('dashboard')}
            onBookAppointment={handleBookFromPortal}
          />
        );
      case 'espaco_profissional':
        return (
          <ProfessionalPortalView
            professionals={professionals}
            appointments={appointments}
            commissions={commissions}
            absences={absences}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onBackToPublic={() => setCurrentPublicView('dashboard')}
          />
        );
      case 'chat':
        return <PublicChat onBack={() => setCurrentPublicView('dashboard')} />;
      case 'vitrine':
      case 'galeria':
        return (
          <Vitrine
            isAdmin={false}
            onBack={() => setCurrentPublicView('dashboard')}
            onNavigateToAgenda={() => handlePublicViewChange('area_cliente')}
            onNavigateToProducts={() => handlePublicViewChange('vitrine')}
          />
        );
      default:
        return <PublicHome onNavigate={handlePublicViewChange} />;
    }
  };

  // --------------------------------------------------------------------------
  // RENDER 2: ÁREA SEGURA ADMINISTRATIVA
  // --------------------------------------------------------------------------
  const renderAdminView = () => {
    switch (currentAdminView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToAgenda={() => setCurrentAdminView('agenda')} 
            onNavigate={(view) => setCurrentAdminView(view)}
          />
        );
      case 'servicos':
        return <Services />;
      case 'agenda':
        return <Agenda />;
      case 'profissionais':
        return <Professionals />;
      case 'clientes':
        return (
          <Clients 
            onOpenClientPortal={(client) => {
              setPortalClient(client);
              setCurrentAdminView('area_cliente');
            }} 
          />
        );
      case 'area_cliente':
        return (
          <ClientPortalView 
            initialClient={portalClient}
            clients={clients}
            appointments={appointments}
            services={services}
            professionals={professionals}
            purchases={purchases}
            onBackToAdmin={() => setCurrentAdminView('clientes')}
            onBookAppointment={handleBookFromPortal}
          />
        );
      case 'produtos':
        return <Products />;
      case 'pedidos':
        return <Orders onNavigateToProducts={() => setCurrentAdminView('produtos')} />;
      case 'financeiro':
        return <Financial />;
      case 'chat':
        return <Chat />;
      case 'vitrine':
        return (
          <Vitrine
            isAdmin={true}
            onBack={() => setCurrentAdminView('dashboard')}
            onNavigateToAgenda={() => setCurrentAdminView('agenda')}
            onNavigateToProducts={() => setCurrentAdminView('produtos')}
          />
        );
      case 'configuracoes':
        return <Settings />;
      default:
        return (
          <Dashboard 
            onNavigateToAgenda={() => setCurrentAdminView('agenda')} 
            onNavigate={(view) => setCurrentAdminView(view)}
          />
        );
    }
  };

  // --------------------------------------------------------------------------
  // RENDER - ÁREA SEGURA (PAINEL ADMINISTRATIVO)
  // --------------------------------------------------------------------------
  if (isAdminMode && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex relative">
        <Sidebar 
          currentView={currentAdminView} 
          onViewChange={handleAdminViewChange}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onNavigateToPublicHome={() => {
            setIsAdminMode(false);
            setCurrentPublicView('dashboard');
          }}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          {/* Header Administrativo Protegido */}
          <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-[#d4af37]/20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-[#d4af37] transition-colors"
                title="Alternar Menu Lateral"
              >
                <Menu size={22} />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-64 focus-within:border-[#d4af37]/50 transition-all">
                <Search size={16} className="text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Pesquisar no sistema..." 
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-neutral-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Botão Fixo/Visível "Tela inicial" */}
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setCurrentPublicView('dashboard');
                }}
                className="flex items-center gap-2 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Ir diretamente para a Tela Inicial Pública do Salão Luxe"
              >
                <Home size={16} />
                <span>Tela inicial</span>
              </button>

              {/* Badge de Área protegida */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                Painel Restrito Admin
              </div>

              <button 
                onClick={() => setCurrentAdminView('chat')}
                className="relative p-2 text-neutral-400 hover:text-[#d4af37] transition-colors"
                title="Mensagens e Alertas"
              >
                <Bell size={20} />
                {totalUnreadChat > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-[#050505]">
                    {totalUnreadChat}
                  </span>
                )}
              </button>

              <div className="h-7 w-[1px] bg-white/10 mx-1" />

              {/* Botão de Encerrar Sessão do Admin */}
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Sair do Painel e Encerrar Sessão"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair do Admin</span>
              </button>
            </div>
          </header>

          {/* Área de Conteúdo Gerencial */}
          <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            {currentAdminView !== 'dashboard' && (
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  onClick={() => setCurrentAdminView('dashboard')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 transition-all text-xs font-bold group shadow-sm"
                  title="Voltar para o Painel Principal"
                >
                  <ArrowLeft size={16} className="text-[#d4af37] group-hover:-translate-x-1 transition-transform" />
                  <span>Voltar ao Painel ADM</span>
                </button>
                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                  Painel ADM / {currentAdminView.replace('_', ' ')}
                </span>
              </div>
            )}
            {renderAdminView()}
          </div>
        </main>

        {/* Modal de autenticação se necessário */}
        <AdminAuthModal 
          isOpen={showAdminAuthModal}
          onClose={() => setShowAdminAuthModal(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER - ÁREA PÚBLICA DO SALÃO LUXE
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative pb-24">
      {/* Header da Área Pública */}
      <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-[#d4af37]/20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPublicSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-xl text-[#d4af37] transition-colors border border-[#d4af37]/30"
            title="Abrir Menu Lateral"
          >
            <Menu size={22} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-[#d4af37]/20">
            SL
          </div>
          <div>
            <span className="text-[#d4af37] font-extrabold text-base sm:text-lg tracking-wider block leading-tight">
              SALÃO LUXE
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium">
              Unissex & Estética VIP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPublicView('chat')}
            className="relative p-2.5 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-xl transition-all"
            title="Atendimento e Mensagens"
          >
            <Bell size={20} />
            {totalUnreadChat > 0 && (
              <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-[#050505]">
                {totalUnreadChat}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal da Área Pública */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {currentPublicView !== 'dashboard' && currentPublicView !== 'chat' && currentPublicView !== 'vitrine' && (
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <button
              onClick={() => setCurrentPublicView('dashboard')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 transition-all text-xs font-bold group shadow-sm"
              title="Voltar para a Tela Inicial do Salão Luxe"
            >
              <ArrowLeft size={16} className="text-[#d4af37] group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Início</span>
            </button>
            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
              Salão Luxe / {currentPublicView.replace('_', ' ')}
            </span>
          </div>
        )}
        {renderPublicView()}
      </main>

      {/* Menu Lateral Dinâmico Público (Drawer) */}
      <PublicSidebar
        isOpen={isPublicSidebarOpen}
        onClose={() => setIsPublicSidebarOpen(false)}
        onSelectOption={handleDynamicMenuSelect}
        currentUserRole={isAdminAuthenticated ? 'admin' : 'publico'}
      />

      {/* Modal de Instalação PWA */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />

      {/* Assistente IA Flutuante na Área Pública (Oculto nos portais de cliente e profissional) */}
      {currentPublicView !== 'area_cliente' && currentPublicView !== 'espaco_profissional' && (
        <AIAssistantButton onNavigate={handlePublicViewChange} />
      )}

      {/* Navegação Inferior Fixa da Área Pública */}
      <BottomNavigation 
        currentView={currentPublicView === 'espaco_profissional' || currentPublicView === 'galeria' ? 'dashboard' : currentPublicView as ViewType} 
        onViewChange={handlePublicViewChange}
        unreadChatCount={totalUnreadChat}
      />

      {/* Modal de Autenticação para Acesso Restrito */}
      <AdminAuthModal 
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Componente de Teste e Diagnóstico RLS do Supabase */}
      <SupabaseRLSTest />
    </div>
  );
}
