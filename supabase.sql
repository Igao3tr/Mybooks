-- Migração para o projeto Minhas Leituras
-- Execute no SQL Editor do Supabase.

-- 1) ISBN deve ser TEXT, não integer.
-- ISBN é um identificador, pode começar com zero e ISBN-13 não cabe em int4.
alter table public."Registros"
  alter column isbn type text using isbn::text;

-- 2) Número de páginas da edição do livro.
alter table public."Registros"
  add column if not exists paginas integer;

-- 3) Status da leitura.
-- Se você preferir criar manualmente pelo painel, use exatamente o nome: status (minúsculo).
alter table public."Registros"
  add column if not exists status text default 'Não iniciado';

-- Valores sugeridos para status:
-- Não iniciado | Lendo | Concluído

-- Se quiser impedir valores diferentes desses três:
-- alter table public."Registros"
--   add constraint registros_status_check
--   check (status in ('Não iniciado', 'Lendo', 'Concluído'));

-- RLS/policies (se ainda não estiverem configuradas):
-- alter table public."Registros" enable row level security;
-- create policy "registros_select_public"
-- on public."Registros" for select to anon using (true);
-- create policy "registros_insert_public"
-- on public."Registros" for insert to anon with check (true);
-- create policy "registros_delete_public"
-- on public."Registros" for delete to anon using (true);
