-- ==============================================================================
-- SALÃO LUXE - MIGRATION SQL SUPABASE COMPLETA, HARDENED E IDEMPOTENTE
-- PROJETO SUPABASE: dxbbnoxwhxsmfjkyxfir
-- URL: https://dxbbnoxwhxsmfjkyxfir.supabase.co
-- ==============================================================================

-- 1. TABELA DE ROLES DO SERVIDOR (public.user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'dono', 'profissional', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONVERSAS DO CHAT (public.chat_conversations)
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

-- 3. TABELA DE MENSAGENS DO CHAT (public.chat_messages)
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

-- 4. TABELA DE CLIENTES (public.clients)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    photo_url TEXT,
    birth_date DATE,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado')),
    has_portal_access BOOLEAN DEFAULT FALSE,
    password TEXT,
    last_login_at TIMESTAMPTZ,
    notes TEXT,
    preferences TEXT,
    allergies TEXT,
    favorite_service_ids JSONB DEFAULT '[]'::jsonb,
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    last_visit DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE PROFISSIONAIS (public.professionals)
CREATE TABLE IF NOT EXISTS public.professionals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialties JSONB DEFAULT '[]'::jsonb,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias')),
    commission_rate NUMERIC(5,2) DEFAULT 30.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE AGENDAMENTOS (public.appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    professional_id TEXT NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    professional_name TEXT NOT NULL,
    service_ids JSONB DEFAULT '[]'::jsonb,
    service_names JSONB DEFAULT '[]'::jsonb,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_duration INTEGER NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'confirmado', 'em_atendimento', 'concluido', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE PRODUTOS / ESTOQUE (public.products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL CHECK (category IN ('shampoo', 'condicionador', 'mascara', 'oleo', 'coloracao', 'finalizador', 'outros')),
    sku TEXT UNIQUE,
    barcode TEXT,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER DEFAULT 5 CHECK (min_quantity >= 0),
    cost_price NUMERIC(10,2) DEFAULT 0.00,
    sale_price NUMERIC(10,2) DEFAULT 0.00,
    unit TEXT DEFAULT 'unidade',
    supplier TEXT,
    photo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE TRANSAÇÕES FINANCEIRAS (public.financial_transactions)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro')),
    status TEXT DEFAULT 'concluido' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
    client_id TEXT,
    professional_id TEXT,
    invoice_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE SERVIÇOS DO SALÃO (public.services)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE PERFORMANCE E CONSULTAS
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_recipient ON public.chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_id ON public.chat_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_prof ON public.chat_conversations(assigned_professional_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);

-- ==============================================================================
-- FUNÇÕES DE SEGURANÇA E AUXILIARES COM search_path SEGURO
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

    IF NOT public.is_authenticated_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores autenticados ou a chave service_role podem atribuir papéis.';
    END IF;

    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (target_user_id, target_role, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Atribuição automática do papel 'cliente' ao registrar novo usuário em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'cliente', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- REVOGAÇÃO DE PERMISSÕES PÚBLICAS/ANON
REVOKE EXECUTE ON FUNCTION public.is_authenticated_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_authenticated_professional() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_authenticated_professional() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- TRIGGER EM auth.users
DROP TRIGGER IF EXISTS trg_on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER trg_on_auth_user_created_assign_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- ==============================================================================
-- TRIGGERS DE PROTEÇÃO DE IMUTABILIDADE DO CHAT
-- ==============================================================================

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

-- ==============================================================================
-- PERMISSÕES DE TABELAS (GRANT) E ROW LEVEL SECURITY (RLS)
-- ==============================================================================

REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.chat_conversations FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.chat_messages FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professionals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_transactions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS DA TABELA user_roles
DROP POLICY IF EXISTS "UserRoles_Select_Policy" ON public.user_roles;
CREATE POLICY "UserRoles_Select_Policy" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_authenticated_admin()));

-- POLÍTICAS RLS DO CHAT
DROP POLICY IF EXISTS "Conversas_Select_Policy" ON public.chat_conversations;
CREATE POLICY "Conversas_Select_Policy" ON public.chat_conversations
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND (participant_id = auth.uid()::text OR assigned_professional_id = auth.uid()::text OR public.is_authenticated_admin())
    );

DROP POLICY IF EXISTS "Conversas_Insert_Policy" ON public.chat_conversations;
CREATE POLICY "Conversas_Insert_Policy" ON public.chat_conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (participant_id = auth.uid()::text OR public.is_authenticated_admin())
    );

DROP POLICY IF EXISTS "Conversas_Update_Policy" ON public.chat_conversations;
CREATE POLICY "Conversas_Update_Policy" ON public.chat_conversations
    FOR UPDATE TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND (participant_id = auth.uid()::text OR assigned_professional_id = auth.uid()::text OR public.is_authenticated_admin())
    );

