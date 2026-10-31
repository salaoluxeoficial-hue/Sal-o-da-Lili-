-- ==============================================================================
-- SALÃO LUXE - ESQUEMA SQL SUPABASE HARDENED COM TRIGGERS DE PROTEÇÃO & RLS ESTRITO
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

-- Procedimento exclusivo de atribuição de papéis (Exige perfil admin autenticado ou service_role)
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    target_role TEXT
)
RETURNS VOID AS $$
BEGIN
    IF target_role NOT IN ('admin', 'dono', 'profissional', 'cliente') THEN
        RAISE EXCEPTION 'Papel inválido especificado.';
    END IF;

    -- Exige estritamente perfil de administrador verificado ou chave service_role do servidor
    IF NOT public.is_authenticated_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores autenticados ou a chave service_role podem atribuir papéis.';
    END IF;

    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (target_user_id, target_role, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- REVOGAÇÃO DE PERMISSÕES PÚBLICAS/ANON E CONCESSÃO RESTRITA PARA FUNÇÕES
REVOKE EXECUTE ON FUNCTION public.is_authenticated_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_authenticated_professional() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_authenticated_professional() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated, service_role;

-- ==============================================================================
-- 5. TRIGGERS DE PROTEÇÃO DE ESTRUTURA, IDENTIFICAÇÃO E IMUTABILIDADE
-- ==============================================================================

-- A) Trigger para Tabela chat_conversations:
-- Protege dados estruturais, de atribuição e de identificação do participante (nome, telefone, whatsapp, email, foto, descrição)
-- contra alterações por usuários não-administradores, mantendo liberadas apenas atualizações de atendimento (last_message, unread_counts, is_online, updated_at).
CREATE OR REPLACE FUNCTION public.protect_chat_conversation_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_authenticated_admin() THEN
        IF NEW.id IS DISTINCT FROM OLD.id OR
           NEW.type IS DISTINCT FROM OLD.type OR
           NEW.participant_id IS DISTINCT FROM OLD.participant_id OR
           NEW.participant_name IS DISTINCT FROM OLD.participant_name OR
           NEW.participant_phone IS DISTINCT FROM OLD.participant_phone OR
           NEW.participant_whatsapp IS DISTINCT FROM OLD.participant_whatsapp OR
           NEW.participant_email IS DISTINCT FROM OLD.participant_email OR
           NEW.participant_photo_url IS DISTINCT FROM OLD.participant_photo_url OR
           NEW.participant_role_description IS DISTINCT FROM OLD.participant_role_description OR
           NEW.assigned_type IS DISTINCT FROM OLD.assigned_type OR
           NEW.assigned_professional_id IS DISTINCT FROM OLD.assigned_professional_id OR
           NEW.assigned_professional_name IS DISTINCT FROM OLD.assigned_professional_name OR
           NEW.taken_over_by_admin IS DISTINCT FROM OLD.taken_over_by_admin OR
           NEW.taken_over_by_role IS DISTINCT FROM OLD.taken_over_by_role OR
           NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Operação negada: Apenas a administração do Salão Luxe pode alterar atribuições e dados de identificação da conversa.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_chat_conversation_immutability ON public.chat_conversations;
CREATE TRIGGER trg_protect_chat_conversation_immutability
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_chat_conversation_immutability();

-- B) Trigger para Tabela chat_messages:
-- Garante imutabilidade total de conteúdo, autoria, destinatário e data, permitindo apenas avanços de status sem retrocesso.
CREATE OR REPLACE FUNCTION public.protect_chat_message_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id OR
       NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR
       NEW.sender_id IS DISTINCT FROM OLD.sender_id OR
       NEW.sender_name IS DISTINCT FROM OLD.sender_name OR
       NEW.sender_role IS DISTINCT FROM OLD.sender_role OR
       NEW.sender_photo_url IS DISTINCT FROM OLD.sender_photo_url OR
       NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR
       NEW.content IS DISTINCT FROM OLD.content OR
       NEW.attachment IS DISTINCT FROM OLD.attachment OR
       NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Operação inválida: os campos estruturais, de autoria, conteúdo e data das mensagens são estritamente imutáveis.';
    END IF;

    IF OLD.status = 'lida' AND NEW.status != 'lida' THEN
        RAISE EXCEPTION 'Operação inválida: não é permitido alterar o status de uma mensagem já marcada como lida.';
    END IF;

    IF OLD.status = 'entregue' AND NEW.status = 'enviada' THEN
        RAISE EXCEPTION 'Operação inválida: não é permitido retroceder o status de entregue para enviada.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_chat_message_immutability ON public.chat_messages;
CREATE TRIGGER trg_protect_chat_message_immutability
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_chat_message_immutability();

REVOKE EXECUTE ON FUNCTION public.protect_chat_conversation_immutability() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_chat_message_immutability() FROM PUBLIC, anon;

-- ==============================================================================
-- 6. PERMISSÕES DE TABELAS (GRANT) E ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Revogar permissões públicas/anônimas em nível de tabela
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.chat_conversations FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.chat_messages FROM PUBLIC, anon;

-- Conceder permissões para os papéis autenticados e service_role (geridos via RLS)
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Limpeza idempotente de políticas anteriores
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

-- INSERT DE MENSAGENS: Valida remetente, destinatário autorizado da conversa e impede envio para o próprio remetente ou externos
CREATE POLICY "Mensagens_Insert_Policy" ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND conversation_id IS NOT NULL
        AND sender_id = auth.uid()::text
        AND sender_id <> recipient_id
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
            -- Valida se o recipient_id corresponde ao participante autorizado da conversa ou canal administrativo legítimo
            AND (
                chat_messages.recipient_id = c.participant_id
                OR (c.assigned_professional_id IS NOT NULL AND chat_messages.recipient_id = c.assigned_professional_id)
                OR chat_messages.recipient_id IN ('admin-luxe', 'dono-luxe')
                OR EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id::text = chat_messages.recipient_id
                    AND ur.role IN ('admin', 'dono')
                )
            )
        )
    );

-- UPDATE DE MENSAGENS: Apenas o DESTINATÁRIO AUTENTICADO ou ADMINISTRADOR pode alterar o status de leitura
CREATE POLICY "Mensagens_Update_Policy" ON public.chat_messages
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            recipient_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            recipient_id = auth.uid()::text
            OR public.is_authenticated_admin()
        )
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
