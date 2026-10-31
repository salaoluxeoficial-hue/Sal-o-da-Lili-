import { ChatConversation, ChatMessage, QuickReply, Client, Professional } from '@/src/types';

export const ADMIN_PARTICIPANT_ID = 'admin-luxe';
export const ADMIN_PARTICIPANT_NAME = 'Salão Luxe (Recepção / Gerência)';
export const DONO_PARTICIPANT_ID = 'dono-luxe';
export const DONO_PARTICIPANT_NAME = 'Dono do Salão Luxe';

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'qr-1',
    title: 'Confirmação de Horário',
    shortcut: '/confirmar',
    content: 'Olá! Confirmamos seu horário agendado no Salão Luxe. Caso precise remarcar, por gentileza nos avise com antecedência. Estamos ansiosos para recebê-lo(a)!',
    category: 'agendamento'
  },
  {
    id: 'qr-2',
    title: 'Lembrete do Dia',
    shortcut: '/lembrete',
    content: 'Olá! Lembramos que o seu agendamento no Salão Luxe está marcado para hoje. Nossa equipe e bancada já estão preparadas para seu atendimento.',
    category: 'agendamento'
  },
  {
    id: 'qr-3',
    title: 'Agradecimento e Avaliação',
    shortcut: '/pos',
    content: 'Agradecemos imensamente pela visita ao Salão Luxe! Como foi sua experiência conosco hoje? Sua opinião e feedback são fundamentais para nós.',
    category: 'atendimento'
  },
  {
    id: 'qr-4',
    title: 'Horários Disponíveis',
    shortcut: '/horarios',
    content: 'Olá! Temos horários especiais disponíveis para esta semana. Deseja que reservemos uma vaga com seu profissional favorito?',
    category: 'atendimento'
  },
  {
    id: 'qr-5',
    title: 'Alinhamento com Equipe',
    shortcut: '/equipe',
    content: 'Olá! Favor verificar a agenda atualizada e conferir a organização e produtos da bancada para os próximos atendimentos.',
    category: 'equipe'
  },
  {
    id: 'qr-6',
    title: 'Comissão e Fechamento',
    shortcut: '/comissao',
    content: 'Olá! Seu relatório de comissões e atendimentos do período já está disponível para conferência no sistema do Salão Luxe.',
    category: 'equipe'
  }
];

export function getInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-seed-1',
      conversationId: 'conv-client-1',
      senderId: '1',
      senderName: 'Mariana Souza',
      senderRole: 'cliente',
      recipientId: ADMIN_PARTICIPANT_ID,
      content: 'Olá! Gostaria de saber se o meu agendamento de mechas para amanhã às 14h está confirmado.',
      status: 'lida',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'msg-seed-2',
      conversationId: 'conv-client-1',
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: ADMIN_PARTICIPANT_NAME,
      senderRole: 'admin',
      recipientId: '1',
      content: 'Olá, Mariana! Sim, seu horário está devidamente confirmado com a especialista Ana Oliveira. Estamos ansiosos para recebê-la!',
      status: 'lida',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'msg-seed-3',
      conversationId: 'conv-prof-1',
      senderId: '1',
      senderName: 'Ricardo Silva',
      senderRole: 'profissional',
      recipientId: ADMIN_PARTICIPANT_ID,
      content: 'Boa tarde! Preciso solicitar a reposição do óleo finalizador Luxe Gold na minha bancada.',
      status: 'lida',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: 'msg-seed-4',
      conversationId: 'conv-prof-1',
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: ADMIN_PARTICIPANT_NAME,
      senderRole: 'admin',
      recipientId: '1',
      content: 'Perfeito, Ricardo! O estoque da gerência já separou as unidades para a sua bancada.',
      status: 'lida',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];
}

export function getInitialConversations(clients: Client[] = [], professionals: Professional[] = []): ChatConversation[] {
  return syncConversationsWithRegisteredEntities(clients, professionals, []);
}

