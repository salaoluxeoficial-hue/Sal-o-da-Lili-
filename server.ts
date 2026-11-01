import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Helper to download audio file from URL and convert to Base64
async function fetchAudioAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao carregar arquivo de áudio: ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = res.headers.get('content-type') || 'audio/webm';
  return {
    base64: buffer.toString('base64'),
    mimeType: contentType.split(';')[0]
  };
}

// Endpoint para transcrição de áudio e geração de resposta da IA
app.post('/api/chat/audio-response', async (req, res) => {
  try {
    const { audioUrl, audioBase64, mimeType, visitorName } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: 'Nenhum áudio ou URL de áudio fornecido.' });
    }

    let finalBase64 = audioBase64;
    let finalMime = mimeType || 'audio/webm';

    if (!finalBase64 && audioUrl) {
      try {
        const fetched = await fetchAudioAsBase64(audioUrl);
        finalBase64 = fetched.base64;
        finalMime = fetched.mimeType || finalMime;
      } catch (e: any) {
        console.warn('Erro ao carregar áudio do Supabase Storage via URL:', e.message);
      }
    }

    if (!finalBase64) {
      return res.json({
        success: true,
        transcription: 'Mensagem de áudio recebida.',
        replyText: 'Olá! Recebemos sua mensagem de áudio na recepção do Salão Luxe. Nossa equipe já está pronta para atendê-lo(a)!'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini Server] GEMINI_API_KEY não configurada. Usando resposta padrão.');
      return res.json({
        success: true,
        transcription: 'Mensagem de áudio.',
        replyText: 'Olá! Sua mensagem de áudio foi recebida com sucesso pela recepção do Salão Luxe.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // 1. Transcrever áudio usando gemini-3.5-transcribe
    let transcription = '';
    try {
      const transcribeRes = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: finalMime,
                data: finalBase64
              }
            },
            { text: 'Transcreva em português o conteúdo exato deste áudio.' }
          ]
        }
      });
      transcription = transcribeRes.text?.trim() || '';
    } catch (tErr: any) {
      console.warn('[Gemini Transcribe Notice]:', tErr.message);
    }

    // 2. Gerar resposta inteligente e elegante com gemini-3.8-flash
    const promptText = transcription
      ? `O cliente/visitante (${visitorName || 'Visitante Luxe'}) enviou este áudio: "${transcription}". Elabore uma resposta atenciosa e profissional.`
      : `O cliente/visitante (${visitorName || 'Visitante Luxe'}) enviou um áudio. Dê as boas-vindas ao Salão Luxe e confirme o recebimento do áudio.`;

    const replyRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: promptText }],
      config: {
        systemInstruction: `Você é a Recepcionista IA Oficial do Salão Luxe, um salão de beleza VIP e de alto padrão em São Paulo.
Responda de forma sofisticada, gentil, clara e cortês (máximo de 2 a 3 frases).
Ajude com agendamentos, lista de serviços, produtos e horários, convidando para experimentar os tratamentos Luxe.`
      }
    });

    const replyText = replyRes.text?.trim() || 'Olá! Recebemos seu áudio e a recepção do Salão Luxe está à disposição para melhor atendê-lo(a).';

    return res.json({
      success: true,
      transcription,
      replyText
    });
  } catch (err: any) {
    console.error('[Gemini Audio Response Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro no processamento do áudio.',
      replyText: 'Olá! Recebemos seu áudio no Salão Luxe e nossa equipe dará prosseguimento ao atendimento em instantes.'
    });
  }
});

// Vite Middleware para ambiente Dev ou arquivos estáticos em Produção
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor do Salão Luxe ativo na porta ${PORT}`);
});
