-- ============================================================================
-- ABA "CONTEÚDOS" DO PAINEL: ideias de conteúdo e agenda por perfil
-- ============================================================================
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo > Run.
-- Pode rodar de novo sem medo (não apaga nem duplica nada).
-- Só a dona do painel (logada) lê e escreve. Ninguém de fora acessa.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- Projetos (ex.: Inverno Chile 2026) ------------------------------------------
create table if not exists public.conteudos_projetos (
  id         uuid primary key default gen_random_uuid(),
  perfil     text not null check (perfil in ('entracomigo', 'favoritospri', 'ugc')),
  nome       text not null,
  pais       text,                          -- código do país com 2 letras (ex.: CL para Chile)
  criado_em  timestamptz not null default now()
);

-- ---- Ideias de conteúdo --------------------------------------------------------
create table if not exists public.conteudos_ideias (
  id             uuid primary key default gen_random_uuid(),
  perfil         text not null check (perfil in ('entracomigo', 'favoritospri', 'ugc')),
  plataforma     text not null check (plataforma in ('instagram', 'tiktok', 'facebook', 'pinterest')),
  formato        text,                      -- Reels, Carrossel, Foto, Story, Vídeo
  titulo         text not null,
  descricao      text,                      -- roteiro, cenas, falas, gancho
  status         text not null default 'agravar'
                   check (status in ('agravar', 'parcial', 'gravado', 'editado', 'postado')),
  pendente       text,                      -- o que falta, quando o status é "parcial"
  data_postagem  date,                      -- data prevista de postagem
  inspiracao     text,                      -- link de um conteúdo que ela viu
  publi          boolean not null default false,
  marca          text,                      -- se for publicidade
  prazo          date,                      -- prazo de entrega para a marca
  marcar         text,                      -- perfis (@ ou links) das marcas para marcar na postagem
  legenda        text,                      -- legenda pronta para copiar
  links          text,                      -- links para a postagem, stories ou bio
  mensagem       text,                      -- mensagem a ser enviada (marca ou direct)
  criado_em      timestamptz not null default now()
);

-- Se a tabela já existia (versão anterior), isto acrescenta os campos novos sem apagar nada.
alter table public.conteudos_ideias add column if not exists marcar   text;
alter table public.conteudos_ideias add column if not exists legenda  text;
alter table public.conteudos_ideias add column if not exists links    text;
alter table public.conteudos_ideias add column if not exists mensagem text;
-- Série: parte do vídeo dentro de uma série (ex.: 1/2). Vazio = não é série.
alter table public.conteudos_ideias add column if not exists serie text;
-- Ideia que pertence a um projeto (vazio = ideia solta). Apagar o projeto apaga as ideias dele.
alter table public.conteudos_ideias add column if not exists projeto_id uuid references public.conteudos_projetos(id) on delete cascade;

-- ---- Agenda (gravar, postar, publicidade) ---------------------------------------
create table if not exists public.conteudos_agenda (
  id         uuid primary key default gen_random_uuid(),
  perfil     text not null check (perfil in ('entracomigo', 'favoritospri', 'ugc')),
  tipo       text not null check (tipo in ('gravar', 'postar', 'publi')),
  titulo     text,
  data       date not null,
  criado_em  timestamptz not null default now()
);

-- ---- Segurança (RLS): só a dona, logada, lê e escreve ---------------------------
alter table public.conteudos_ideias enable row level security;
alter table public.conteudos_agenda enable row level security;
alter table public.conteudos_projetos enable row level security;

drop policy if exists "dona total conteudos_ideias" on public.conteudos_ideias;
drop policy if exists "dona total conteudos_agenda" on public.conteudos_agenda;
drop policy if exists "dona total conteudos_projetos" on public.conteudos_projetos;

create policy "dona total conteudos_ideias" on public.conteudos_ideias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "dona total conteudos_agenda" on public.conteudos_agenda
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "dona total conteudos_projetos" on public.conteudos_projetos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
