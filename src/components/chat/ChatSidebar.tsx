import React from 'react';
import { 
  Search, 
  MessageSquare, 
  Users, 
  UserSquare2, 
  CheckCheck, 
  Check, 
  Paperclip, 
  Image as ImageIcon,
  ExternalLink,
  Circle
} from 'lucide-react';
import { ChatConversation } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { formatWhatsAppUrl } from '@/src/services/chatStorage';

export type SidebarFilterType = 'todas' | 'cliente' | 'profissional' | 'direto_prof' | 'assumidos' | 'nao_lidas';

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: SidebarFilterType;
  onFilterChange: (filter: SidebarFilterType) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange
}) => {
  // Counts
  const totalCount = conversations.length;
  const clientsCount = conversations.filter(c => c.type === 'cliente').length;
  const profsCount = conversations.filter(c => c.type === 'profissional').length;
  const directProCount = conversations.filter(c => Boolean(c.assignedProfessionalName)).length;
  const takenOverCount = conversations.filter(c => Boolean(c.takenOverByAdmin)).length;
  const unreadCount = conversations.filter(c => c.unreadCountAdmin > 0).length;

  // Filtered list
  const filteredConversations = conversations.filter(conv => {
    // Type filter
    if (activeFilter === 'cliente' && conv.type !== 'cliente') return false;
    if (activeFilter === 'profissional' && conv.type !== 'profissional') return false;
    if (activeFilter === 'direto_prof' && !conv.assignedProfessionalName) return false;
    if (activeFilter === 'assumidos' && !conv.takenOverByAdmin) return false;
    if (activeFilter === 'nao_lidas' && conv.unreadCountAdmin === 0) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = conv.participantName.toLowerCase().includes(q);
      const matchPhone = (conv.participantPhone || '').toLowerCase().includes(q);
      const matchEmail = (conv.participantEmail || '').toLowerCase().includes(q);
      const matchLastMsg = (conv.lastMessage || '').toLowerCase().includes(q);
      const matchProName = (conv.assignedProfessionalName || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchLastMsg || matchProName;
    }

    return true;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    // Check if this week
    const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#0a0a0a] border-r border-[#d4af37]/15">
      {/* Search Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou mensagem..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => onFilterChange('todas')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'todas'
                ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Todas</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeFilter === 'todas' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
            )}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('cliente')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'cliente'
                ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Clientes</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeFilter === 'cliente' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
            )}>
              {clientsCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('direto_prof')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'direto_prof'
                ? "bg-purple-500 text-white font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Direto c/ Profissional</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeFilter === 'direto_prof' ? "bg-black/20 text-white font-bold" : "bg-white/10 text-neutral-300"
            )}>
              {directProCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('assumidos')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'assumidos'
                ? "bg-amber-500 text-black font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Assumidos p/ ADM</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeFilter === 'assumidos' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
            )}>
              {takenOverCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('profissional')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'profissional'
                ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Equipe</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeFilter === 'profissional' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
            )}>
              {profsCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('nao_lidas')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeFilter === 'nao_lidas'
                ? "bg-rose-500 text-white font-semibold shadow-sm"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            )}
          >
            <span>Não Lidas</span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mb-3">
              <MessageSquare size={22} />
            </div>
            <p className="text-white text-sm font-medium">Nenhuma conversa encontrada</p>
            <p className="text-neutral-500 text-xs mt-1">
              {searchTerm ? 'Tente outro termo de busca.' : 'Novas conversas serão abertas automaticamente com clientes e equipe.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversationId === conv.id;
            const waUrl = formatWhatsAppUrl(conv.participantWhatsapp || conv.participantPhone);

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "p-3.5 flex items-start gap-3 cursor-pointer transition-all relative group select-none",
                  isSelected 
                    ? "bg-[#d4af37]/10 border-l-4 border-l-[#d4af37]" 
                    : "hover:bg-white/[0.03] border-l-4 border-l-transparent"
                )}
              >
                {/* Avatar with Online Badge */}
                <div className="relative shrink-0 mt-0.5">
                  {conv.participantPhotoUrl && conv.participantPhotoUrl.length > 5 ? (
                    <img
                      src={conv.participantPhotoUrl}
                      alt={conv.participantName}
                      className="w-11 h-11 rounded-full object-cover border border-[#d4af37]/30"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#161616] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-semibold text-xs">
                      {getInitials(conv.participantName)}
                    </div>
                  )}
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      isSelected ? "text-[#d4af37]" : "text-white"
                    )}>
                      {conv.participantName}
                    </span>
                    <span className="text-[11px] text-neutral-500 shrink-0">
                      {formatTime(conv.lastMessageTimestamp || conv.updatedAt)}
                    </span>
                  </div>

                  {/* Subline: role tag + last message */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                      conv.type === 'profissional'
                        ? "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/25"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {conv.type === 'profissional' ? 'Equipe' : 'Cliente'}
                    </span>
                    {conv.participantRoleDescription && (
                      <span className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                        • {conv.participantRoleDescription}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
                      {conv.lastMessage ? conv.lastMessage : (
                        <span className="italic text-neutral-600">Sem mensagens anteriores</span>
                      )}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* WhatsApp quick button */}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir no WhatsApp"
                          className="opacity-0 group-hover:opacity-100 p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {/* Unread count badge */}
                      {conv.unreadCountAdmin > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-black shadow-sm">
                          {conv.unreadCountAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
