document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.nome || user.email || '';

  const res = await apiGet('getDashboard');

  if (!res.success) {
    alert(res.message);
    return;
  }

  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

  document.getElementById('totalLivros').textContent = data.totalLivros || 0;
  document.getElementById('totalLeitores').textContent = data.totalLeitores || 0;
  document.getElementById('livrosDisponiveis').textContent = data.livrosDisponiveis || 0;
  document.getElementById('livrosEmprestados').textContent = data.livrosEmprestados || 0;
  document.getElementById('atrasados').textContent = data.atrasados || 0;
});