-- ==============================================================================
-- SALÃO LUXE - ESQUEMA SQL SUPABASE HARDENED COM TRIGGER DE IMUTABILIDADE & AUTH
-- PROJETO SUPABASE: dxbbnoxwhxsmfjkyxfir
-- ==============================================================================

-- 1. TABELA DE ROLES DO SERVIDOR (public.user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'dono', 'profissional', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONVERSAS (public.chat_conversations)
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

-- 3. TABELA DE MENSAGENS (public.chat_messages)
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

-- ÍNDICES DE PERFORMANCE E CONSULTAS
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_recipient ON public.chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_id ON public.chat_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_prof ON public.chat_conversations(assigned_professional_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);

-- ==============================================================================
-- 4. FUNÇÕES ADMINISTRATIVAS COM VERIFICAÇÃO SERVICE_ROLE E search_path SEGURO
-- ==============================================================================

-- Verifica se o usuário autenticado atual (auth.uid()) é Administrador ou Dono
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.role() = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role') THEN
        RETURN TRUE;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'dono')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Verifica se o usuário autenticado atual é Profissional ou Administrador
CREATE OR REPLACE FUNCTION public.is_authenticated_professional()
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.role() = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role') THEN
        RETURN TRUE;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('profissional', 'admin', 'dono')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Procedimento seguro de atribuição de papéis (Bootstrapping inicial automático sem segredos expostos)
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    target_role TEXT
)
RETURNS VOID AS $$
BEGIN
    IF target_role NOT IN ('admin', 'dono', 'profissional', 'cliente') THEN
        RAISE EXCEPTION 'Papel inválido especificado.';
    END IF;

    -- Permite atribuição se o chamador for um admin verificado OU se ainda não existir nenhum administrador cadastrado no sistema (bootstrap inicial)
    IF NOT (
        public.is_authenticated_admin()
        OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('admin', 'dono'))
    ) THEN
        RAISE EXCEPTION 'Acesso negado para atribuição de papéis.';
    END IF;

    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (target_user_id, target_role, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- PERMISSÕES DE EXECUÇÃO
REVOKE EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_authenticated_professional() TO authenticated, service_role;

-- ==============================================================================
-- 5. TRIGGER DE IMUTABILIDADE PARA CONTEÚDO E DADOS DE MENSAGENS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_chat_message_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Impede alteração de conversa, remetente, destinatário, papel ou conteúdo da mensagem
    IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR
       NEW.sender_id IS DISTINCT FROM OLD.sender_id OR
       NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR
       NEW.content IS DISTINCT FROM OLD.content OR
       NEW.sender_role IS DISTINCT FROM OLD.sender_role THEN
        RAISE EXCEPTION 'Operação inválida: campos estruturais e conteúdo da mensagem são imutáveis.';
    END IF;

    -- Impede a reversão de mensagens já marcadas como 'lida'
    IF OLD.status = 'lida' AND NEW.status != 'lida' THEN
        RAISE EXCEPTION 'Operação inválida: não é permitido reverter o status de uma mensagem já lida.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_chat_message_immutability ON public.chat_messages;
CREATE TRIGGER trg_protect_chat_message_immutability
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_chat_message_immutability();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) RIGOROSO
-- ==============================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Permitir inserção e edição de conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Acesso seguro a conversas" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Leitura_Autorizada" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Escrita_Autorizada" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Select_Policy" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Insert_Policy" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Update_Policy" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversas_Delete_Policy" ON public.chat_conversations;

DROP POLICY IF EXISTS "Permitir leitura de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Permitir inserção e edição de mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Acesso seguro a mensagens" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Leitura_Autorizada" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Escrita_Autorizada" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Select_Policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Insert_Policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Update_Policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Mensagens_Delete_Policy" ON public.chat_messages;

DROP POLICY IF EXISTS "UserRoles_Select_Policy" ON public.user_roles;

-- POLÍTICA PARA TABELA user_roles
CREATE POLICY "UserRoles_Select_Policy" ON public.user_roles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_authenticated_admin())
    );

-- POLÍTICAS PARA TABELA chat_conversations
CREATE POLICY "Conversas_Select_Policy" ON public.chat_conversations
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (
            participant_id = auth.uid()::text
            OR assigned_professional_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
    );

CREATE POLICY "Conversas_Insert_Policy" ON public.chat_conversations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            participant_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
    );

CREATE POLICY "Conversas_Update_Policy" ON public.chat_conversations
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            participant_id = auth.uid()::text
            OR assigned_professional_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            participant_id = auth.uid()::text
            OR assigned_professional_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
    );

CREATE POLICY "Conversas_Delete_Policy" ON public.chat_conversations
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND public.is_authenticated_admin()
    );

-- POLÍTICAS PARA TABELA chat_messages

CREATE POLICY "Mensagens_Select_Policy" ON public.chat_messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (
                c.participant_id = auth.uid()::text
                OR c.assigned_professional_id = auth.uid()::text
                OR public.is_authenticated_admin()
            )
        )
    );

CREATE POLICY "Mensagens_Insert_Policy" ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND conversation_id IS NOT NULL
        AND sender_id = auth.uid()::text
        AND (
            (
                sender_role IN ('cliente', 'profissional') 
                AND EXISTS (
                    SELECT 1 FROM public.user_roles r 
                    WHERE r.user_id = auth.uid() 
                    AND r.role = chat_messages.sender_role
                )
            )
            OR (
                sender_role IN ('admin', 'dono') 
                AND public.is_authenticated_admin()
            )
        )
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (
                c.participant_id = auth.uid()::text
                OR c.assigned_professional_id = auth.uid()::text
                OR public.is_authenticated_admin()
            )
        )
    );

-- UPDATE DE MENSAGENS: Valida permissão de alteração de status ('entregue', 'lida')
CREATE POLICY "Mensagens_Update_Policy" ON public.chat_messages
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (
                c.participant_id = auth.uid()::text
                OR c.assigned_professional_id = auth.uid()::text
                OR public.is_authenticated_admin()
            )
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND status IN ('enviada', 'entregue', 'lida')
    );

CREATE POLICY "Mensagens_Delete_Policy" ON public.chat_messages
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND public.is_authenticated_admin()
    );

-- ==============================================================================
-- 7. HABILITAR REPLICAÇÃO EM TEMPO REAL (SUPABASE REALTIME)
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
