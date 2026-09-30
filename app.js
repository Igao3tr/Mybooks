import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';


// ============================================================
// CONFIGURAÇÃO
// ============================================================
const SUPABASE_URL = 'https://mhodxuollvsobxkytasp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob2R4dW9sbHZzb2J4a3l0YXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODc4MjcsImV4cCI6MjEwNTU2MzgyN30.QMmPskWOp9MspbtcGjjTTtShJbfY0AZSIb9nVbfEciE'
const configured = SUPABASE_ANON_KEY !== 'COLE_SUA_ANON_KEY_AQUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let dados = "";
const state = {
  books: [],
  search: '',
  filter: 'todos',
  lookupTimer: null
};

const $ = (selector) => document.querySelector(selector);

// ============================================================
// EVENT LISTENER SEGURO
// ============================================================

function on(selector, event, callback) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (element) {
    element.addEventListener(event, callback);
  }
}

// Para vários elementos
function onAll(selector, event, callback) {
  document.querySelectorAll(selector).forEach(element => {
    element.addEventListener(event, callback);
  });
}

// ============================================================
// CONEXÃO
// ============================================================

function setConnection(ok, text) {
  const dot = $('#connection-dot');
  const connectionText = $('#connection-text');

  if (dot) {
    dot.className = `status-dot ${ok ? 'ok' : 'error'}`;
  }

  if (connectionText) {
    connectionText.textContent = text;
  }
}

// ============================================================
// SEGURANÇA
// ============================================================

function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}

// ============================================================
// LOGIN
// ============================================================

async function login(email, senha) {
  const { data, error } = await supabase
    .from('login')
    .select('id,email, senha')
    .eq('email', email)
    .eq('senha', senha)
    .single();

  if (error) {
    console.error('Email ou senha incorretos:', error);

    return {
      sucesso: false,
      mensagem: error.message
    };
  }
 
 localStorage.setItem('dados', JSON.stringify(data));
  

window.location.assign("biblio.html");
console.log('Login realizado',data);

  return {
    sucesso: true,
    usuario: data
  };
}

// ============================================================
// DATAS
// ============================================================

function formatDate(value) {
  if (!value) return '';

  const [y, m, d] = value.split('-');

  if (!y || !m || !d) return value;

  return `${d}/${m}/${y}`;
}

// ============================================================
// STATUS DO LIVRO
// ============================================================

function status(book) {
  if (book.status) {
    const normalized = String(book.status).trim().toLowerCase();

    if (normalized.includes('concl')) {
      return ['Concluído', 'finished'];
    }

    if (
      normalized.includes('lendo') ||
      normalized.includes('andamento')
    ) {
      return ['Lendo', 'reading'];
    }

    return [book.status, ''];
  }

  if (book.data_fim) {
    return ['Concluído', 'finished'];
  }

  if (book.data_inicio) {
    return ['Lendo', 'reading'];
  }

  return ['Não iniciado', ''];
}

// ============================================================
// RENDER
// ============================================================

