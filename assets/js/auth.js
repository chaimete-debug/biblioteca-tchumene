const SESSION_KEY =
  'biblioteca_session';


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
    profile ===
      'administrador' ||
    profile === 'admin'
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
  const sidebar =
    document.querySelector(
      '.sidebar'
    );

  if (!sidebar) {
    return;
  }


  /* RELATÓRIOS */

  if (
    !sidebar.querySelector(
      '[data-reports-menu]'
    )
  ) {
    const reports =
      document.createElement(
        'a'
      );

    reports.href =
      'reports.html';

    reports.textContent =
      'Relatórios';

    reports.setAttribute(
      'data-reports-menu',
      '1'
    );

    if (
      window.location.pathname
        .endsWith(
          '/reports.html'
        )
    ) {
      reports.classList.add(
        'active'
      );
    }

    const accountLink =
      [...sidebar.querySelectorAll(
        'a'
      )]
      .find(
        item =>
          item.textContent
            .trim()
            .toLowerCase()
          === 'minha conta'
      );

    if (accountLink) {
      sidebar.insertBefore(
        reports,
        accountLink
      );
    } else {
      sidebar.appendChild(
        reports
      );
    }
  }


  /* ADMINISTRAÇÃO */

  if (
    isAdminSession_(
      session
    ) &&
    !sidebar.querySelector(
      '[data-admin-menu]'
    )
  ) {
    const admin =
      document.createElement(
        'a'
      );

    admin.href =
      'admin.html';

    admin.textContent =
      'Administração';

    admin.setAttribute(
      'data-admin-menu',
      '1'
    );

    if (
      window.location.pathname
        .endsWith(
          '/admin.html'
        )
    ) {
      admin.classList.add(
        'active'
      );
    }

    const logoutLink =
      [...sidebar.querySelectorAll(
        'a'
      )]
      .find(
        item =>
          item.textContent
            .trim()
            .toLowerCase()
          === 'sair'
      );

    if (logoutLink) {
      sidebar.insertBefore(
        admin,
        logoutLink
      );
    } else {
      sidebar.appendChild(
        admin
      );
    }
  }
}


async function logout() {
  const session =
    getSession();

  try {
    if (
      session &&
      session.token &&
      typeof apiPost ===
        'function'
    ) {
      await apiPost({
        action:
          'logout'
      });
    }
  } catch (err) {}

  clearSession();

  window.location.href =
    'index.html';
}
