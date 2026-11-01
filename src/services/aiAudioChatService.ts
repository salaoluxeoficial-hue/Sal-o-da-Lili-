import { ChatAttachment } from '@/src/types';
import { sendMessageDirectly, ADMIN_PARTICIPANT_ID } from '@/src/services/chatStorage';

/**
 * Envia o áudio gravado e armazenado para transcrição e geração de resposta automática via Gemini no servidor.
 * Salva a transcrição/resposta em chat_messages vinculada à mesma conversa.
 */
export async function processAudioMessageWithAI(params: {
  conversationId: string;
  attachment: ChatAttachment;
  visitorName?: string;
  aiName?: string;
}) {
  try {
    const response = await fetch('/api/chat/audio-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioUrl: params.attachment.url,
        mimeType: params.attachment.mimeType,
        conversationId: params.conversationId,
        visitorName: params.visitorName || 'Visitante Luxe',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na rota do servidor: ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.replyText || 'Olá! Sua mensagem de áudio foi recebida com sucesso pela recepção do Salão Luxe.';

    // Grava a resposta da IA na mesma conversa via sendMessageDirectly
    sendMessageDirectly({
      conversationId: params.conversationId,
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: params.aiName || 'Atendimento IA Salão Luxe',
      senderRole: 'admin',
      recipientId: params.conversationId,
      content: replyText,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantRoleDescription: 'Atendimento por IA Salão Luxe',
      },
    });

    return data;
  } catch (err: any) {
    console.error('Erro ao processar mensagem de áudio com IA:', err);

    // Resposta de contingência graciosa para manter a continuidade do atendimento
    const fallbackText = 'Olá! Recebemos a sua mensagem de áudio. Nossa equipe da recepção do Salão Luxe já está à disposição para atendê-lo(a).';
    sendMessageDirectly({
      conversationId: params.conversationId,
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: params.aiName || 'Atendimento IA Salão Luxe',
      senderRole: 'admin',
      recipientId: params.conversationId,
      content: fallbackText,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantRoleDescription: 'Atendimento por IA Salão Luxe',
      },
    });

    return { success: false, replyText: fallbackText, error: err.message };
  }
}

/**
 * Envia uma mensagem em texto do usuário para processamento inteligente via Gemini no servidor.
 * Retorna e salva a resposta contextualizada da IA na conversa.
 */
export async function processTextMessageWithAI(params: {
  conversationId: string;
  message: string;
  visitorName?: string;
  aiName?: string;
  history?: any[];
}): Promise<{ success: boolean; replyText: string; error?: string }> {
  try {
    const response = await fetch('/api/chat/text-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        conversationId: params.conversationId,
        visitorName: params.visitorName || 'Visitante Luxe',
        history: params.history || [],
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data?.error || `Erro ${response.status}: ${response.statusText}`;
      const fallbackReply = data?.replyText || 'Olá! Nosso serviço de atendimento inteligente está passando por uma breve sincronização. Nossa recepção humana está à sua disposição.';

      // Registra a mensagem de aviso/fallback para não deixar o usuário sem retorno
      sendMessageDirectly({
        conversationId: params.conversationId,
        senderId: ADMIN_PARTICIPANT_ID,
        senderName: params.aiName || 'Assistente Luxe',
        senderRole: 'admin',
        recipientId: params.conversationId,
        content: fallbackReply,
        participantDetails: {
          type: 'cliente',
          assignedType: 'recepcao_adm',
          participantRoleDescription: 'Atendimento por IA Salão Luxe',
        },
      });

      return { success: false, replyText: fallbackReply, error: errorMsg };
    }

    const replyText = data.replyText || 'Olá! Como posso ajudar você hoje no Salão Luxe?';

    // Grava a resposta da IA na mesma conversa vinculada via sendMessageDirectly
    sendMessageDirectly({
      conversationId: params.conversationId,
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: params.aiName || 'Assistente Luxe',
      senderRole: 'admin',
      recipientId: params.conversationId,
      content: replyText,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantRoleDescription: 'Atendimento por IA Salão Luxe',
      },
    });

    return { success: true, replyText };
  } catch (err: any) {
    console.error('Erro ao processar mensagem de texto com IA:', err);
    const friendlyError = 'O concierge virtual está momentaneamente indisponível. Por favor, tente novamente em alguns instantes.';

    sendMessageDirectly({
      conversationId: params.conversationId,
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: params.aiName || 'Assistente Luxe',
      senderRole: 'admin',
      recipientId: params.conversationId,
      content: friendlyError,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantRoleDescription: 'Atendimento por IA Salão Luxe',
      },
    });

    return { success: false, replyText: friendlyError, error: err.message };
  }
}
