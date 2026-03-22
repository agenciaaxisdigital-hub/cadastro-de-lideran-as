
-- Tabela de usuarios do app
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome varchar(255) NOT NULL,
  tipo varchar(20) NOT NULL DEFAULT 'agente' CHECK (tipo IN ('admin', 'agente')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver usuarios (para selects de agentes etc)
CREATE POLICY "Autenticados veem usuarios" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

-- Apenas o próprio usuário ou admin pode atualizar
CREATE POLICY "Usuario atualiza proprio perfil" ON public.usuarios
  FOR UPDATE TO authenticated 
  USING (auth_user_id = auth.uid());

-- Admin pode inserir usuarios
CREATE POLICY "Admin insere usuarios" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Tabela pessoas
CREATE TABLE public.pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf varchar(11) UNIQUE,
  nome varchar(255) NOT NULL,
  telefone varchar(20),
  whatsapp varchar(20),
  email varchar(255),
  instagram varchar(100),
  facebook varchar(100),
  titulo_eleitor varchar(20),
  zona_eleitoral varchar(10),
  secao_eleitoral varchar(10),
  municipio_eleitoral varchar(100),
  uf_eleitoral varchar(2),
  colegio_eleitoral varchar(255),
  endereco_colegio text,
  situacao_titulo varchar(30),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem pessoas" ON public.pessoas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados inserem pessoas" ON public.pessoas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados atualizam pessoas" ON public.pessoas
  FOR UPDATE TO authenticated USING (true);

-- Tabela liderancas
CREATE TABLE public.liderancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tipo_lideranca varchar(50),
  nivel varchar(30),
  regiao_atuacao text,
  zona_atuacao varchar(10),
  bairros_influencia text,
  comunidades_influencia text,
  lider_principal_id uuid REFERENCES public.liderancas(id),
  origem_captacao varchar(50),
  apoiadores_estimados integer,
  meta_votos integer,
  status varchar(30) NOT NULL DEFAULT 'Ativa',
  nivel_comprometimento varchar(20),
  observacoes text,
  cadastrado_por uuid REFERENCES public.usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.liderancas ENABLE ROW LEVEL SECURITY;

-- Função helper para pegar o usuario.id do auth.uid()
CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- Função helper para checar se é admin
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE auth_user_id = auth.uid() AND tipo = 'admin'
  )
$$;

-- Admin vê todas, agente vê apenas as dele
CREATE POLICY "Ver liderancas" ON public.liderancas
  FOR SELECT TO authenticated
  USING (
    public.is_app_admin() OR cadastrado_por = public.get_usuario_id()
  );

CREATE POLICY "Inserir liderancas" ON public.liderancas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Atualizar liderancas" ON public.liderancas
  FOR UPDATE TO authenticated
  USING (
    public.is_app_admin() OR cadastrado_por = public.get_usuario_id()
  );

CREATE POLICY "Admin deleta liderancas" ON public.liderancas
  FOR DELETE TO authenticated
  USING (public.is_app_admin());
