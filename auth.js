function saveSession(user) {
  localStorage.setItem('biblioteca_user', JSON.stringify(user));
}

function getSession() {
  const raw = localStorage.getItem('biblioteca_user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem('biblioteca_user');
  window.location.href = 'index.html';
}

function requireAuth() {
  const user = getSession();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}