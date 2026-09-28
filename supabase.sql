-- Estrutura esperada pelo site
-- Sua tabela Registros já existe. Este arquivo serve para conferir tipos e
-- configurar RLS/policies para a chave pública (anon).

-- IMPORTANTE:
-- O site usa a chave anon/public. NÃO coloque senha do Postgres nem service_role key no frontend.

-- Se a tabela Registros ainda não tiver RLS habilitado:
-- alter table public."Registros" enable row level security;

-- Para um site pessoal sem login, estas policies permitem leitura/inserção/exclusão
-- pública. Só use este modelo se você realmente quer que qualquer pessoa com o site
-- possa alterar os registros. Para acesso privado, recomendo Supabase Auth + user_id.

-- create policy "registros_select_public"
-- on public."Registros" for select to anon using (true);

-- create policy "registros_insert_public"
-- on public."Registros" for insert to anon with check (true);

-- create policy "registros_delete_public"
-- on public."Registros" for delete to anon using (true);
