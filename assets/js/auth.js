const SESSION_KEY = 'biblioteca_session';


function saveSession(session) {
  if (!session) {
    return;
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );
}


function getSession() {
  try {
    const value =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!value) {
      return null;
    }

    return JSON.parse(value);

  } catch (err) {
    return null;
  }
}


function clearSession() {
  localStorage.removeItem(
    SESSION_KEY
  );
}


function normalizeClientProfile_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function isAdminSession_(session) {
  if (!session) {
    return false;
  }

  const profile =
    normalizeClientProfile_(
      session.perfil
    );

  return (
    profile === 'administrador' ||
    profile === 'admin'
  );
}


function isLibrarianSession_(session) {
  if (!session) {
    return false;
  }

  const profile =
    normalizeClientProfile_(
      session.perfil
    );

  return (
    profile === 'bibliotecario' ||
    profile === 'bibliotecaria'
  );
}


function isConsultationSession_(session) {
  if (!session) {
    return false;
  }

  const profile =
    normalizeClientProfile_(
      session.perfil
    );

  return (
    profile === 'consulta' ||
    profile === 'visualizador'
  );
}


function requireAuth() {
  const session =
    getSession();

  if (
    !session ||
    !session.token
  ) {

    clearSession();

    window.location.href =
      'index.html';

    return null;
  }

  applyRoleNavigation_(
    session
  );

  return session;
}


function requireAdmin() {
  const session =
    requireAuth();

  if (!session) {
    return null;
  }

  if (
    !isAdminSession_(
      session
    )
  ) {

    window.location.href =
      'dashboard.html';

    return null;
  }

  return session;
}


function applyRoleNavigation_(session) {
  if (
    !isAdminSession_(
      session
    )
  ) {
    return;
  }

  const sidebar =
    document.querySelector(
      '.sidebar'
    );

  if (!sidebar) {
    return;
  }

  if (
    sidebar.querySelector(
      '[data-admin-menu]'
    )
  ) {
    return;
  }

  const link =
    document.createElement(
      'a'
    );

  link.href =
    'admin.html';

  link.textContent =
    'Administração';

  link.setAttribute(
    'data-admin-menu',
    '1'
  );

  if (
    window.location.pathname
      .endsWith(
        '/admin.html'
      )
  ) {

    link.classList.add(
      'active'
    );
  }

  const links =
    Array.from(
      sidebar.querySelectorAll(
        'a'
      )
    );

  const logoutLink =
    links.find(
      item =>
        item.textContent
          .trim()
          .toLowerCase()
        === 'sair'
    );

  if (logoutLink) {

    sidebar.insertBefore(
      link,
      logoutLink
    );

  } else {

    sidebar.appendChild(
      link
    );
  }
}


async function logout() {
  const session =
    getSession();

  try {

    if (
      session &&
      session.token &&
      typeof apiPost === 'function'
    ) {

      await apiPost({
        action: 'logout'
      });
    }

  } catch (err) {
    /*
     * Mesmo que o backend não responda,
     * encerramos a sessão local.
     */
  }

  clearSession();

  window.location.href =
    'index.html';
}
