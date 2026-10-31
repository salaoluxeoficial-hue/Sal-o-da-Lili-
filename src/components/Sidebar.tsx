import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserSquare2, 
  Scissors, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings,
  Menu,
  X,
  Sparkles,
  Home
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ViewType, ChatConversation } from '@/src/types';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { getInitialConversations } from '@/src/services/chatStorage';
import { initialClientsList } from '@/src/components/Clients';
import { initialProfessionalsList } from '@/src/components/Professionals';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNavigateToPublicHome?: () => void;
}

const menuItems: { icon: React.ElementType; label: string; view: ViewType; isPortal?: boolean }[] = [
  { icon: LayoutDashboard, label: 'Início', view: 'dashboard' },
  { icon: Calendar, label: 'Agenda', view: 'agenda' },
  { icon: Users, label: 'Profissionais', view: 'profissionais' },
  { icon: UserSquare2, label: 'Clientes', view: 'clientes' },
  { icon: Scissors, label: 'Serviços', view: 'servicos' },
  { icon: Package, label: 'Produtos', view: 'produtos' },
  { icon: ShoppingBag, label: 'Pedidos', view: 'pedidos' },
  { icon: DollarSign, label: 'Financeiro', view: 'financeiro' },
  { icon: MessageSquare, label: 'Chat', view: 'chat' },
  { icon: ImageIcon, label: 'Vitrine', view: 'vitrine' },
  { icon: Settings, label: 'Configurações', view: 'configuracoes' },
  { icon: Sparkles, label: 'Área do Cliente', view: 'area_cliente', isPortal: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, setIsOpen, onNavigateToPublicHome }) => {
  const [conversations] = useLocalStorage<ChatConversation[]>(
    'chat_conversations', 
    getInitialConversations(initialClientsList, initialProfessionalsList)
  );
  const unreadChatCount = conversations.reduce((acc, curr) => acc + (curr.unreadCountAdmin || 0), 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-[#0a0a0a] border-r border-[#d4af37]/20 z-50 transition-all duration-300",
        isOpen ? "w-64" : "w-20",
        "lg:translate-x-0",
        !isOpen && "lg:w-20",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="flex items-center justify-between p-6 border-b border-[#d4af37]/10">
            {isOpen ? (
              <span className="text-[#d4af37] font-bold text-xl tracking-wider">SALÃO LUXE</span>
            ) : (
              <span className="text-[#d4af37] font-bold text-xl">SL</span>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-[#d4af37]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-3">
              {/* Botão Tela Inicial do Salão */}
              {onNavigateToPublicHome && (
                <li>
                  <button
                    onClick={() => {
                      onNavigateToPublicHome();
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-[#d4af37] bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 font-bold shadow-sm"
                    title="Navegar diretamente para a Tela Inicial pública do Salão Luxe"
                  >
                    <Home size={22} className="shrink-0 text-[#d4af37]" />
                    {isOpen && (
                      <span className="font-semibold text-sm whitespace-nowrap">Tela inicial</span>
                    )}
                  </button>
                </li>
              )}
              {menuItems.map((item) => {
                const isChat = item.view === 'chat';
                const hasUnread = isChat && unreadChatCount > 0;

                return (
                  <li key={item.view}>
                    <button
                      onClick={() => {
                        onViewChange(item.view);
                        if (window.innerWidth < 1024) setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                        currentView === item.view 
                          ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20" 
                          : item.isPortal
                            ? "text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/25 font-bold"
                            : "text-neutral-400 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                      )}
                    >
                      <div className="relative">
                        <item.icon size={24} />
                        {hasUnread && !isOpen && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0a0a0a]" />
                        )}
                      </div>
                      {isOpen && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="font-medium whitespace-nowrap">{item.label}</span>
                          {hasUnread && (
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              {unreadChatCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile Summary */}
          <div className="p-4 border-t border-[#d4af37]/10">
            <div className={cn(
              "flex items-center gap-3",
              !isOpen && "justify-center"
            )}>
              <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center text-black font-bold">
                AD
              </div>
              {isOpen && (
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">Administrador</span>
                  <span className="text-neutral-500 text-xs uppercase tracking-tighter">Premium Plan</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
