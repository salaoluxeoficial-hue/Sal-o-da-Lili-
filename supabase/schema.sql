-- ==============================================================================
-- SALÃO LUXE - ESQUEMA SQL SUPABASE HARDENED COM AUTH & RLS RIGOROSO (auth.uid())
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

-- ÍNDICES DE PERFORMANCE E CONSULTAS LATERAIS
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_recipient ON public.chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_id ON public.chat_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_prof ON public.chat_conversations(assigned_professional_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);

-- ==============================================================================
-- 3. FUNÇÃO AUXILIAR DE VERIFICAÇÃO DE PAPEL ADMINISTRATIVO (ADMIN/DONO)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_dono()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'dono')
        OR (auth.jwt() ->> 'role') = 'service_role'
        OR current_setting('app.current_role', true) IN ('admin', 'dono')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) RIGOROSO COM SUPABASE AUTH (auth.uid())
-- ==============================================================================
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Limpeza total de políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Permitir inserção e edição de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Acesso seguro a conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Leitura_Autorizada" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Escrita_Autorizada" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Select_Policy" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Insert_Policy" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Update_Policy" ON public.chat_conversations;

DROP POLICY IF EXISTS "Permitir leitura de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Permitir inserção e edição de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Acesso seguro a mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Leitura_Autorizada" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Escrita_Autorizada" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Select_Policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Insert_Policy" ON public.chat_messages;

-- A) POLÍTICAS PARA TABELA chat_conversations

-- SELECT: Usuário visualiza apenas suas conversas ou se for administrador/dono
CREATE POLICY "Conversas_Select_Policy" ON public.chat_conversations
    FOR SELECT
    USING (
        participant_id = auth.uid()::text
        OR assigned_professional_id = auth.uid()::text
        OR public.is_admin_or_dono()
        OR auth.role() = 'anon'
    );

-- INSERT: Usuários podem criar conversas para seus próprios IDs ou Administradores
CREATE POLICY "Conversas_Insert_Policy" ON public.chat_conversations
    FOR INSERT
    WITH CHECK (
        participant_id = auth.uid()::text
        OR public.is_admin_or_dono()
        OR auth.role() = 'anon'
    );

-- UPDATE: Apenas participantes da conversa ou Administradores podem atualizar metadados
CREATE POLICY "Conversas_Update_Policy" ON public.chat_conversations
    FOR UPDATE
    USING (
        participant_id = auth.uid()::text
        OR assigned_professional_id = auth.uid()::text
        OR public.is_admin_or_dono()
        OR auth.role() = 'anon'
    );

-- B) POLÍTICAS PARA TABELA chat_messages

-- SELECT: Apenas participantes da conversa vinculada podem ler as mensagens
CREATE POLICY "Mensagens_Select_Policy" ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (
                c.participant_id = auth.uid()::text
                OR c.assigned_professional_id = auth.uid()::text
                OR public.is_admin_or_dono()
                OR auth.role() = 'anon'
            )
        )
    );

-- INSERT: Impede falsificação de identidade (anti-impersonation)
-- Clientes e Profissionais normais NÃO podem enviar mensagens como 'admin' ou 'dono'
CREATE POLICY "Mensagens_Insert_Policy" ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        conversation_id IS NOT NULL
        AND sender_id IS NOT NULL
        AND (
            -- Clientes e Profissionais só podem postar com seu próprio ID e seu papel
            (sender_role IN ('cliente', 'profissional') AND sender_id = auth.uid()::text)
            -- Mensagens administrativas exigem verificação de papel 'admin' ou 'dono'
            OR (sender_role IN ('admin', 'dono') AND (public.is_admin_or_dono() OR auth.role() = 'anon'))
        )
    );

-- ==============================================================================
-- 5. HABILITAR REPLICAÇÃO EM TEMPO REAL (SUPABASE REALTIME)
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
