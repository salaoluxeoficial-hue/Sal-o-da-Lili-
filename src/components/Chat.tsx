import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Users, 
  UserSquare2, 
  Clock, 
  Sparkles, 
  Plus, 
  Zap, 
  Search,
  MessageCircle,
  ExternalLink,
  Shield,
  Send,
  X
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { 
  ChatConversation, 
  ChatMessage, 
  ChatAttachment, 
  QuickReply, 
  Client, 
  Professional, 
  ChatParticipantType 
} from '@/src/types';
import { 
  DEFAULT_QUICK_REPLIES, 
  syncConversationsWithRegisteredEntities, 
  ADMIN_PARTICIPANT_ID,
  ADMIN_PARTICIPANT_NAME,
  sendMessageDirectly,
  markConversationAsReadDirectly,
  getStoredMessages
} from '@/src/services/chatStorage';
import { initialClientsList } from '@/src/components/Clients';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { ChatSidebar, SidebarFilterType } from './chat/ChatSidebar';
import { ChatArea } from './chat/ChatArea';
import { QuickRepliesModal } from './chat/QuickRepliesModal';
import { ChatBrandingManager } from './admin/ChatBrandingManager';
import { cn } from '@/src/lib/utils';

export const Chat: React.FC = () => {
  // Persistent stores
  const [clients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [storedConversations, setStoredConversations] = useLocalStorage<ChatConversation[]>('chat_conversations', []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chat_messages', getStoredMessages());
  const [quickReplies, setQuickReplies] = useLocalStorage<QuickReply[]>('chat_quick_replies', DEFAULT_QUICK_REPLIES);

  // Synchronized conversations with real clients & pros
  const conversations = useMemo(() => {
    return syncConversationsWithRegisteredEntities(clients, professionals, storedConversations);
  }, [clients, professionals, storedConversations]);

  // Active state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return conversations[0]?.id || null;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<SidebarFilterType>('todas');
  const [isQuickRepliesModalOpen, setIsQuickRepliesModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');

  // Real-time synchronization listener for cross-component chat updates
  useEffect(() => {
    const handleSync = () => {
      try {
        const rawMsgs = localStorage.getItem('chat_messages');
        if (rawMsgs) {
          setMessages(JSON.parse(rawMsgs));
        }
        const rawConvs = localStorage.getItem('chat_conversations');
        if (rawConvs) {
          setStoredConversations(JSON.parse(rawConvs));
        }
      } catch (err) {
        console.error('Chat sync error:', err);
      }
    };

    window.addEventListener('salao-luxe-chat-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [setMessages, setStoredConversations]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messages
      .filter(m => m.conversationId === activeConversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeConversationId]);

  // Handlers
  const handleMarkAsRead = (convId: string) => {
    markConversationAsReadDirectly(convId, 'admin');
  };

  const handleSendMessage = (
    content: string,
    senderRole: ChatParticipantType,
    senderId: string,
    senderName: string,
    attachment?: ChatAttachment
  ) => {
    if (!activeConversation) return;

    const recipientId = senderRole === 'admin' ? activeConversation.participantId : ADMIN_PARTICIPANT_ID;

    sendMessageDirectly({
      conversationId: activeConversation.id,
      senderId,
      senderName,
      senderRole: senderRole as 'admin' | 'cliente' | 'profissional',
      recipientId,
      content,
      attachment,
      participantDetails: {
        type: activeConversation.type,
        participantId: activeConversation.participantId,
        participantName: activeConversation.participantName,
        participantPhone: activeConversation.participantPhone,
        participantWhatsapp: activeConversation.participantWhatsapp,
        participantEmail: activeConversation.participantEmail,
        participantPhotoUrl: activeConversation.participantPhotoUrl,
        participantRoleDescription: activeConversation.participantRoleDescription
      }
    });
  };

  const handleSaveQuickReply = (reply: QuickReply) => {
    setQuickReplies(prev => {
      const idx = prev.findIndex(r => r.id === reply.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = reply;
        return copy;
      }
      return [...prev, reply];
    });
  };

  const handleDeleteQuickReply = (id: string) => {
    setQuickReplies(prev => prev.filter(r => r.id !== id));
  };

  // Stats calculation
  const totalConversationsCount = conversations.length;
  const clientConversationsCount = conversations.filter(c => c.type === 'cliente').length;
  const proConversationsCount = conversations.filter(c => c.type === 'profissional').length;
  const totalUnreadCount = conversations.reduce((acc, curr) => acc + (curr.unreadCountAdmin || 0), 0);

  // New Chat Dialog candidates
  const availableCandidates = useMemo(() => {
    const list: { id: string; name: string; type: 'cliente' | 'profissional'; roleOrPhone: string; convId: string }[] = [];
    
    clients.forEach(c => {
      list.push({
        id: c.id,
        name: c.name,
        type: 'cliente',
        roleOrPhone: c.phone || c.email,
        convId: `conv-client-${c.id}`
      });
    });

    professionals.forEach(p => {
      list.push({
        id: p.id,
        name: p.name,
        type: 'profissional',
        roleOrPhone: p.role,
        convId: `conv-prof-${p.id}`
      });
    });

    if (!newChatSearch.trim()) return list;
    const q = newChatSearch.toLowerCase();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) || item.roleOrPhone.toLowerCase().includes(q)
    );
  }, [clients, professionals, newChatSearch]);

  return (
    <div className="w-full max-w-[380px] mx-auto px-1 sm:px-0 space-y-2.5 animate-in fade-in duration-300">
      {/* Cabeçalho Compacto do Chat / Atendimento ADM */}
      <div className="bg-[#0b0b0b] border border-[#d4af37]/25 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-white tracking-wide truncate">
              Chat & Atendimento ADM
            </h1>
            <p className="text-[10px] text-neutral-400 font-light truncate">
              Painel Master • Salão Luxe
            </p>
          </div>
        </div>

        {/* Ações Rápidas em botões compactos */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsBrandingModalOpen(true)}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 rounded-lg text-xs transition-colors"
            title="Personalizar fotos e avatares"
          >
            <Sparkles size={13} className="text-[#d4af37]" />
          </button>

          <button
            onClick={() => setIsQuickRepliesModalOpen(true)}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 rounded-lg text-xs transition-colors"
            title="Respostas Rápidas"
          >
            <Zap size={13} className="text-[#d4af37]" />
          </button>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-2 py-1 bg-[#d4af37] hover:bg-[#b8860b] text-black font-semibold rounded-lg text-xs flex items-center gap-1 transition-all shadow-sm"
            title="Nova Conversa"
          >
            <Plus size={12} />
            <span className="text-[11px]">Novo</span>
          </button>
        </div>
      </div>

      {/* Indicadores de Status Compactos */}
      <div className="grid grid-cols-4 gap-1.5 text-center select-none">
        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl py-1 px-1">
          <span className="text-[9px] text-neutral-500 block leading-tight">Total</span>
          <span className="text-xs font-bold text-white block">{totalConversationsCount}</span>
        </div>
        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl py-1 px-1">
          <span className="text-[9px] text-blue-400 block leading-tight">Clientes</span>
          <span className="text-xs font-bold text-white block">{clientConversationsCount}</span>
        </div>
        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl py-1 px-1">
          <span className="text-[9px] text-emerald-400 block leading-tight">Equipe</span>
          <span className="text-xs font-bold text-white block">{proConversationsCount}</span>
        </div>
        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl py-1 px-1">
          <span className="text-[9px] text-rose-400 block leading-tight">Não Lidas</span>
          <span className="text-xs font-bold text-white block">{totalUnreadCount}</span>
        </div>
      </div>

      {/* Janela de Atendimento Compacta e Centralizada (380px no desktop, responsiva no mobile, max 75vh) */}
      <div className="w-full h-[75vh] max-h-[75vh] bg-[#080808] border border-[#d4af37]/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onBackToList={() => setActiveConversationId(null)}
            quickReplies={quickReplies}
            onOpenQuickRepliesModal={() => setIsQuickRepliesModalOpen(true)}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}
      </div>

      {/* Quick Replies Modal */}
      <QuickRepliesModal
        isOpen={isQuickRepliesModalOpen}
        onClose={() => setIsQuickRepliesModalOpen(false)}
        quickReplies={quickReplies}
        onSaveQuickReply={handleSaveQuickReply}
        onDeleteQuickReply={handleDeleteQuickReply}
      />

      {/* New Chat Picker Modal */}
      {isNewChatModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewChatModalOpen(false);
          }}
        >
          <div className="bg-[#0f0f0f] border border-[#d4af37]/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/10 bg-[#141414] flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">Iniciar Conversa</h3>
                <p className="text-[11px] text-neutral-400">Selecione um cliente ou profissional cadastrado</p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1"
              >
                Fechar
              </button>
            </div>

            <div className="p-3 border-b border-white/5 bg-black/40">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou contato..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-2 overflow-y-auto max-h-80 divide-y divide-white/5">
              {availableCandidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Nenhum cadastro encontrado.
                </div>
              ) : (
                availableCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConversationId(c.convId);
                      setIsNewChatModalOpen(false);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#161616] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-semibold text-xs">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-xs font-semibold">{c.name}</div>
                        <div className="text-[10px] text-neutral-400">{c.roleOrPhone}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                      c.type === 'profissional'
                        ? "bg-[#d4af37]/15 text-[#d4af37]"
                        : "bg-blue-500/15 text-blue-400"
                    )}>
                      {c.type === 'profissional' ? 'Equipe' : 'Cliente'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização dos Atendimentos & Chats */}
      {isBrandingModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBrandingModalOpen(false);
          }}
        >
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#0d0d0d] border border-[#d4af37]/30 rounded-3xl shadow-2xl overflow-y-auto p-4 sm:p-6 relative">
            <button
              onClick={() => setIsBrandingModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors z-10"
              title="Fechar"
            >
              <X size={20} />
            </button>
            <ChatBrandingManager />
          </div>
        </div>
      )}
    </div>
  );
};
