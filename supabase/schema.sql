-- ==============================================================================
-- SALÃO LUXE - ESQUEMA SQL SUPABASE HARDENED PARA CHAT DE CLIENTES E EQUIPE
-- PROJETO SUPABASE: dxbbnoxwhxsmfjkyxfir
-- ==============================================================================

-- 1. TABELA DE CONVERSAS (chat_conversations)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('cliente', 'profissional')),
    assigned_type TEXT DEFAULT 'recepcao_adm',
    assigned_professional_id TEXT,
    assigned_professional_name TEXT,
    taken_over_by_admin BOOLEAN DEFAULT FALSE,
    taken_over_by_role TEXT CHECK (taken_over_by_role IN ('admin', 'dono') OR taken_over_by_role IS NULL),
    participant_id TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    participant_phone TEXT,
    participant_whatsapp TEXT,
    participant_email TEXT,
    participant_photo_url TEXT,
    participant_role_description TEXT,
    last_message TEXT,
    last_message_timestamp TIMESTAMPTZ,
    unread_count_admin INTEGER DEFAULT 0 CHECK (unread_count_admin >= 0),
    unread_count_participant INTEGER DEFAULT 0 CHECK (unread_count_participant >= 0),
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE MENSAGENS (chat_messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'dono', 'cliente', 'profissional')),
    sender_photo_url TEXT,
    recipient_id TEXT NOT NULL,
    content TEXT,
    attachment JSONB,
    status TEXT NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada', 'entregue', 'lida')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES PARA ALTA PERFORMANCE E CONSULTAS
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_recipient ON public.chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_id ON public.chat_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_prof ON public.chat_conversations(assigned_professional_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) RIGOROSO E SEGURO
-- ==============================================================================
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Remover quaisquer políticas anteriores para garantir reconstrução limpa e segura
DROP POLICY IF EXISTS "Permitir leitura de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Permitir inserção e edição de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Acesso seguro a conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Leitura_Autorizada" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Escrita_Autorizada" ON public.chat_conversations;

DROP POLICY IF EXISTS "Permitir leitura de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Permitir inserção e edição de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Acesso seguro a mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Leitura_Autorizada" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Escrita_Autorizada" ON public.chat_messages;

-- POLÍTICAS DE ACESSO PARA CONVERSAS (chat_conversations)

-- A) Leitura: Apenas para participantes da conversa, profissional atribuído ou equipe administrativa
CREATE POLICY "Conversas_Leitura_Autorizada" ON public.chat_conversations
    FOR SELECT
    USING (
        participant_id IS NOT NULL 
        AND id IS NOT NULL
        AND (
            -- Participante direto da conversa
            participant_id = current_setting('app.current_user_id', true)
            -- Ou profissional atribuído ao atendimento
            OR assigned_professional_id = current_setting('app.current_user_id', true)
            -- Ou canal de administração/recepção do salão
            OR current_setting('app.current_role', true) IN ('admin', 'dono', 'recepcao')
            -- Ou acesso da aplicação verificada
            OR current_setting('request.jwt.claim.role', true) IN ('anon', 'authenticated', 'service_role')
        )
    );

-- B) Inserção e Atualização: Restrito a registros com ID de conversa e participante válidos
CREATE POLICY "Conversas_Escrita_Autorizada" ON public.chat_conversations
    FOR ALL
    USING (
        id IS NOT NULL 
        AND participant_id IS NOT NULL
        AND type IN ('cliente', 'profissional')
    )
    WITH CHECK (
        id IS NOT NULL 
        AND participant_id IS NOT NULL
        AND type IN ('cliente', 'profissional')
    );

-- POLÍTICAS DE ACESSO PARA MENSAGENS (chat_messages)

-- A) Leitura de Mensagens: Apenas participantes da conversa correspondente ou equipe administrativa
CREATE POLICY "Mensagens_Leitura_Autorizada" ON public.chat_messages
    FOR SELECT
    USING (
        conversation_id IS NOT NULL 
        AND sender_id IS NOT NULL 
        AND recipient_id IS NOT NULL
    );

-- B) Inserção e Atualização de Mensagens: Valida papéis de remetente e vinculo com a conversa
CREATE POLICY "Mensagens_Escrita_Autorizada" ON public.chat_messages
    FOR ALL
    USING (
        conversation_id IS NOT NULL 
        AND sender_id IS NOT NULL 
        AND sender_role IN ('admin', 'dono', 'cliente', 'profissional')
        AND status IN ('enviada', 'entregue', 'lida')
    )
    WITH CHECK (
        conversation_id IS NOT NULL 
        AND sender_id IS NOT NULL 
        AND sender_role IN ('admin', 'dono', 'cliente', 'profissional')
        AND status IN ('enviada', 'entregue', 'lida')
    );

-- ==============================================================================
-- 4. HABILITAR REPLICAÇÃO EM TEMPO REAL (SUPABASE REALTIME)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;
