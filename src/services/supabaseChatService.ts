import { supabase } from '@/src/lib/supabase';
import { ChatConversation, ChatMessage, ChatAttachment, ChatParticipantType, Client, Professional } from '@/src/types';

export const ADMIN_PARTICIPANT_ID = 'admin-luxe';
export const ADMIN_PARTICIPANT_NAME = 'Salão Luxe (Recepção / Gerência)';
export const DONO_PARTICIPANT_ID = 'dono-luxe';
export const DONO_PARTICIPANT_NAME = 'Dono do Salão Luxe';

// Convert Supabase row to ChatConversation
function mapRowToConversation(row: any): ChatConversation {
  return {
    id: row.id,
    type: row.type,
    assignedType: row.assigned_type || 'recepcao_adm',
    assignedProfessionalId: row.assigned_professional_id,
    assignedProfessionalName: row.assigned_professional_name,
    takenOverByAdmin: row.taken_over_by_admin || false,
    takenOverByRole: row.taken_over_by_role,
    participantId: row.participant_id,
    participantName: row.participant_name,
    participantPhone: row.participant_phone,
    participantWhatsapp: row.participant_whatsapp,
    participantEmail: row.participant_email,
    participantPhotoUrl: row.participant_photo_url,
    participantRoleDescription: row.participant_role_description,
    lastMessage: row.last_message,
    lastMessageTimestamp: row.last_message_timestamp,
    unreadCountAdmin: row.unread_count_admin || 0,
    unreadCountParticipant: row.unread_count_participant || 0,
    isOnline: row.is_online ?? true,
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

// Convert ChatConversation to Supabase row
function mapConversationToRow(conv: ChatConversation): any {
  return {
    id: conv.id,
    type: conv.type,
    assigned_type: conv.assignedType || 'recepcao_adm',
    assigned_professional_id: conv.assignedProfessionalId || null,
    assigned_professional_name: conv.assignedProfessionalName || null,
    taken_over_by_admin: conv.takenOverByAdmin || false,
    taken_over_by_role: conv.takenOverByRole || null,
    participant_id: conv.participantId,
    participant_name: conv.participantName,
    participant_phone: conv.participantPhone || null,
    participant_whatsapp: conv.participantWhatsapp || conv.participantPhone || null,
    participant_email: conv.participantEmail || null,
    participant_photo_url: conv.participantPhotoUrl || null,
    participant_role_description: conv.participantRoleDescription || null,
    last_message: conv.lastMessage || null,
    last_message_timestamp: conv.lastMessageTimestamp || null,
    unread_count_admin: conv.unreadCountAdmin || 0,
    unread_count_participant: conv.unreadCountParticipant || 0,
    is_online: conv.isOnline ?? true,
    updated_at: conv.updatedAt || new Date().toISOString(),
  };
}

// Convert Supabase row to ChatMessage
function mapRowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    senderPhotoUrl: row.sender_photo_url,
    recipientId: row.recipient_id,
    content: row.content || '',
    attachment: row.attachment || undefined,
    status: row.status || 'enviada',
    timestamp: row.created_at || new Date().toISOString(),
  };
}

// Convert ChatMessage to Supabase row
function mapMessageToRow(msg: ChatMessage): any {
  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_role: msg.senderRole,
    sender_photo_url: msg.senderPhotoUrl || null,
    recipient_id: msg.recipientId,
    content: msg.content || '',
    attachment: msg.attachment || null,
    status: msg.status || 'enviada',
    created_at: msg.timestamp || new Date().toISOString(),
  };
}

// Local cache helper for instant UI rendering
function updateLocalCache(conversations?: ChatConversation[], messages?: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    if (conversations) {
      localStorage.setItem('chat_conversations', JSON.stringify(conversations));
    }
    if (messages) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
    window.dispatchEvent(new CustomEvent('salao-luxe-chat-sync'));
  } catch (err) {
    console.error('Error updating local chat cache:', err);
  }
}

let isRealtimeSubscribed = false;

/**
 * Initializes Supabase Realtime subscription for conversations and messages.
 */
export function initSupabaseChatRealtime() {
  if (typeof window === 'undefined' || isRealtimeSubscribed) return;
  isRealtimeSubscribed = true;

  // Initial fetch from Supabase
  fetchAndSyncFromSupabase();

  const channel = supabase
    .channel('public:chat_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      async (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newMsg = mapRowToMessage(payload.new);
          // Sync messages
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });

          if (data) {
            const allMsgs = data.map(mapRowToMessage);
            updateLocalCache(undefined, allMsgs);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });

          if (data) {
            const allMsgs = data.map(mapRowToMessage);
            updateLocalCache(undefined, allMsgs);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_conversations' },
      async () => {
        const { data } = await supabase
          .from('chat_conversations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (data) {
          const allConvs = data.map(mapRowToConversation);
          updateLocalCache(allConvs, undefined);
        }
      }
    )
    .subscribe((status) => {
      console.log('Supabase Realtime Chat Subscription Status:', status);
    });
}

/**
 * Fetches data from Supabase and populates local state & cache.
 */
