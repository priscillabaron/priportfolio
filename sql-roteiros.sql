-- ============================================================================
-- ABA "ROTEIROS" (transcrição de vídeos) e CONFIGURAÇÕES
-- Cole tudo isto no SQL Editor do Supabase e clique em Run.
-- Pode rodar mais de uma vez: não apaga nada que já existe.
-- ============================================================================

-- Biblioteca de roteiros transcritos
create table if not exists public.roteiros (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  fonte       text,                          -- instagram, tiktok, youtube ou manual
  url         text,
  perfil      text,
  de_quem     text default 'outra',          -- minha ou outra
  titulo      text,
  transcricao text,
  legenda     text,
  postado_em  date,
  tags        text[] default '{}',
  obs         text,
  status      text default 'pronto',         -- processando, pronto ou falhou
  erro        text,
  segmentos   jsonb
);

-- Configurações do painel (guarda a chave da Supadata)
create table if not exists public.configuracoes (
  chave       text primary key,
  valor       text,
  updated_at  timestamptz not null default now()
);

-- Capa do vídeo (imagem pequena guardada junto do roteiro)
alter table public.roteiros add column if not exists capa text;

create index if not exists roteiros_created_at_idx on public.roteiros (created_at desc);

-- Só quem está logada lê e escreve. Nada para visitantes (anon).
alter table public.roteiros enable row level security;
alter table public.configuracoes enable row level security;

drop policy if exists "logada le roteiros" on public.roteiros;
drop policy if exists "logada cria roteiros" on public.roteiros;
drop policy if exists "logada edita roteiros" on public.roteiros;
drop policy if exists "logada apaga roteiros" on public.roteiros;
create policy "logada le roteiros"    on public.roteiros for select to authenticated using (true);
create policy "logada cria roteiros"  on public.roteiros for insert to authenticated with check (true);
create policy "logada edita roteiros" on public.roteiros for update to authenticated using (true) with check (true);
create policy "logada apaga roteiros" on public.roteiros for delete to authenticated using (true);

drop policy if exists "logada le configuracoes" on public.configuracoes;
drop policy if exists "logada cria configuracoes" on public.configuracoes;
drop policy if exists "logada edita configuracoes" on public.configuracoes;
drop policy if exists "logada apaga configuracoes" on public.configuracoes;
create policy "logada le configuracoes"    on public.configuracoes for select to authenticated using (true);
create policy "logada cria configuracoes"  on public.configuracoes for insert to authenticated with check (true);
create policy "logada edita configuracoes" on public.configuracoes for update to authenticated using (true) with check (true);
create policy "logada apaga configuracoes" on public.configuracoes for delete to authenticated using (true);

-- Avisa a API do Supabase que as tabelas novas existem
notify pgrst, 'reload schema';