function render() {
  const query = state.search.trim().toLowerCase();
 
  let books = state.books.filter(book => {
    const matchesText =
      !query ||
      String(book.nome_livro || '')
        .toLowerCase()
        .includes(query) ||
      String(book.isbn || '').includes(query);

    const [label] = status(book);

    const matchesFilter =
      state.filter === 'todos' ||
      (state.filter === 'lendo' && label === 'Lendo') ||
      (state.filter === 'concluidos' && label === 'Concluído') ||
      (state.filter === 'nao-iniciados' && label === 'Não iniciado');

    return matchesText && matchesFilter;
  });

  const totalCount = $('#total-count');
  const readingCount = $('#reading-count');
  const finishedCount = $('#finished-count');
  const container = $('#books');
  const empty = $('#empty');
  const template = $('#book-template');

  if (totalCount) {
    totalCount.textContent = state.books.length;
  }

  if (readingCount) {
    readingCount.textContent = state.books.filter(
      b => !b.data_fim && b.data_inicio
    ).length;
  }

  if (finishedCount) {
    finishedCount.textContent = state.books.filter(
      b => b.data_fim
    ).length;
  }

  if (!container || !template) {
    return;
  }

  container.innerHTML = '';

  if (empty) {
    empty.classList.toggle('hidden', books.length !== 0);
  }

  for (const book of books) {
    const tpl = template.content.cloneNode(true);

    const title = tpl.querySelector('.book-title');
    const metaElement = tpl.querySelector('.book-meta');
    const badge = tpl.querySelector('.status-badge');
    const datesElement = tpl.querySelector('.dates');
    const deleteButton = tpl.querySelector('.delete-btn');
     const editButton = tpl.querySelector('.edit-btn');

    if (title) {
      title.textContent = book.nome_livro || 'Sem título';
    }

    const meta = [];

    if (book.isbn) {
      meta.push(`ISBN ${book.isbn}`);
    }

    if (book.paginas) {
      meta.push(`${book.paginas} páginas`);
    }

    if (metaElement) {
      metaElement.textContent =
        meta.join(' · ') || 'ISBN não informado';
    }

    const [label, cls] = status(book);

    if (badge) {
      badge.textContent = label;

      if (cls) {
        badge.classList.add(cls);
      }
    }

    const dates = [];

    if (book.data_inicio) {
      dates.push(`início ${formatDate(book.data_inicio)}`);
    }

    if (book.data_fim) {
      dates.push(`fim ${formatDate(book.data_fim)}`);
    }

    if (datesElement) {
      datesElement.textContent = dates.join(' · ');
    }

    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        removeBook(book.id, book.nome_livro);
      });
    }
    if (editButton) {
  editButton.addEventListener('click', () => {
    openEditModal(book);
  });
}

    container.appendChild(tpl);
  }
}

// ============================================================
// CARREGAR LIVROS
// ============================================================

async function loadBooks() {
  if (!configured) {
    setConnection(false, 'Configure a anon key');
    render();
    return;
  }
  dados = JSON.parse(localStorage.getItem('dados'))
  let dtid = dados.id
  const { data, error } = await supabase
    .from('Registros')
    .select(
      'id, created_at, nome_livro, isbn, paginas, status, data_inicio, data_fim, usuario'
    )
    .eq('usuario',dtid)
    .order('created_at', { ascending: false });

  if (error) {
    setConnection(false, 'Erro de conexão');

    console.error(error);

    showFormMessage(
      `Não foi possível carregar os livros: ${error.message}`,
      true
    );

    return;
  }

  state.books = data || [];

  setConnection(true, 'Banco conectado');

  render();
}

// ============================================================
// REMOVER LIVRO
// ============================================================

async function removeBook(id, name) {
  if (!confirm(`Excluir “${name}”?`)) {
    return;
  }

  const { error } = await supabase
    .from('Registros')
    .delete()
    .eq('id', id);

  if (error) {
    alert(`Não foi possível excluir: ${error.message}`);
    return;
  }

  await loadBooks();
}

// ============================================================
// TROCAR VIEW
// ============================================================

function showView(view) {
  const bibliotecaView = $('#biblioteca-view');
  const novoView = $('#novo-view');
  const pageTitle = $('#page-title');

  const library = view === 'biblioteca';

  if (bibliotecaView) {
    bibliotecaView.classList.toggle('active-view', library);
  }

  if (novoView) {
    novoView.classList.toggle('active-view', !library);
  }

  if (pageTitle) {
    pageTitle.textContent = library
      ? 'Biblioteca'
      : 'Adicionar livro';
  }

  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle(
      'active',
      a.dataset.view === view
    );
  });

  if (!library) {
    const nomeLivro = $('#nome_livro');

    if (nomeLivro) {
      nomeLivro.focus();
    }
  }
}

// ============================================================
// MENSAGEM DO FORMULÁRIO
// ============================================================

function showFormMessage(message, error = false) {
  const el = $('#form-message');

  if (!el) {
    return;
  }

  el.textContent = message;

  el.className = `form-message ${error ? 'error' : 'ok'}`;
}

// ============================================================
// ISBN
// ============================================================

function normalizeIsbn(value) {
  return String(value || '')
    .replace(/[-\s]/g, '')
    .toUpperCase();
}

function isValidIsbnLength(isbn) {
  return /^(?:\d{10}|\d{13})$/.test(isbn);
}