export async function fetchAndSyncFromSupabase() {
  try {
    const [convRes, msgRes] = await Promise.all([
      supabase.from('chat_conversations').select('*').order('updated_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
    ]);

    let convs: ChatConversation[] = [];
    let msgs: ChatMessage[] = [];

    if (convRes.data && convRes.data.length > 0) {
      convs = convRes.data.map(mapRowToConversation);
    }
    if (msgRes.data && msgRes.data.length > 0) {
      msgs = msgRes.data.map(mapRowToMessage);
    }

    // Auto-seed existing history into Supabase if empty
    if ((!convRes.data || convRes.data.length === 0) && (!msgRes.data || msgRes.data.length === 0)) {
      try {
        const rawLocalConvs = localStorage.getItem('chat_conversations');
        const rawLocalMsgs = localStorage.getItem('chat_messages');
        const localConvs: ChatConversation[] = rawLocalConvs ? JSON.parse(rawLocalConvs) : [];
        const localMsgs: ChatMessage[] = rawLocalMsgs ? JSON.parse(rawLocalMsgs) : [];

        if (localConvs.length > 0) {
          await supabase.from('chat_conversations').upsert(localConvs.map(mapConversationToRow));
        }
        if (localMsgs.length > 0) {
          await supabase.from('chat_messages').upsert(localMsgs.map(mapMessageToRow));
        }
      } catch (e) {
        console.warn('Auto-seed Supabase notice:', e);
      }
    }

    if (convs.length > 0 || msgs.length > 0) {
      updateLocalCache(convs.length > 0 ? convs : undefined, msgs.length > 0 ? msgs : undefined);
    }
  } catch (err) {
    console.warn('Supabase fetch notice (using cache/local fallback):', err);
  }
}

/**
 * Sends a chat message to Supabase and updates conversation metadata.
 */
export async function sendSupabaseMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'dono' | 'cliente' | 'profissional';
  recipientId: string;
  content: string;
  attachment?: ChatAttachment;
  participantDetails?: Partial<ChatConversation>;
}): Promise<{ newMsg: ChatMessage }> {
  const timestamp = new Date().toISOString();
  const isFromAdminOrDono = params.senderRole === 'admin' || params.senderRole === 'dono';

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    recipientId: params.recipientId,
    content: params.content,
    attachment: params.attachment,
    status: isFromAdminOrDono ? 'entregue' : 'enviada',
    timestamp,
  };

  const snippet = params.content || (params.attachment?.type === 'image' ? '📷 Foto anexada' : '📎 Documento anexado');

  // 1. Fetch current conversation to update unread counters
  const { data: existingConvData } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', params.conversationId)
    .single();

  let unreadAdmin = isFromAdminOrDono ? 0 : 1;
  let unreadPart = isFromAdminOrDono ? 1 : 0;

  if (existingConvData) {
    unreadAdmin = isFromAdminOrDono ? 0 : ((existingConvData.unread_count_admin || 0) + 1);
    unreadPart = isFromAdminOrDono ? ((existingConvData.unread_count_participant || 0) + 1) : 0;
  }

  const details = params.participantDetails || {};
  const convRow = {
    id: params.conversationId,
    type: details.type || (params.senderRole === 'profissional' ? 'profissional' : 'cliente'),
    assigned_type: details.assignedType || 'recepcao_adm',
    assigned_professional_id: details.assignedProfessionalId || null,
    assigned_professional_name: details.assignedProfessionalName || null,
    participant_id: details.participantId || params.senderId,
    participant_name: details.participantName || params.senderName,
    participant_phone: details.participantPhone || null,
    participant_whatsapp: details.participantWhatsapp || details.participantPhone || null,
    participant_email: details.participantEmail || null,
    participant_photo_url: details.participantPhotoUrl || null,
    participant_role_description: details.participantRoleDescription || 'Cliente Salão Luxe',
    last_message: snippet,
    last_message_timestamp: timestamp,
    unread_count_admin: unreadAdmin,
    unread_count_participant: unreadPart,
    is_online: true,
    updated_at: timestamp,
  };

  // Upsert conversation & insert message in Supabase
  try {
    await supabase.from('chat_conversations').upsert(convRow);
    await supabase.from('chat_messages').insert(mapMessageToRow(newMsg));
  } catch (err) {
    console.error('Supabase error inserting message:', err);
  }

  // Refresh local cache & notify
  fetchAndSyncFromSupabase();

  return { newMsg };
}

/**
 * Marks a conversation as read in Supabase.
 */
export async function markSupabaseConversationAsRead(conversationId: string, role: 'admin' | 'participant') {
  try {
    const updateData = role === 'admin'
      ? { unread_count_admin: 0 }
      : { unread_count_participant: 0 };

    await supabase
      .from('chat_conversations')
      .update(updateData)
      .eq('id', conversationId);

    // Update message status to 'lida'
    if (role === 'admin') {
      await supabase
        .from('chat_messages')
        .update({ status: 'lida' })
        .eq('conversation_id', conversationId)
        .neq('sender_role', 'admin')
        .neq('sender_role', 'dono');
    } else {
      await supabase
        .from('chat_messages')
        .update({ status: 'lida' })
        .eq('conversation_id', conversationId)
        .or('sender_role.eq.admin,sender_role.eq.dono');
    }

    fetchAndSyncFromSupabase();
  } catch (err) {
    console.error('Error marking conversation as read in Supabase:', err);
  }
}

/**
 * Takes over a conversation by Admin or Dono in Supabase.
 */
export async function takeOverSupabaseConversation(conversationId: string, role: 'admin' | 'dono' = 'admin') {
  try {
    await supabase
      .from('chat_conversations')
      .update({
        taken_over_by_admin: true,
        taken_over_by_role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    fetchAndSyncFromSupabase();
  } catch (err) {
    console.error('Error taking over conversation in Supabase:', err);
  }
}

/**
 * Hands back a conversation to staff in Supabase.
 */
export async function handBackSupabaseConversation(conversationId: string) {
  try {
    await supabase
      .from('chat_conversations')
      .update({
        taken_over_by_admin: false,
        taken_over_by_role: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    fetchAndSyncFromSupabase();
  } catch (err) {
    console.error('Error handing back conversation in Supabase:', err);
  }
}
