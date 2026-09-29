# Minhas Leituras

Site pessoal de acompanhamento de livros usando Supabase.

## Banco

A tabela `Registros` deve ter pelo menos:

- `id` — bigint/int8, primary key
- `created_at` — timestamptz
- `nome_livro` — text
- `isbn` — **text** (recomendado; ISBN não deve ser armazenado como número)
- `paginas` — integer
- `status` — text, de preferência com default `Não iniciado`
- `data_inicio` — date
- `data_fim` — date

Execute `supabase.sql` para fazer a migração.

## ISBN → páginas

O formulário consulta o Open Library pelo ISBN e tenta preencher automaticamente `paginas`.
A consulta é feita por JSONP (`<script>`), então não depende de `fetch`/CORS para essa busca.

O usuário pode editar manualmente o número de páginas caso a API não encontre a edição ou informe um valor diferente.

## Supabase

No `app.js`, coloque apenas a Publishable/anon key:

```js
const SUPABASE_ANON_KEY = 'SUA_CHAVE';
```

Nunca coloque a senha do PostgreSQL ou a `service_role` key no frontend.

## Executar localmente

Não abra o `index.html` com `file://`. Use um servidor HTTP, por exemplo:

```bash
python -m http.server 5500
```

Depois abra `http://localhost:5500`.