export function syncConversationsWithRegisteredEntities(
  clients: Client[],
  professionals: Professional[],
  existingConversations: ChatConversation[]
): ChatConversation[] {
  const result: ChatConversation[] = [...existingConversations];

  // Sync clients
  for (const client of clients) {
    const convId = `conv-client-${client.id}`;
    const existingIndex = result.findIndex(c => c.id === convId);
    
    if (existingIndex >= 0) {
      // Update details in case client name or phone changed
      result[existingIndex] = {
        ...result[existingIndex],
        participantName: client.name,
        participantPhone: client.phone,
        participantWhatsapp: client.whatsapp || client.phone,
        participantEmail: client.email,
        participantPhotoUrl: client.photoUrl,
        participantRoleDescription: `Cliente (${client.status === 'ativo' ? 'Ativo' : 'Bloqueado'})`
      };
    } else {
      const isClient1 = String(client.id) === '1';
      result.push({
        id: convId,
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantId: client.id,
        participantName: client.name,
        participantPhone: client.phone,
        participantWhatsapp: client.whatsapp || client.phone,
        participantEmail: client.email,
        participantPhotoUrl: client.photoUrl,
        participantRoleDescription: `Cliente (${client.status === 'ativo' ? 'Ativo' : 'Bloqueado'})`,
        lastMessage: isClient1 ? 'Sim, seu horário está devidamente confirmado com a especialista Ana Oliveira.' : undefined,
        lastMessageTimestamp: isClient1 ? new Date(Date.now() - 3600000 * 2).toISOString() : undefined,
        unreadCountAdmin: 0,
        unreadCountParticipant: 0,
        isOnline: true,
        updatedAt: client.createdAt || new Date().toISOString()
      });
    }
  }

  // Sync professionals
  for (const prof of professionals) {
    const convId = `conv-prof-${prof.id}`;
    const existingIndex = result.findIndex(c => c.id === convId);

    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        participantName: prof.name,
        participantPhotoUrl: prof.photoUrl,
        participantRoleDescription: prof.role || 'Profissional'
      };
    } else {
      result.push({
        id: convId,
        type: 'profissional',
        assignedType: 'recepcao_adm',
        participantId: prof.id,
        participantName: prof.name,
        participantPhotoUrl: prof.photoUrl,
        participantRoleDescription: prof.role || 'Profissional',
        unreadCountAdmin: 0,
        unreadCountParticipant: 0,
        isOnline: true,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Sort by updatedAt descending
  return result.sort((a, b) => {
    const tA = new Date(a.lastMessageTimestamp || a.updatedAt).getTime();
    const tB = new Date(b.lastMessageTimestamp || b.updatedAt).getTime();
    return tB - tA;
  });
}

export function formatWhatsAppUrl(phoneNumber?: string, customText?: string): string {
  if (!phoneNumber) return '';
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return '';

  const fullNumber = digits.length <= 11 ? `55${digits}` : digits;
  const message = customText || 'Olá! Mensagem enviada através da recepção do Salão Luxe.';
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return getInitialMessages();
  try {
    const raw = localStorage.getItem('chat_messages');
    if (!raw) {
      const initial = getInitialMessages();
      localStorage.setItem('chat_messages', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading chat_messages:', err);
    return getInitialMessages();
  }
}

export function getStoredConversationsRaw(): ChatConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('chat_conversations');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading chat_conversations:', err);
    return [];
  }
}

export function broadcastChatUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salao-luxe-chat-sync'));
  }
}

