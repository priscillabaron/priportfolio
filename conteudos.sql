-- ============================================================================
-- ABA "CONTEÚDOS" DO PAINEL: ideias de conteúdo e agenda por perfil
-- ============================================================================
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo > Run.
-- Pode rodar de novo sem medo (não apaga nem duplica nada).
-- Só a dona do painel (logada) lê e escreve. Ninguém de fora acessa.
-- ============================================================================

create extension if not exists "pgcrypto";

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
  criado_em      timestamptz not null default now()
);

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

drop policy if exists "dona total conteudos_ideias" on public.conteudos_ideias;
drop policy if exists "dona total conteudos_agenda" on public.conteudos_agenda;

create policy "dona total conteudos_ideias" on public.conteudos_ideias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "dona total conteudos_agenda" on public.conteudos_agenda
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
