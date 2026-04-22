document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.nome || user.email || '';

  await loadBookOptions();
  await loadReaderOptions();
  await loadOpenLoans();
});

async function loadBookOptions() {
  const res = await apiGet('getBooks');
  if (!res.success) {
    alert(res.message);
    return;
  }

  const books = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  const select = document.getElementById('idLivro');
  select.innerHTML = '<option value="">Seleccione um livro</option>';

  books
    .filter(book => Number(book.QUANTIDADE_DISPONIVEL || 0) > 0 && String(book.ESTADO || '').toLowerCase() === 'activo')
    .forEach(book => {
      select.innerHTML += `<option value="${book.ID_LIVRO}">${book.TITULO} (${book.CODIGO}) - Disponível: ${book.QUANTIDADE_DISPONIVEL}</option>`;
    });
}

async function loadReaderOptions() {
  const res = await apiGet('getReaders');
  if (!res.success) {
    alert(res.message);
    return;
  }

  const readers = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  const select = document.getElementById('idLeitor');
  select.innerHTML = '<option value="">Seleccione um leitor</option>';

  readers
    .filter(reader => String(reader.ESTADO || '').toLowerCase() === 'activo')
    .forEach(reader => {
      select.innerHTML += `<option value="${reader.ID_LEITOR}">${reader.NOME}</option>`;
    });
}

async function loadOpenLoans() {
  const res = await apiGet('getOpenLoans');
  if (!res.success) {
    alert(res.message);
    return;
  }

  const loans = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  const tbody = document.getElementById('loansTable');
  tbody.innerHTML = '';

  loans.forEach(loan => {
    tbody.innerHTML += `
      <tr>
        <td>${loan.TITULO_LIVRO || ''}</td>
        <td>${loan.NOME_LEITOR || ''}</td>
        <td>${loan.DATA_EMPRESTIMO || ''}</td>
        <td>${loan.DATA_DEVOLUCAO_PREVISTA || ''}</td>
        <td>${loan.ESTADO || ''}</td>
        <td><button class="btn" onclick="returnLoan('${loan.ID_EMPRESTIMO}')">Devolver</button></td>
      </tr>
    `;
  });
}

async function submitLoan() {
  const user = getSession();
  const msg = document.getElementById('loanMsg');

  const payload = {
    action: 'borrowBook',
    idLivro: document.getElementById('idLivro').value,
    idLeitor: document.getElementById('idLeitor').value,
    operador: user.email || user.nome || ''
  };

  const res = await apiPost(payload);

  if (!res.success) {
    msg.innerHTML = `<div class="message error">${res.message}</div>`;
    return;
  }

  msg.innerHTML = `<div class="message success">${res.message}</div>`;

  document.getElementById('idLivro').value = '';
  document.getElementById('idLeitor').value = '';

  await loadBookOptions();
  await loadOpenLoans();
}

async function returnLoan(idEmprestimo) {
  const user = getSession();

  const res = await apiPost({
    action: 'returnBook',
    idEmprestimo,
    operador: user.email || user.nome || ''
  });

  if (!res.success) {
    alert(res.message);
    return;
  }

  alert(`Devolução registada. Dias de atraso: ${res.data.diasAtraso || 0}; Multa: ${res.data.multa || 0}`);

  await loadBookOptions();
  await loadOpenLoans();
}