async function lookupOpenLibrary(isbn) {
  const response = await fetch(
    `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`
  );

  if (response.status === 404) {
    throw new Error(
      'ISBN não encontrado no Open Library.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Erro no Open Library: ${response.status}`
    );
  }

  return await response.json();
}

// ============================================================
// Editar livro
// ============================================================
async function editBook(book) {
  const nomeLivro = prompt(
    'Nome do livro:',
    book.nome_livro || ''
  );

  if (nomeLivro === null) {
    return;
  }

  const isbn = prompt(
    'ISBN:',
    book.isbn || ''
  );

  if (isbn === null) {
    return;
  }

  const paginasInput = prompt(
    'Número de páginas:',
    book.paginas || ''
  );

  if (paginasInput === null) {
    return;
  }

  const paginas = paginasInput
    ? Number(paginasInput)
    : null;

  if (
    paginas !== null &&
    (!Number.isInteger(paginas) || paginas < 1)
  ) {
    alert('O número de páginas deve ser um inteiro maior que zero.');
    return;
  }

  const dataInicio = prompt(
    'Data de início (AAAA-MM-DD):',
    book.data_inicio || ''
  );

  if (dataInicio === null) {
    return;
  }

  const dataFim = prompt(
    'Data de término (AAAA-MM-DD):',
    book.data_fim || ''
  );

  if (dataFim === null) {
    return;
  }

  if (
    dataInicio &&
    dataFim &&
    dataFim < dataInicio
  ) {
    alert(
      'A data de término não pode ser anterior à data de início.'
    );
    return;
  }

  const { error } = await supabase
    .from('Registros')
    .update({
      nome_livro: nomeLivro.trim(),
      isbn: isbn.trim() || null,
      paginas,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null
    })
    .eq('id', book.id);

  if (error) {
    console.error(error);
    alert(`Não foi possível editar o livro: ${error.message}`);
    return;
  }

  await loadBooks();
}



// ============================================================
// BUSCAR PÁGINAS
// ============================================================

