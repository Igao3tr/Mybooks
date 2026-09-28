# Minhas Leituras

Site simples para listar e cadastrar livros usando a tabela `Registros` do seu Supabase.

## 1. Configurar a chave do Supabase

Abra `app.js` e troque:

```js
const SUPABASE_ANON_KEY = 'COLE_SUA_ANON_KEY_AQUI';
```

pela **anon/publishable key** do projeto Supabase.

O projeto já usa:

```text
https://mhodxuollvsobxkytasp.supabase.co
```

**Não coloque** a senha do Postgres, `service_role` key ou outras chaves secretas no navegador.

## 2. Tabela usada

O site lê e grava na tabela `Registros` com as colunas:

- `id`
- `created_at`
- `nome_livro`
- `isbn` (opcional)
- `data_inicio` (opcional)
- `data_fim` (opcional)

A tabela `login` não é usada nesta primeira versão.

## 3. RLS

Se o Supabase bloquear as consultas por causa de Row Level Security, veja `supabase.sql`.

Para um site pessoal sem autenticação, você pode criar policies públicas, mas isso significa que qualquer pessoa que consiga acessar o site poderá consultar/inserir/excluir registros. O modelo mais seguro é adicionar autenticação e vincular `Registros` a um usuário.

## 4. Rodar localmente

Como o projeto usa módulos ES, rode por um servidor local, por exemplo:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

Também pode publicar os três arquivos (`index.html`, `style.css`, `app.js`) em GitHub Pages, Netlify ou Vercel.
