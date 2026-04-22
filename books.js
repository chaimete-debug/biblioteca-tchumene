document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.nome || user.email || '';
  loadBooks();
});

async function loadBooks() {
  const res = await apiGet('getBooks');

  if (!res.success) {
    alert(res.message);
    return;
  }

  const books = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  const tbody = document.getElementById('booksTable');
  tbody.innerHTML = '';

  books.forEach(book => {
    tbody.innerHTML += `
      <tr>
        <td>${book.CODIGO || ''}</td>
        <td>${book.TITULO || ''}</td>
        <td>${book.AUTOR || ''}</td>
        <td>${book.CATEGORIA || ''}</td>
        <td>${book.QUANTIDADE_DISPONIVEL || 0}</td>
      </tr>
    `;
  });
}

async function submitBook() {
  const user = getSession();
  const msg = document.getElementById('bookMsg');

  const payload = {
    action: 'addBook',
    codigo: document.getElementById('codigo').value.trim(),
    titulo: document.getElementById('titulo').value.trim(),
    autor: document.getElementById('autor').value.trim(),
    categoria: document.getElementById('categoria').value.trim(),
    editora: document.getElementById('editora').value.trim(),
    ano: document.getElementById('ano').value.trim(),
    isbn: document.getElementById('isbn').value.trim(),
    quantidadeTotal: document.getElementById('quantidadeTotal').value.trim(),
    estante: document.getElementById('estante').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim(),
    operador: user.email || user.nome || ''
  };

  const res = await apiPost(payload);

  if (!res.success) {
    msg.innerHTML = `<div class="message error">${res.message}</div>`;
    return;
  }

  msg.innerHTML = `<div class="message success">${res.message}</div>`;

  document.getElementById('codigo').value = '';
  document.getElementById('titulo').value = '';
  document.getElementById('autor').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('editora').value = '';
  document.getElementById('ano').value = '';
  document.getElementById('isbn').value = '';
  document.getElementById('quantidadeTotal').value = '';
  document.getElementById('estante').value = '';
  document.getElementById('observacoes').value = '';

  loadBooks();
}