async function buscarPaginas() {
  const isbnElement = $('#isbn');
  const btn = $('#lookup-isbn-btn');
  const msg = $('#isbn-message');

  if (!isbnElement) {
    return;
  }

  const isbn = isbnElement.value;

  if (!isbn) {
    if (msg) {
      msg.textContent = 'Digite um ISBN para buscar.';
      msg.className = 'field-message error';
    }

    return;
  }

  if (!isValidIsbnLength(isbn)) {
    if (msg) {
      msg.textContent =
        'O ISBN deve ter 10 ou 13 números.';

      msg.className = 'field-message error';
    }

    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Buscando...';
  }

  if (msg) {
    msg.textContent =
      'Consultando dados da edição...';

    msg.className = 'field-message';
  }

  try {
    const book = await lookupOpenLibrary(isbn);

    const pages = Number(book?.number_of_pages);

    if (!book) {
      if (msg) {
        msg.textContent =
          'ISBN não encontrado no Open Library.';

        msg.className = 'field-message error';
      }

      return;
    }

    if (Number.isInteger(pages) && pages > 0) {
      const paginas = $('#paginas');

      if (paginas) {
        paginas.value = pages;
      }

      if (msg) {
        msg.textContent =
          `Encontrado: ${pages} páginas.`;

        msg.className = 'field-message ok';
      }
    } else {
      if (msg) {
        msg.textContent =
          'Livro encontrado, mas essa edição não informa o número de páginas.';

        msg.className = 'field-message error';
      }
    }

    const nomeLivro = $('#nome_livro');

    if (
      nomeLivro &&
      !nomeLivro.value.trim() &&
      book.title
    ) {
      nomeLivro.value = book.title;
    }

  } catch (error) {
    console.error(error);

    if (msg) {
      msg.textContent =
        error.message ||
        'Erro ao consultar o ISBN.';

      msg.className = 'field-message error';
    }

  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Buscar';
    }
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// ISBN
on('#lookup-isbn-btn', 'click', buscarPaginas);

on('#isbn', 'blur', () => {
  const isbnElement = $('#isbn');

  if (!isbnElement) {
    return;
  }

  const isbn = normalizeIsbn(isbnElement.value);

  if (isValidIsbnLength(isbn)) {
    buscarPaginas();
  }
});

// Pesquisa
on('#search', 'input', e => {
  state.search = e.target.value;
  render();
});

// Filtro
on('#filter', 'change', e => {
  state.filter = e.target.value;
  render();
});

// Novo livro
on('#new-book-btn', 'click', () => {
  showView('novo');
});

// Botão quando não existem livros
on('#empty-new-btn', 'click', () => {
  showView('novo');
});

// Cancelar
on('#cancel-btn', 'click', () => {
  const form = $('#book-form');

  if (form) {
    form.reset();
  }

  showFormMessage('');
  showView('biblioteca');
});

// Menu
onAll('.nav-item', 'click', e => {
  e.preventDefault();

  showView(e.currentTarget.dataset.view);
});

// ============================================================
// FORMULÁRIO DE LIVRO
// ============================================================

on('#book-form', 'submit', async e => {
  dados = JSON.parse(localStorage.getItem('dados'))
  console.log(dados)
  e.preventDefault();

  showFormMessage('');

  if (!configured) {
    showFormMessage(
      'Primeiro configure a anon key no arquivo app.js.',
      true
    );

    return;
  }

  const nomeLivroElement = $('#nome_livro');
  const isbnElement = $('#isbn');
  const dataInicioElement = $('#data_inicio');
  const dataFimElement = $('#data_fim');
  const paginasElement = $('#paginas');
  const btn = $('#save-btn');

  if (
    !nomeLivroElement ||
    !isbnElement ||
    !dataInicioElement ||
    !dataFimElement ||
    !paginasElement
  ) {
    return;
  }

  const nome_livro =
    nomeLivroElement.value.trim();

  const isbnRaw =
    isbnElement.value
      .trim()
      .replace(/[-\s]/g, '');

  const data_inicio =
    dataInicioElement.value || null;

  const data_fim =
    dataFimElement.value || null;

  const paginasRaw =
    paginasElement.value.trim();

  const paginas =
    paginasRaw
      ? Number(paginasRaw)
      : null;

  if (
    isbnRaw &&
    !/^(?:\d{10}|\d{13})$/.test(isbnRaw)
  ) {
    showFormMessage(
      'O ISBN deve ter 10 ou 13 números.',
      true
    );

    return;
  }

  if (
    paginas !== null &&
    (!Number.isInteger(paginas) || paginas < 1)
  ) {
    showFormMessage(
      'O número de páginas deve ser um número inteiro maior que zero.',
      true
    );

    return;
  }

  if (
    data_inicio &&
    data_fim &&
    data_fim < data_inicio
  ) {
    showFormMessage(
      'A data de término não pode ser anterior à data de início.',
      true
    );

    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }
  let usuario = dados.id

  const { error } = await supabase
    .from('Registros')
    .insert({
      nome_livro,
      isbn: isbnRaw || null,
      paginas,
      status: 'Lendo',
      data_inicio,
      data_fim,
      usuario
    });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Salvar livro';
  }

  if (error) {
    console.error(error);

    showFormMessage(
      `Erro ao salvar: ${error.message}`,
      true
    );

    return;
  }

  const form = $('#book-form');

  if (form) {
    form.reset();
  }

  showFormMessage(
    'Livro adicionado com sucesso.'
  );

  await loadBooks();

  setTimeout(() => {
    showView('biblioteca');
  }, 350);
});

// ============================================================
// CRIAR USUÁRIO
// ============================================================

async function criarUsuario(email, senha) {
  const { data, error } = await supabase
    .from('login')
    .insert({
      email,
      senha
    });

  if (error) {
    console.error(
      'Erro ao criar usuário:',
      error
    );

    return {
      sucesso: false,
      mensagem: error.message
    };
  }

  console.log(
    'Usuário criado:',
    data
  );

  return {
    sucesso: true,
    usuario: data
  };
}

// ============================================================
// LOGIN
// ============================================================

on('#login-form', 'submit', async (e) => {
  e.preventDefault();

  const emailElement = $('#email');
  const senhaElement = $('#senha');

  if (!emailElement || !senhaElement) {
    return;
  }

  await login(
    emailElement.value.trim(),
    senhaElement.value
  );
});

let editingBookId = null;