export function sendMessageDirectly(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'dono' | 'cliente' | 'profissional';
  recipientId: string;
  content: string;
  attachment?: any;
  participantDetails?: Partial<ChatConversation>;
}): { newMsg: ChatMessage; conversations: ChatConversation[]; messages: ChatMessage[] } {
  const timestamp = new Date().toISOString();
  const isFromAdminOrDono = params.senderRole === 'admin' || params.senderRole === 'dono';

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    recipientId: params.recipientId,
    content: params.content,
    attachment: params.attachment,
    status: isFromAdminOrDono ? 'entregue' : 'enviada',
    timestamp
  };

  // 1. Save message directly into localStorage
  const currentMsgs = getStoredMessages();
  const updatedMsgs = [...currentMsgs, newMsg];
  localStorage.setItem('chat_messages', JSON.stringify(updatedMsgs));

  // 2. Update conversation metadata
  const currentConvs = getStoredConversationsRaw();
  const snippet = params.content || (params.attachment?.type === 'image' ? '📷 Foto anexada' : '📎 Documento anexado');

  const existingIdx = currentConvs.findIndex(c => c.id === params.conversationId);
  let updatedConvs: ChatConversation[] = [];

  if (existingIdx >= 0) {
    updatedConvs = [...currentConvs];
    const prevAdminUnread = updatedConvs[existingIdx].unreadCountAdmin || 0;
    const prevPartUnread = updatedConvs[existingIdx].unreadCountParticipant || 0;

    updatedConvs[existingIdx] = {
      ...updatedConvs[existingIdx],
      ...params.participantDetails,
      lastMessage: snippet,
      lastMessageTimestamp: timestamp,
      unreadCountAdmin: isFromAdminOrDono ? 0 : (prevAdminUnread + 1),
      unreadCountParticipant: isFromAdminOrDono ? (prevPartUnread + 1) : 0,
      updatedAt: timestamp
    };
  } else {
    const details = params.participantDetails || {};
    const newConv: ChatConversation = {
      id: params.conversationId,
      type: details.type || (params.senderRole === 'profissional' ? 'profissional' : 'cliente'),
      assignedType: details.assignedType || 'recepcao_adm',
      assignedProfessionalId: details.assignedProfessionalId,
      assignedProfessionalName: details.assignedProfessionalName,
      participantId: details.participantId || params.senderId,
      participantName: details.participantName || params.senderName,
      participantPhone: details.participantPhone,
      participantWhatsapp: details.participantWhatsapp || details.participantPhone,
      participantEmail: details.participantEmail,
      participantPhotoUrl: details.participantPhotoUrl,
      participantRoleDescription: details.participantRoleDescription || 'Cliente Salão Luxe',
      lastMessage: snippet,
      lastMessageTimestamp: timestamp,
      unreadCountAdmin: isFromAdminOrDono ? 0 : 1,
      unreadCountParticipant: isFromAdminOrDono ? 1 : 0,
      isOnline: true,
      updatedAt: timestamp
    };
    updatedConvs = [newConv, ...currentConvs];
  }

  localStorage.setItem('chat_conversations', JSON.stringify(updatedConvs));

  // 3. Broadcast sync event to all components
  broadcastChatUpdate();

  return { newMsg, conversations: updatedConvs, messages: updatedMsgs };
}

export function takeOverConversation(conversationId: string, role: 'admin' | 'dono' = 'admin') {
  if (typeof window === 'undefined') return;
  const currentConvs = getStoredConversationsRaw();
  const idx = currentConvs.findIndex(c => c.id === conversationId);
  if (idx >= 0) {
    const updatedConvs = [...currentConvs];
    updatedConvs[idx] = {
      ...updatedConvs[idx],
      takenOverByAdmin: true,
      takenOverByRole: role
    };
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConvs));
    broadcastChatUpdate();
  }
}

export function handBackConversation(conversationId: string) {
  if (typeof window === 'undefined') return;
  const currentConvs = getStoredConversationsRaw();
  const idx = currentConvs.findIndex(c => c.id === conversationId);
  if (idx >= 0) {
    const updatedConvs = [...currentConvs];
    updatedConvs[idx] = {
      ...updatedConvs[idx],
      takenOverByAdmin: false,
      takenOverByRole: undefined
    };
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConvs));
    broadcastChatUpdate();
  }
}

export function markConversationAsReadDirectly(conversationId: string, role: 'admin' | 'participant') {
  if (typeof window === 'undefined') return;

  const currentConvs = getStoredConversationsRaw();
  const idx = currentConvs.findIndex(c => c.id === conversationId);
  
  if (idx >= 0) {
    const updatedConvs = [...currentConvs];
    if (role === 'admin') {
      updatedConvs[idx] = { ...updatedConvs[idx], unreadCountAdmin: 0 };
    } else {
      updatedConvs[idx] = { ...updatedConvs[idx], unreadCountParticipant: 0 };
    }
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConvs));
  }

  // Update messages status
  const currentMsgs = getStoredMessages();
  let changed = false;
  const updatedMsgs = currentMsgs.map(m => {
    if (m.conversationId === conversationId) {
      if (role === 'admin' && (m.senderRole !== 'admin' && m.senderRole !== 'dono') && m.status !== 'lida') {
        changed = true;
        return { ...m, status: 'lida' as const };
      }
      if (role === 'participant' && (m.senderRole === 'admin' || m.senderRole === 'dono') && m.status !== 'lida') {
        changed = true;
        return { ...m, status: 'lida' as const };
      }
    }
    return m;
  });

  if (changed) {
    localStorage.setItem('chat_messages', JSON.stringify(updatedMsgs));
  }

  broadcastChatUpdate();
}
