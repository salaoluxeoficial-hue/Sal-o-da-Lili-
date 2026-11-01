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

// Helper robusto com retry e fallback entre modelos oficiais suportados
async function callGeminiWithRetryAndFallback(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction: string
): Promise<string> {
  // Lista de modelos padrão compatíveis com tarefas de conversação/Q&A
  const candidates = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
        }
      });
      const reply = response.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini ${model} falhou]:`, err.message || err);
      // Próximo candidato
    }
  }

  throw lastError || new Error('Nenhum modelo Gemini respondeu no momento.');
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

    const salonKnowledgePrompt = `
INFORMAÇÕES OFICIAIS DO SALÃO LUXE:
- Serviços & Preços:
  • Corte Masculino: R$ 60 (30 min)
  • Corte Feminino: R$ 120 (60 min)
  • Barba Terapia: R$ 45 (30 min, toalha quente e óleos essenciais)
  • Coloração & Mechas: R$ 180 (120 min)
  • Escova Modeladora: R$ 80 (45 min)
  • Tratamentos & Hidratação: Kérastase e Wella Professionals a partir de R$ 140
  • Manicure & Pedicure: R$ 65
- Produtos Premium à venda:
  • Shampoo Kérastase Nutritive 1L (R$ 185)
  • Pomada Modeladora Barba Forte Matte 80g (R$ 55)
  • Óleo Hidratante Barba Forte 30ml (R$ 48)
  • Máscara Wella Oil Reflections 500ml (R$ 160)
  • Leave-in Protetor Térmico L'Oréal Absolut Repair (R$ 110)
  • Balm Barba e Rosto 120g (R$ 42)
- Localização: Bairro dos Jardins, São Paulo - SP.
- Diferenciais: Atendimento VIP, valet/estacionamento com manobrista gratuito, lounge com café espresso e espumante cortesia.
- Horário: Terça a Sábado das 09h às 20h.
- Agendamento: Pelo próprio aplicativo na aba "Agendamento" ou com os profissionais especializados.`;

    const replyText = await callGeminiWithRetryAndFallback(
      ai,
      [{ text: promptText }],
      `Você é a Recepcionista e Concierge IA Oficial do Salão Luxe, um salão de beleza e estética de alto padrão e luxo em São Paulo.
Responda de forma sofisticada, gentil, clara e cortês (máximo de 2 a 3 frases).
Ajude com agendamentos, lista de serviços, produtos e horários, convidando para experimentar os tratamentos Luxe.
${salonKnowledgePrompt}`
    );

    return res.json({
      success: true,
      transcription,
      replyText: replyText || 'Olá! Recebemos seu áudio e a recepção do Salão Luxe está à disposição para melhor atendê-lo(a).'
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

// Endpoint para processamento de perguntas em texto e resposta da IA da tela inicial
app.post('/api/chat/text-response', async (req, res) => {
  try {
    const { message, visitorName, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensagem vazia ou não informada.' 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini Server] GEMINI_API_KEY não configurada no ambiente.');
      return res.status(503).json({
        success: false,
        error: 'Serviço de IA temporariamente sem chave de autenticação configurada.',
        replyText: 'Olá! Nosso concierge virtual está passando por uma breve sincronização. Para dúvidas imediatas ou agendamentos, por favor navegue pelas abas do aplicativo ou entre em contato com nossa recepção.'
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

    const systemInstruction = `Você é a Concierge e Assistente IA Oficial do Salão Luxe, salão de beleza VIP e de alto padrão em São Paulo (Jardins).
Sua missão é atender clientes e visitantes com alto refinamento, acolhimento, educação e rapidez, tirando dúvidas sobre serviços, preços, produtos, horários e agendamentos.

INFORMAÇÕES EXATAS DO SALÃO LUXE:
- Serviços & Preços:
  • Corte Masculino: R$ 60 (30 min, lavagem e acabamento)
  • Corte Feminino: R$ 120 (60 min, consultoria de visagismo e finalização)
  • Barba Terapia: R$ 45 (30 min, toalha quente e óleos essenciais)
  • Coloração & Mechas: R$ 180 (120 min, loiros, morena iluminada, balayage)
  • Escova Modeladora: R$ 80 (45 min)
  • Tratamentos & Hidratações (Kérastase / Wella): a partir de R$ 140
  • Manicure & Pedicure Spa: R$ 65
- Produtos Premium à venda na vitrine do salão:
  • Shampoo Kérastase Nutritive Bain Satin 1L: R$ 185
  • Máscara Wella Professionals Oil Reflections 500ml: R$ 160
  • Leave-in Protetor Térmico L'Oréal Absolut Repair 90ml: R$ 110
  • Pomada Modeladora Barba Forte Efeito Matte 80g: R$ 55
  • Óleo Hidratante Premium para Barba 30ml: R$ 48
  • Balm Multifuncional Barba e Rosto 120g: R$ 42
- Horário de Funcionamento: Terça-feira a Sábado, das 09h às 20h. Domingos e segundas fechado.
- Localização: Jardins, São Paulo - SP.
- Comodidades VIP: Estacionamento com manobrista gratuito (valet), lounge com café espresso gourmet e espumante de cortesia.
- Agendamentos: Podem ser realizados diretamente pelo aplicativo na aba "Agendamento" (onde o cliente escolhe data, horário e profissional), ou através deste canal.

DIRETRIZES DE RESPOSTA:
1. Responda em português com vocabulário elegante, polido e acolhedor.
2. Seja objetivo e conciso (2 a 4 frases por resposta).
3. Responda diretamente à pergunta feita pelo cliente com os valores e informações reais fornecidos acima.
4. Se perguntarem sobre agendar, convide gentilmente a acessar a aba de Agendamento do aplicativo ou confirme a preferência de horário.`;

    let contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history
        .slice(-6)
        .filter((h: any) => h && h.content && typeof h.content === 'string')
        .map((h: any) => ({
          role: h.senderRole === 'admin' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));

      contents = [...recentHistory, { role: 'user', parts: [{ text: message }] }];
    } else {
      contents = [{ text: `Mensagem de ${visitorName || 'Cliente'}: ${message}` }];
    }

    const replyText = await callGeminiWithRetryAndFallback(
      ai,
      contents,
      systemInstruction
    );

    return res.json({
      success: true,
      replyText: replyText || 'Olá! Como concierge do Salão Luxe, estou à sua disposição para cuidar da sua beleza e bem-estar.'
    });
  } catch (err: any) {
    console.error('[Gemini Text Response Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao processar mensagem com a IA.',
      replyText: 'Desculpe pelo transtorno. Nosso concierge por IA está temporariamente indisponível no momento. Por favor, tente novamente em alguns instantes ou consulte nossa recepção.'
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
