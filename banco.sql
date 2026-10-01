-- ============================================================================
-- BANCO DE DADOS DO PAINEL DA PRISCILLA
-- ============================================================================
-- Como usar: entre no seu projeto em supabase.com, vá no menu "SQL Editor",
-- clique em "New query", cole este arquivo inteiro e clique em "Run".
-- Pode rodar de novo sem medo: os comandos "if not exists" evitam duplicar.
-- ============================================================================

-- Liga a extensão que gera códigos únicos (uuid) para cada linha nova.
create extension if not exists "pgcrypto";


-- ============================================================================
-- TABELA: videos
-- Os vídeos que aparecem no portfólio (destaques + trabalhos por nicho).
-- ============================================================================
create table if not exists public.videos (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  link       text,                 -- link do vídeo (Instagram, TikTok, YouTube)
  nicho      text,                 -- categoria usada no filtro do site
  formato    text,                 -- ex: "9:16" ou "4:5", aparece como legenda da capa
  marca      text,                 -- nome do cliente desse vídeo
  destaque   text,                 -- ex: "2,4M views". Se preenchido, o vídeo também
                                    -- aparece na faixa "Conteúdos de destaque"
  ordem      integer not null default 0,   -- define a posição no site
  visivel    boolean not null default true, -- oculta sem apagar
  criado_em  timestamptz not null default now()
);

-- Uma linha de exemplo, só pra você ver o formato. Pode apagar quando quiser.
insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem, visivel)
select 'Exemplo: apague esta linha', '#', 'Exemplo', '9:16', 'Marca Exemplo', '+000K', 0, true
where not exists (select 1 from public.videos);


-- ============================================================================
-- TABELA: marcas
-- Sua base de contatos de empresas (CRM simples).
-- ============================================================================
create table if not exists public.marcas (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  contato_nome    text,     -- nome da pessoa com quem você conversou nessa marca
  pais            text,     -- país da marca ou da pessoa de contato
  nicho           text,     -- nicho da marca (ex: beleza, casa, pet)
  instagram       text,
  email           text,
  telefone        text,
  situacao        text not null default 'lead'
                    check (situacao in ('lead', 'conversando', 'cliente', 'parada')),
  obs             text,
  ultimo_contato  date,
  criado_em       timestamptz not null default now()
);

-- Caso a tabela já exista de uma vez anterior, isso adiciona as duas colunas
-- novas sem apagar nada do que já está cadastrado.
alter table public.marcas add column if not exists contato_nome text;
alter table public.marcas add column if not exists pais text;
alter table public.marcas add column if not exists nicho text;

insert into public.marcas (nome, instagram, email, situacao, obs)
select 'Exemplo: apague esta linha', '@exemplo', 'exemplo@email.com', 'lead', 'Contato de exemplo'
where not exists (select 1 from public.marcas);


-- ============================================================================
-- TABELA: calendario
-- Sua agenda de gravar, editar e postar.
-- ============================================================================
create table if not exists public.calendario (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  marca      text,
  tipo       text not null default 'gravar'
               check (tipo in ('gravar', 'editar', 'postar')),
  data       date not null,
  status     text not null default 'a_fazer'
               check (status in ('a_fazer', 'feito')),
  criado_em  timestamptz not null default now()
);

insert into public.calendario (titulo, marca, tipo, data, status)
select 'Exemplo: apague esta linha', 'Marca Exemplo', 'gravar', current_date, 'a_fazer'
where not exists (select 1 from public.calendario);


-- ============================================================================
-- TABELA: campanhas
-- O funil comercial: da negociação até a entrega e o pagamento.
-- ============================================================================
create table if not exists public.campanhas (
  id         uuid primary key default gen_random_uuid(),
  campanha   text not null,
  cliente    text,
  tipo       text not null default 'Conteúdo'
               check (tipo in ('Conteúdo', 'Publicidade')),
  status     text not null default 'Briefing'
               check (status in (
                 'Briefing', 'Roteiro', 'Aprovação Roteiro',
                 'Gravação', 'Edição', 'Aprovado', 'Entregue'
               )),
  qtd        integer not null default 1,
  valor      numeric(10,2) not null default 0,
  prazo      date,
  pagamento  text not null default 'pendente'
               check (pagamento in ('pendente', 'pago')),
  ativa      boolean not null default true,
  favorita   boolean not null default false,
  criado_em  timestamptz not null default now()
);

