-- ============================================================================
-- DISPARO DE E-MAILS (aba Prospecção)
-- ============================================================================
-- Onde colar: supabase.com > seu projeto > SQL Editor > New query > cole este
-- arquivo inteiro > Run.
-- Pode rodar mais de uma vez sem medo: nada do que já existe é apagado.
-- ============================================================================


-- ============================================================================
-- 1) DUAS COLUNAS NOVAS NA TABELA "marcas"
-- ============================================================================
-- selecionada: a seleção que você faz na aba Marcas fica salva aqui, então você
--              marca hoje e dispara amanhã sem perder nada.
-- prospeccao_enviada_em: a data em que o e-mail de apresentação foi enviado.
alter table public.marcas add column if not exists selecionada boolean not null default false;
alter table public.marcas add column if not exists prospeccao_enviada_em date;


-- ============================================================================
-- 2) TABELA "email_envios": o registro de tudo que foi enviado
-- ============================================================================
-- Uma linha por destinatário. Se um disparo parar no meio, é aqui que você
-- descobre quem recebeu e quem não recebeu.
create table if not exists public.email_envios (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,          -- para quem foi
  assunto         text,                   -- assunto final, já com o nome da marca
  assunto_modelo  text,                   -- assunto como você escreveu, com {{nome}}
                                          -- (serve para "pular quem já recebeu")
  status          text not null check (status in ('ok', 'erro')),
  erro            text,                   -- o motivo, quando deu errado
  resend_id       text,                   -- id que o Resend devolve
                                          -- ("rascunho" quando foi enviado pelo Gmail)
  criado_em       timestamptz not null default now()
);

create index if not exists email_envios_email_idx   on public.email_envios (lower(email));
create index if not exists email_envios_modelo_idx  on public.email_envios (assunto_modelo, status);
create index if not exists email_envios_criado_idx  on public.email_envios (criado_em desc);


-- ============================================================================
-- 3) TABELA "email_optout": quem pediu pra não receber mais
-- ============================================================================
-- Quem está aqui nunca mais recebe, em nenhum disparo futuro.
create table if not exists public.email_optout (
  email      text primary key check (email = lower(email)),
  criado_em  timestamptz not null default now()
);


-- ============================================================================
-- 4) SEGURANÇA (RLS): só você, logada, lê e escreve
-- ============================================================================
-- Ninguém deslogado enxerga nada dessas duas tabelas.
alter table public.email_envios enable row level security;
alter table public.email_optout enable row level security;

drop policy if exists "dona total email_envios" on public.email_envios;
drop policy if exists "dona total email_optout" on public.email_optout;

create policy "dona total email_envios" on public.email_envios
  for all
  using      ((auth.jwt() ->> 'email') = 'pribaronparcerias@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'pribaronparcerias@gmail.com');

create policy "dona total email_optout" on public.email_optout
  for all
  using      ((auth.jwt() ->> 'email') = 'pribaronparcerias@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'pribaronparcerias@gmail.com');


-- ============================================================================
-- FIM. Depois de rodar, publique a função enviar-emails (veja o passo a passo).
-- ============================================================================
