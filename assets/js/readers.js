document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.nome || user.email || '';
  loadReaders();
});

async function loadReaders() {
  const res = await apiGet('getReaders');

  if (!res.success) {
    alert(res.message);
    return;
  }

  const readers = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  const tbody = document.getElementById('readersTable');
  tbody.innerHTML = '';

  readers.forEach(reader => {
    tbody.innerHTML += `
      <tr>
        <td>${reader.NOME || ''}</td>
        <td>${reader.TELEFONE || ''}</td>
        <td>${reader.EMAIL || ''}</td>
        <td>${reader.BI || ''}</td>
        <td>${reader.TIPO_LEITOR || ''}</td>
      </tr>
    `;
  });
}

async function submitReader() {
  const user = getSession();
  const msg = document.getElementById('readerMsg');

  const payload = {
    action: 'addReader',
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    email: document.getElementById('email').value.trim(),
    bi: document.getElementById('bi').value.trim(),
    morada: document.getElementById('morada').value.trim(),
    tipoLeitor: document.getElementById('tipoLeitor').value.trim(),
    operador: user.email || user.nome || ''
  };

  const res = await apiPost(payload);

  if (!res.success) {
    msg.innerHTML = `<div class="message error">${res.message}</div>`;
    return;
  }

  msg.innerHTML = `<div class="message success">${res.message}</div>`;

  document.getElementById('nome').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('email').value = '';
  document.getElementById('bi').value = '';
  document.getElementById('morada').value = '';
  document.getElementById('tipoLeitor').value = '';

  loadReaders();
}