DROP POLICY IF EXISTS "Mensagens_Select_Policy" ON public.chat_messages;
CREATE POLICY "Mensagens_Select_Policy" ON public.chat_messages
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (c.participant_id = auth.uid()::text OR c.assigned_professional_id = auth.uid()::text OR public.is_authenticated_admin())
        )
    );

DROP POLICY IF EXISTS "Mensagens_Insert_Policy" ON public.chat_messages;
CREATE POLICY "Mensagens_Insert_Policy" ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND conversation_id IS NOT NULL
        AND sender_id = auth.uid()::text
        AND sender_id <> recipient_id
        AND (
            (sender_role IN ('cliente', 'profissional') AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = chat_messages.sender_role))
            OR (sender_role IN ('admin', 'dono') AND public.is_authenticated_admin())
        )
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations c
            WHERE c.id = chat_messages.conversation_id
            AND (c.participant_id = auth.uid()::text OR c.assigned_professional_id = auth.uid()::text OR public.is_authenticated_admin())
            AND (
                chat_messages.recipient_id = c.participant_id
                OR (c.assigned_professional_id IS NOT NULL AND chat_messages.recipient_id = c.assigned_professional_id)
                OR chat_messages.recipient_id IN ('admin-luxe', 'dono-luxe')
                OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id::text = chat_messages.recipient_id AND ur.role IN ('admin', 'dono'))
            )
        )
    );

-- POLÍTICAS RLS DOS MÓDULOS GERAIS (Clientes, Profissionais, Agendamentos, Estoque, Financeiro)
DROP POLICY IF EXISTS "Clients_Select_Policy" ON public.clients;
CREATE POLICY "Clients_Select_Policy" ON public.clients FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Clients_Manage_Policy" ON public.clients;
CREATE POLICY "Clients_Manage_Policy" ON public.clients FOR ALL TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

DROP POLICY IF EXISTS "Professionals_Select_Policy" ON public.professionals;
CREATE POLICY "Professionals_Select_Policy" ON public.professionals FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Professionals_Manage_Policy" ON public.professionals;
CREATE POLICY "Professionals_Manage_Policy" ON public.professionals FOR ALL TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

DROP POLICY IF EXISTS "Appointments_Select_Policy" ON public.appointments;
CREATE POLICY "Appointments_Select_Policy" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Appointments_Manage_Policy" ON public.appointments;
CREATE POLICY "Appointments_Manage_Policy" ON public.appointments FOR ALL TO authenticated USING (public.is_authenticated_professional()) WITH CHECK (public.is_authenticated_professional());

DROP POLICY IF EXISTS "Products_Select_Policy" ON public.products;
CREATE POLICY "Products_Select_Policy" ON public.products FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Products_Manage_Policy" ON public.products;
CREATE POLICY "Products_Manage_Policy" ON public.products FOR ALL TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

DROP POLICY IF EXISTS "Financial_Select_Policy" ON public.financial_transactions;
CREATE POLICY "Financial_Select_Policy" ON public.financial_transactions FOR SELECT TO authenticated USING (public.is_authenticated_admin());
DROP POLICY IF EXISTS "Financial_Manage_Policy" ON public.financial_transactions;
CREATE POLICY "Financial_Manage_Policy" ON public.financial_transactions FOR ALL TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

DROP POLICY IF EXISTS "Services_Select_Policy" ON public.services;
CREATE POLICY "Services_Select_Policy" ON public.services FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Services_Manage_Policy" ON public.services;
CREATE POLICY "Services_Manage_Policy" ON public.services FOR ALL TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

-- REPLICAÇÃO EM TEMPO REAL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
END $$;

-- ==============================================================================
-- BUCKET DE ARMAZENAMENTO DE ÁUDIO (storage.buckets & storage.objects RLS)
-- PROJETO SUPABASE: dxbbnoxwhxsmfjkyxfir
-- ==============================================================================

-- 1. Criação / Configuração Idempotente do Bucket 'chat-audios'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-audios',
    'chat-audios',
    true,
    15728640,
    ARRAY['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/mpeg'];

-- 2. Habilitação de RLS em storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política de Leitura Pública/Autenticada para Áudios do Chat
DROP POLICY IF EXISTS "ChatAudios_Select_Policy" ON storage.objects;
CREATE POLICY "ChatAudios_Select_Policy" ON storage.objects
    FOR SELECT TO authenticated, anon
    USING (bucket_id = 'chat-audios');

-- 4. Política de Inserção Restrita aos Usuários Autenticados
DROP POLICY IF EXISTS "ChatAudios_Insert_Policy" ON storage.objects;
CREATE POLICY "ChatAudios_Insert_Policy" ON storage.objects
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        bucket_id = 'chat-audios'
    );

-- 5. Política de Exclusão Restrita ao Proprietário do Arquivo ou Admin
DROP POLICY IF EXISTS "ChatAudios_Delete_Policy" ON storage.objects;
CREATE POLICY "ChatAudios_Delete_Policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'chat-audios'
        AND (owner = auth.uid() OR public.is_authenticated_admin())
    );

