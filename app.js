import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================================================
// CONFIGURAÇÃO
// Cole aqui a sua chave pública (anon/publishable key) do Supabase.
// NUNCA coloque a senha do banco ou a service_role key neste arquivo.
// ============================================================
const SUPABASE_URL = 'https://mhodxuollvsobxkytasp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QRbjoRaeXckfxDzkSxPwTQ_zDeI0c1q';

const configured = SUPABASE_ANON_KEY !== 'sb_publishable_QRbjoRaeXckfxDzkSxPwTQ_zDeI0c1q';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = { books: [], search: '', filter: 'todos' };
const $ = (s) => document.querySelector(s);

function setConnection(ok, text) {
  $('#connection-dot').className = `status-dot ${ok ? 'ok' : 'error'}`;
  $('#connection-text').textContent = text;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function formatDate(value) {
  if (!value) return '';
  const [y,m,d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function status(book) {
  if (book.data_fim) return ['Concluído', 'finished'];
  if (book.data_inicio) return ['Lendo', 'reading'];
  return ['Não iniciado', ''];
}

function render() {
  const query = state.search.trim().toLowerCase();
  let books = state.books.filter(book => {
    const matchesText = !query || String(book.nome_livro || '').toLowerCase().includes(query) || String(book.isbn || '').includes(query);
    const [label] = status(book);
    const matchesFilter = state.filter === 'todos'
      || (state.filter === 'lendo' && label === 'Lendo')
      || (state.filter === 'concluidos' && label === 'Concluído')
      || (state.filter === 'nao-iniciados' && label === 'Não iniciado');
    return matchesText && matchesFilter;
  });

  $('#total-count').textContent = state.books.length;
  $('#reading-count').textContent = state.books.filter(b => !b.data_fim && b.data_inicio).length;
  $('#finished-count').textContent = state.books.filter(b => b.data_fim).length;

  const container = $('#books');
  container.innerHTML = '';
  $('#empty').classList.toggle('hidden', books.length !== 0);

  for (const book of books) {
    const tpl = $('#book-template').content.cloneNode(true);
    tpl.querySelector('.book-title').textContent = book.nome_livro || 'Sem título';
    tpl.querySelector('.book-meta').textContent = book.isbn ? `ISBN ${book.isbn}` : 'ISBN não informado';
    const [label, cls] = status(book);
    const badge = tpl.querySelector('.status-badge');
    badge.textContent = label;
    if (cls) badge.classList.add(cls);
    const dates = [];
    if (book.data_inicio) dates.push(`início ${formatDate(book.data_inicio)}`);
    if (book.data_fim) dates.push(`fim ${formatDate(book.data_fim)}`);
    tpl.querySelector('.dates').textContent = dates.join(' · ');
    tpl.querySelector('.delete-btn').addEventListener('click', () => removeBook(book.id, book.nome_livro));
    container.appendChild(tpl);
  }
}

async function loadBooks() {
  if (!configured) {
    setConnection(false, 'Configure a anon key');
    render();
    return;
  }

  const { data, error } = await supabase
    .from('Registros')
    .select('id, created_at, nome_livro, isbn, data_inicio, data_fim')
    .order('created_at', { ascending: false });

  if (error) {
    setConnection(false, 'Erro de conexão');
    console.error(error);
    showFormMessage(`Não foi possível carregar os livros: ${error.message}`, true);
    return;
  }

  state.books = data || [];
  setConnection(true, 'Banco conectado');
  render();
}

async function removeBook(id, name) {
  if (!confirm(`Excluir “${name}”?`)) return;
  const { error } = await supabase.from('Registros').delete().eq('id', id);
  if (error) {
    alert(`Não foi possível excluir: ${error.message}`);
    return;
  }
  await loadBooks();
}

function showView(view) {
  const library = view === 'biblioteca';
  $('#biblioteca-view').classList.toggle('active-view', library);
  $('#novo-view').classList.toggle('active-view', !library);
  $('#page-title').textContent = library ? 'Biblioteca' : 'Adicionar livro';
  document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  if (!library) $('#nome_livro').focus();
}

function showFormMessage(message, error = false) {
  const el = $('#form-message');
  el.textContent = message;
  el.className = `form-message ${error ? 'error' : 'ok'}`;
}

$('#search').addEventListener('input', e => { state.search = e.target.value; render(); });
$('#filter').addEventListener('change', e => { state.filter = e.target.value; render(); });
$('#new-book-btn').addEventListener('click', () => showView('novo'));
$('#empty-new-btn').addEventListener('click', () => showView('novo'));
$('#cancel-btn').addEventListener('click', () => { $('#book-form').reset(); showFormMessage(''); showView('biblioteca'); });
document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showView(a.dataset.view); }));

$('#book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showFormMessage('');

  if (!configured) {
    showFormMessage('Primeiro configure a anon key no arquivo app.js.', true);
    return;
  }

  const nome_livro = $('#nome_livro').value.trim();
  const isbnRaw = $('#isbn').value.trim().replace(/[-\s]/g, '');
  const data_inicio = $('#data_inicio').value || null;
  const data_fim = $('#data_fim').value || null;

  if (isbnRaw && !/^\d{10}|\d{13}$/.test(isbnRaw)) {
    showFormMessage('O ISBN deve ter 10 ou 13 números.', true);
    return;
  }
  if (data_inicio && data_fim && data_fim < data_inicio) {
    showFormMessage('A data de término não pode ser anterior à data de início.', true);
    return;
  }

  const btn = $('#save-btn');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const { error } = await supabase.from('Registros').insert({
    nome_livro,
    isbn: isbnRaw ? Number(isbnRaw) : null,
    data_inicio,
    data_fim
  });

  btn.disabled = false;
  btn.textContent = 'Salvar livro';

  if (error) {
    console.error(error);
    showFormMessage(`Erro ao salvar: ${error.message}`, true);
    return;
  }

  $('#book-form').reset();
  showFormMessage('Livro adicionado com sucesso.');
  await loadBooks();
  setTimeout(() => showView('biblioteca'), 350);
});

render();
loadBooks();
