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

    return JSON.parse(
      value
    );

  } catch (err) {

    return null;
  }
}


function clearSession() {

  localStorage.removeItem(
    SESSION_KEY
  );
}


function normalizeClientProfile_(
  value
) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function isAdminSession_(
  session
) {

  if (!session) {
    return false;
  }

  const profile =
    normalizeClientProfile_(
      session.perfil
    );

  return (
    profile === 'admin' ||
    profile === 'administrador'
  );
}


function isLibrarianSession_(
  session
) {

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


function isConsultationSession_(
  session
) {

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



/* ============================================================
   MENU DINÂMICO
============================================================ */


function applyRoleNavigation_(
  session
) {

  const sidebar =
    document.querySelector(
      '.sidebar'
    );

  if (!sidebar) {
    return;
  }


  ensureReportsMenu_(
    sidebar
  );


  if (
    isAdminSession_(
      session
    )
  ) {

    ensureProductivityMenu_(
      sidebar
    );

    ensureAdminMenu_(
      sidebar
    );

  } else {

    removeAdminOnlyMenus_(
      sidebar
    );
  }
}



/* ============================================================
   RELATÓRIOS
   Todos os utilizadores autenticados
============================================================ */


function ensureReportsMenu_(
  sidebar
) {

  let link =
    sidebar.querySelector(
      '[data-reports-menu]'
    );


  if (!link) {

    link =
      document.createElement(
        'a'
      );

    link.href =
      'reports.html';

    link.textContent =
      'Relatórios';

    link.setAttribute(
      'data-reports-menu',
      '1'
    );


    const accountLink =
      findSidebarLinkByText_(
        sidebar,
        'minha conta'
      );


    if (accountLink) {

      sidebar.insertBefore(
        link,
        accountLink
      );

    } else {

      sidebar.appendChild(
        link
      );
    }
  }


  setActiveMenu_(
    link,
    'reports.html'
  );
}



/* ============================================================
   PRODUTIVIDADE
   Apenas Administrador
============================================================ */


function ensureProductivityMenu_(
  sidebar
) {

  let link =
    sidebar.querySelector(
      '[data-productivity-menu]'
    );


  if (!link) {

    link =
      document.createElement(
        'a'
      );

    link.href =
      'productivity.html';

    link.textContent =
      'Produtividade';

    link.setAttribute(
      'data-productivity-menu',
      '1'
    );


    const accountLink =
      findSidebarLinkByText_(
        sidebar,
        'minha conta'
      );


    if (accountLink) {

      sidebar.insertBefore(
        link,
        accountLink
      );

    } else {

      sidebar.appendChild(
        link
      );
    }
  }


  setActiveMenu_(
    link,
    'productivity.html'
  );
}



/* ============================================================
   ADMINISTRAÇÃO
   Apenas Administrador
============================================================ */


function ensureAdminMenu_(
  sidebar
) {

  let link =
    sidebar.querySelector(
      '[data-admin-menu]'
    );


  if (!link) {

    link =
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


    const logoutLink =
      findSidebarLinkByText_(
        sidebar,
        'sair'
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


  setActiveMenu_(
    link,
    'admin.html'
  );
}



/* ============================================================
   REMOVER MENUS ADMIN
============================================================ */


function removeAdminOnlyMenus_(
  sidebar
) {

  const productivity =
    sidebar.querySelector(
      '[data-productivity-menu]'
    );


  const admin =
    sidebar.querySelector(
      '[data-admin-menu]'
    );


  if (productivity) {

    productivity.remove();
  }


  if (admin) {

    admin.remove();
  }
}



/* ============================================================
   HELPERS DO MENU
============================================================ */


function findSidebarLinkByText_(
  sidebar,
  text
) {

  const expected =
    String(text || '')
      .trim()
      .toLowerCase();


  return Array
    .from(
      sidebar.querySelectorAll(
        'a'
      )
    )
    .find(
      item =>
        item.textContent
          .trim()
          .toLowerCase()
        === expected
    ) || null;
}


function setActiveMenu_(
  link,
  page
) {

  if (!link) {
    return;
  }


  const path =
    window.location.pathname
      .toLowerCase();


  if (
    path.endsWith(
      '/' + page.toLowerCase()
    ) ||
    path.endsWith(
      page.toLowerCase()
    )
  ) {

    link.classList.add(
      'active'
    );

  } else {

    link.classList.remove(
      'active'
    );
  }
}



/* ============================================================
   LOGOUT
============================================================ */


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
        action:
          'logout'
      });
    }

  } catch (err) {

    /*
     * Mesmo que o servidor esteja indisponível,
     * eliminamos a sessão local.
     */
  }


  clearSession();


  window.location.href =
    'index.html';
}
