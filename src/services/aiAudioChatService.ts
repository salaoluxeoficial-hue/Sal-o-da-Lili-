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
      senderName: 'Atendimento IA Salão Luxe',
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
  } catch (err) {
    console.error('Erro ao processar mensagem de áudio com IA:', err);

    // Resposta de contingência graciosa para manter a continuidade do atendimento
    sendMessageDirectly({
      conversationId: params.conversationId,
      senderId: ADMIN_PARTICIPANT_ID,
      senderName: 'Atendimento IA Salão Luxe',
      senderRole: 'admin',
      recipientId: params.conversationId,
      content: 'Olá! Recebemos a sua mensagem de áudio. Nossa equipe da recepção do Salão Luxe já está à disposição para atendê-lo(a).',
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantRoleDescription: 'Atendimento por IA Salão Luxe',
      },
    });
  }
}
