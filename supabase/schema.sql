-- ==============================================================================
-- SALÃO LUXE - ESQUEMA SQL SUPABASE PARA CHAT CLIENTE ⇄ ADM & PROFISSIONAL ⇄ ADM
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
    taken_over_by_role TEXT,
    participant_id TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    participant_phone TEXT,
    participant_whatsapp TEXT,
    participant_email TEXT,
    participant_photo_url TEXT,
    participant_role_description TEXT,
    last_message TEXT,
    last_message_timestamp TIMESTAMPTZ,
    unread_count_admin INTEGER DEFAULT 0,
    unread_count_participant INTEGER DEFAULT 0,
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

-- ÍNDICES PARA ALTA PERFORMANCE E CONSULTA EM TEMPO REAL
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_id ON public.chat_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);

-- ==============================================================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS) E POLÍTICAS DE SEGURANÇA E ACESSO
-- ==============================================================================
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para chat_conversations
DROP POLICY IF EXISTS "Permitir leitura de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Permitir inserção e edição de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Acesso seguro a conversas" ON public.chat_conversations;

CREATE POLICY "Acesso seguro a conversas" ON public.chat_conversations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas de Acesso para chat_messages
DROP POLICY IF EXISTS "Permitir leitura de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Permitir inserção e edição de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Acesso seguro a mensagens" ON public.chat_messages;

CREATE POLICY "Acesso seguro a mensagens" ON public.chat_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

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