function openEditModal(book) {
  const modal = document.querySelector('#edit-modal')

  if (!modal) return;

  editingBookId = book.id;

  const nome = $('#edit-nome_livro');
  const isbn = $('#edit-isbn');
  const paginas = $('#edit-paginas');
  const statusSelect = $('#edit-status');
  const dataInicio = $('#edit-data_inicio');
  const dataFim = $('#edit-data_fim');
  const message = $('#edit-message');

  if (nome) nome.value = book.nome_livro || '';
  if (isbn) isbn.value = book.isbn || '';
  if (paginas) paginas.value = book.paginas || '';

  /*
   * Descobre o status atual.
   */
  const [statusAtual] = status(book);

  if (statusSelect) {
    statusSelect.value = statusAtual;
  }

  if (dataInicio) {
    dataInicio.value = book.data_inicio || '';
  }

  if (dataFim) {
    dataFim.value = book.data_fim || '';
  }

  if (message) {
    message.textContent = '';
    message.className = 'form-message';
  }

  modal.classList.remove('hidden');

  if (nome) {
    nome.focus();
  }
}
on('#edit-form', 'submit', async e => {
  e.preventDefault();

  if (!editingBookId) {
    return;
  }

  const nome = $('#edit-nome_livro');
  const isbn = $('#edit-isbn');
  const paginas = $('#edit-paginas');
  const statusSelect = $('#edit-status');
  const dataInicio = $('#edit-data_inicio');
  const dataFim = $('#edit-data_fim');
  const button = $('#edit-save-btn');
  const message = $('#edit-message');

  if (
    !nome ||
    !isbn ||
    !paginas ||
    !statusSelect ||
    !dataInicio ||
    !dataFim
  ) {
    return;
  }

  const nomeLivro = nome.value.trim();
  const isbnValue = isbn.value
    .trim()
    .replace(/[-\s]/g, '');

  const paginasValue = paginas.value.trim();

  const paginasNumber = paginasValue
    ? Number(paginasValue)
    : null;

  const novoStatus = statusSelect.value;
  const novaDataInicio = dataInicio.value || null;
  const novaDataFim = dataFim.value || null;

  if (!nomeLivro) {
    if (message) {
      message.textContent = 'Informe o nome do livro.';
      message.className = 'form-message error';
    }

    return;
  }

  if (
    isbnValue &&
    !/^(?:\d{10}|\d{13})$/.test(isbnValue)
  ) {
    if (message) {
      message.textContent =
        'O ISBN deve ter 10 ou 13 números.';
      message.className = 'form-message error';
    }

    return;
  }

  if (
    paginasNumber !== null &&
    (!Number.isInteger(paginasNumber) || paginasNumber < 1)
  ) {
    if (message) {
      message.textContent =
        'O número de páginas deve ser um inteiro maior que zero.';
      message.className = 'form-message error';
    }

    return;
  }

  if (
    novaDataInicio &&
    novaDataFim &&
    novaDataFim < novaDataInicio
  ) {
    if (message) {
      message.textContent =
        'A data de término não pode ser anterior à data de início.';
      message.className = 'form-message error';
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Salvando...';
  }

  /*
   * Atualiza o registro no Supabase.
   */
  const { error } = await supabase
    .from('Registros')
    .update({
      nome_livro: nomeLivro,
      isbn: isbnValue || null,
      paginas: paginasNumber,
      status: novoStatus,
      data_inicio: novaDataInicio,
      data_fim: novaDataFim
    })
    .eq('id', editingBookId);

  if (button) {
    button.disabled = false;
    button.textContent = 'Salvar alterações';
  }

  if (error) {
    console.error(error);

    if (message) {
      message.textContent =
        `Erro ao salvar: ${error.message}`;
      message.className = 'form-message error';
    }

    return;
  }

  closeEditModal();

  await loadBooks();
});


function closeEditModal() {
  const modal = $('#edit-modal');

  if (modal) {
    modal.classList.add('hidden');
  }

  editingBookId = null;
}

on('#edit-modal-close', 'click', closeEditModal);

on('#edit-cancel-btn', 'click', closeEditModal);

on('#edit-modal-overlay', 'click', closeEditModal);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

render();
loadBooks();