insert into public.campanhas (campanha, cliente, tipo, status, qtd, valor, prazo, pagamento, ativa, favorita)
select 'Exemplo: apague esta linha', 'Marca Exemplo', 'Conteúdo', 'Briefing', 1, 0, current_date + 7, 'pendente', true, false
where not exists (select 1 from public.campanhas);


-- ============================================================================
-- TABELA: marcados
-- Guarda quais itens do checklist do portfólio você já marcou como feito.
-- Cada item vira uma "chave" de texto (ex: "capa-0"). Existe = marcado.
-- ============================================================================
create table if not exists public.marcados (
  chave       text primary key,
  marcado_em  timestamptz not null default now()
);


-- ============================================================================
-- TABELA: visitas
-- Um registro simples toda vez que alguém abre o seu portfólio.
-- ============================================================================
create table if not exists public.visitas (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  pagina     text,     -- qual página foi visitada
  origem     text      -- de onde a pessoa veio (Instagram, Google, direto etc.)
);


-- ============================================================================
-- SEGURANÇA (RLS = Row Level Security)
-- Liga a trava em TODAS as tabelas. A partir daqui, por padrão, NINGUÉM lê
-- nem escreve nada. Cada linha abaixo abre uma porta específica.
-- ============================================================================
alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;

-- Apaga políticas antigas com o mesmo nome, caso você rode este arquivo de novo.
drop policy if exists "dona le videos"        on public.videos;
drop policy if exists "dona escreve videos"   on public.videos;
drop policy if exists "publico le videos visiveis" on public.videos;
drop policy if exists "dona le marcas"        on public.marcas;
drop policy if exists "dona escreve marcas"   on public.marcas;
drop policy if exists "publico insere marcas" on public.marcas;
drop policy if exists "dona le calendario"      on public.calendario;
drop policy if exists "dona escreve calendario" on public.calendario;
drop policy if exists "dona le campanhas"      on public.campanhas;
drop policy if exists "dona escreve campanhas" on public.campanhas;
drop policy if exists "dona le marcados"      on public.marcados;
drop policy if exists "dona escreve marcados" on public.marcados;
drop policy if exists "dona le visitas"       on public.visitas;
drop policy if exists "publico insere visitas" on public.visitas;

-- ---- videos ----------------------------------------------------------------
-- Você (logada) pode ler e escrever tudo.
create policy "dona le videos" on public.videos
  for select using (auth.role() = 'authenticated');
create policy "dona escreve videos" on public.videos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- Exceção necessária: o site público precisa mostrar os vídeos visíveis
-- pra qualquer visitante, mesmo sem login.
create policy "publico le videos visiveis" on public.videos
  for select using (visivel = true);

-- ---- marcas ------------------------------------------------------------
create policy "dona le marcas" on public.marcas
  for select using (auth.role() = 'authenticated');
create policy "dona escreve marcas" on public.marcas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- Exceção pedida: o formulário de contato do site pode inserir um lead novo.
create policy "publico insere marcas" on public.marcas
  for insert with check (situacao = 'lead');

-- ---- calendario --------------------------------------------------------
create policy "dona le calendario" on public.calendario
  for select using (auth.role() = 'authenticated');
create policy "dona escreve calendario" on public.calendario
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- campanhas -----------------------------------------------------------
create policy "dona le campanhas" on public.campanhas
  for select using (auth.role() = 'authenticated');
create policy "dona escreve campanhas" on public.campanhas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- marcados ------------------------------------------------------------
create policy "dona le marcados" on public.marcados
  for select using (auth.role() = 'authenticated');
create policy "dona escreve marcados" on public.marcados
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- visitas -------------------------------------------------------------
create policy "dona le visitas" on public.visitas
  for select using (auth.role() = 'authenticated');
-- Exceção pedida: qualquer visita do site pode ser registrada por qualquer um.
create policy "publico insere visitas" on public.visitas
  for insert with check (true);


-- ============================================================================
-- FIM. Depois de rodar este arquivo, crie o seu usuário de login em:
-- Supabase > Authentication > Users > Add user (veja o passo a passo que
-- te mandei fora deste arquivo).
-- ============================================================================
