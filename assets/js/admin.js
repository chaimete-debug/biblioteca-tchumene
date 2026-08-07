let adminUser = null;

let adminUsers = [];
let adminCategories = [];
let adminShelves = [];


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    adminUser =
      requireAdmin();

    if (!adminUser) {
      return;
    }

    document.getElementById(
      'userName'
    ).textContent =
      adminUser.nome ||
      adminUser.email ||
      '';

    await loadAdministration();
  }
);



async function loadAdministration() {

  await Promise.all([
    loadAdminOverview(),
    loadAdminUsers(),
    loadCategories(),
    loadShelves(),
    loadConfiguration(),
    loadAudit()
  ]);
}



/* =====================================
   VISÃO GERAL
===================================== */


async function loadAdminOverview() {

  const res =
    await apiGet(
      'getAdminOverview'
    );

  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  const data =
    res.data || {};


  setText_(
    'adminUsersCount',
    data.utilizadores || 0
  );


  setText_(
    'adminActiveUsersCount',
    data.utilizadoresActivos || 0
  );


  setText_(
    'adminCategoriesCount',
    data.categorias || 0
  );


  setText_(
    'adminShelvesCount',
    data.estantes || 0
  );
}



/* =====================================
   UTILIZADORES
===================================== */


async function loadAdminUsers() {

  const res =
    await apiGet(
      'getAdminUsers'
    );


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  adminUsers =
    Array.isArray(
      res.data
    )
      ? res.data
      : [];


  renderAdminUsers();
}



function renderAdminUsers() {

  const tbody =
    document.getElementById(
      'adminUsersTable'
    );


  tbody.innerHTML = '';


  if (!adminUsers.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-table"
        >
          Nenhum utilizador.
        </td>
      </tr>
    `;

    return;
  }


  adminUsers.forEach(
    user => {

      const active =
        String(
          user.ESTADO || ''
        )
        .trim()
        .toLowerCase()
        === 'activo';


      const profileLabel =
        formatProfileLabel(
          user.PERFIL
        );


      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td data-label="Nome">

              <strong>
                ${escapeAdminHtml(
                  user.NOME || ''
                )}
              </strong>

            </td>


            <td data-label="Email">

              <span class="admin-email">

                ${escapeAdminHtml(
                  user.EMAIL || ''
                )}

              </span>

            </td>


            <td data-label="Perfil">

              <span class="admin-profile-badge">

                ${escapeAdminHtml(
                  profileLabel
                )}

              </span>

            </td>


            <td data-label="Estado">

              <span
                class="${
                  active
                    ? 'status-active'
                    : 'status-neutral'
                }"
              >

                ${
                  active
                    ? 'Activo'
                    : 'Inactivo'
                }

              </span>

            </td>


            <td data-label="Acções">

              <div class="admin-action-group">


                <button
                  class="btn btn-small btn-secondary"
                  onclick="
                    toggleUserStatus(
                      '${escapeAdminJs(
                        user.ID
                      )}',
                      '${
                        active
                          ? 'inactivo'
                          : 'activo'
                      }'
                    )
                  "
                >

                  ${
                    active
                      ? 'Desactivar'
                      : 'Activar'
                  }

                </button>


                <button
                  class="btn btn-small"
                  onclick="
                    resetUserPassword(
                      '${escapeAdminJs(
                        user.ID
                      )}'
                    )
                  "
                >
                  Password
                </button>


              </div>

            </td>

          </tr>
        `
      );
    }
  );
}



/*
 * Normalização apenas visual.
 *
 * Não altera os dados existentes
 * no Google Sheets.
 */
function formatProfileLabel(
  value
) {

  const normalized =
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );


  if (
    normalized === 'admin' ||
    normalized === 'administrador'
  ) {

    return 'Administrador';
  }


  if (
    normalized === 'bibliotecario' ||
    normalized === 'bibliotecaria'
  ) {

    return 'Bibliotecário';
  }


  if (
    normalized === 'consulta' ||
    normalized === 'visualizador'
  ) {

    return 'Consulta';
  }


  if (!value) {

    return 'Não definido';
  }


  return String(value);
}



async function createAdminUser() {

  const res =
    await apiPost({

      action:
        'addAdminUser',

      nome:
        value_(
          'adminUserName'
        ),

      email:
        value_(
          'adminUserEmail'
        ),

      password:
        document.getElementById(
          'adminUserPassword'
        ).value,

      perfil:
        value_(
          'adminUserProfile'
        )

    });


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  showAdminMessage(
    res.message,
    'success'
  );


  setValue_(
    'adminUserName',
    ''
  );


  setValue_(
    'adminUserEmail',
    ''
  );


  setValue_(
    'adminUserPassword',
    ''
  );


  setValue_(
    'adminUserProfile',
    'Bibliotecário'
  );


  await loadAdminUsers();

  await loadAdminOverview();

  await loadAudit();
}



async function toggleUserStatus(
  id,
  estado
) {

  const res =
    await apiPost({

      action:
        'setAdminUserStatus',

      id:
        id,

      estado:
        estado

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    await loadAdminUsers();

    await loadAdminOverview();

    await loadAudit();
  }
}



async function resetUserPassword(
  id
) {

  const password =
    window.prompt(
      'Introduza a nova password temporária (mínimo 6 caracteres):'
    );


  if (!password) {
    return;
  }


  const res =
    await apiPost({

      action:
        'resetAdminUserPassword',

      id:
        id,

      password:
        password

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    await loadAudit();
  }
}



/* =====================================
   CATEGORIAS
===================================== */


async function loadCategories() {

  const res =
    await apiGet(
      'getAdminCategories'
    );


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  adminCategories =
    Array.isArray(
      res.data
    )
      ? res.data
      : [];


  renderCategories();
}



function renderCategories() {

  const tbody =
    document.getElementById(
      'categoriesTable'
    );


  tbody.innerHTML = '';


  if (!adminCategories.length) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="4"
          class="empty-table"
        >
          Nenhuma categoria.
        </td>

      </tr>
    `;

    return;
  }


  adminCategories.forEach(
    item => {

      const active =
        String(
          item.ESTADO || ''
        )
        .toLowerCase()
        !== 'inactivo';


      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>

              <strong>
                ${escapeAdminHtml(
                  item.NOME
                )}
              </strong>

            </td>


            <td>
              ${escapeAdminHtml(
                item.DESCRICAO
              )}
            </td>


            <td>

              <span
                class="${
                  active
                    ? 'status-active'
                    : 'status-neutral'
                }"
              >

                ${
                  active
                    ? 'Activo'
                    : 'Inactivo'
                }

              </span>

            </td>


            <td>

              <button
                class="btn btn-small btn-secondary"
                onclick="
                  toggleCategory(
                    '${escapeAdminJs(
                      item.ID_CATEGORIA
                    )}',
                    '${
                      active
                        ? 'inactivo'
                        : 'activo'
                    }'
                  )
                "
              >

                ${
                  active
                    ? 'Desactivar'
                    : 'Activar'
                }

              </button>

            </td>

          </tr>
        `
      );
    }
  );
}



async function createCategory() {

  const res =
    await apiPost({

      action:
        'addAdminCategory',

      nome:
        value_(
          'categoryName'
        ),

      descricao:
        value_(
          'categoryDescription'
        )

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    setValue_(
      'categoryName',
      ''
    );


    setValue_(
      'categoryDescription',
      ''
    );


    await loadCategories();

    await loadAdminOverview();

    await loadAudit();
  }
}



async function toggleCategory(
  id,
  estado
) {

  const res =
    await apiPost({

      action:
        'setAdminCategoryStatus',

      id:
        id,

      estado:
        estado

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    await loadCategories();

    await loadAdminOverview();

    await loadAudit();
  }
}



/* =====================================
   ESTANTES
===================================== */


async function loadShelves() {

  const res =
    await apiGet(
      'getAdminShelves'
    );


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  adminShelves =
    Array.isArray(
      res.data
    )
      ? res.data
      : [];


  renderShelves();
}



function renderShelves() {

  const tbody =
    document.getElementById(
      'shelvesTable'
    );


  tbody.innerHTML = '';


  if (!adminShelves.length) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="5"
          class="empty-table"
        >
          Nenhuma estante.
        </td>

      </tr>
    `;

    return;
  }


  adminShelves.forEach(
    item => {

      const active =
        String(
          item.ESTADO || ''
        )
        .toLowerCase()
        !== 'inactivo';


      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>

              <strong>
                ${escapeAdminHtml(
                  item.CODIGO
                )}
              </strong>

            </td>


            <td>
              ${escapeAdminHtml(
                item.DESCRICAO
              )}
            </td>


            <td>
              ${escapeAdminHtml(
                item.LOCALIZACAO
              )}
            </td>


            <td>

              <span
                class="${
                  active
                    ? 'status-active'
                    : 'status-neutral'
                }"
              >

                ${
                  active
                    ? 'Activo'
                    : 'Inactivo'
                }

              </span>

            </td>


            <td>

              <button
                class="btn btn-small btn-secondary"
                onclick="
                  toggleShelf(
                    '${escapeAdminJs(
                      item.ID_ESTANTE
                    )}',
                    '${
                      active
                        ? 'inactivo'
                        : 'activo'
                    }'
                  )
                "
              >

                ${
                  active
                    ? 'Desactivar'
                    : 'Activar'
                }

              </button>

            </td>

          </tr>
        `
      );
    }
  );
}



async function createShelf() {

  const res =
    await apiPost({

      action:
        'addAdminShelf',

      codigo:
        value_(
          'shelfCode'
        ),

      descricao:
        value_(
          'shelfDescription'
        ),

      localizacao:
        value_(
          'shelfLocation'
        )

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    setValue_(
      'shelfCode',
      ''
    );


    setValue_(
      'shelfDescription',
      ''
    );


    setValue_(
      'shelfLocation',
      ''
    );


    await loadShelves();

    await loadAdminOverview();

    await loadAudit();
  }
}



async function toggleShelf(
  id,
  estado
) {

  const res =
    await apiPost({

      action:
        'setAdminShelfStatus',

      id:
        id,

      estado:
        estado

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    await loadShelves();

    await loadAdminOverview();

    await loadAudit();
  }
}



/* =====================================
   CONFIGURAÇÃO
===================================== */


async function loadConfiguration() {

  const res =
    await apiGet(
      'getAdminConfig'
    );


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  setValue_(
    'configLibraryName',
    res.data.NOME_BIBLIOTECA
  );


  setValue_(
    'configLoanDays',
    res.data.PRAZO_EMPRESTIMO_DIAS
  );


  setValue_(
    'configFinePerDay',
    res.data.MULTA_POR_DIA
  );
}



async function saveConfiguration() {

  const res =
    await apiPost({

      action:
        'saveAdminConfig',

      nomeBiblioteca:
        value_(
          'configLibraryName'
        ),

      prazoDias:
        value_(
          'configLoanDays'
        ),

      multaPorDia:
        value_(
          'configFinePerDay'
        )

    });


  showAdminMessage(
    res.message,
    res.success
      ? 'success'
      : 'error'
  );


  if (res.success) {

    await loadAudit();
  }
}



/* =====================================
   AUDITORIA
===================================== */


async function loadAudit() {

  const res =
    await apiGet(
      'getAdminAudit',
      {
        limit: 100
      }
    );


  if (!res.success) {

    showAdminMessage(
      res.message,
      'error'
    );

    return;
  }


  const tbody =
    document.getElementById(
      'auditTable'
    );


  tbody.innerHTML = '';


  const rows =
    Array.isArray(
      res.data
    )
      ? res.data
      : [];


  if (!rows.length) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="5"
          class="empty-table"
        >
          Sem movimentos registados.
        </td>

      </tr>
    `;

    return;
  }


  rows.forEach(
    row => {

      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>
              ${escapeAdminHtml(
                row.TIPO ||
                row.tipo ||
                ''
              )}
            </td>

            <td>
              ${escapeAdminHtml(
                row.REFERENCIA ||
                row.referencia ||
                ''
              )}
            </td>

            <td>
              ${escapeAdminHtml(
                row.DESCRICAO ||
                row.descricao ||
                ''
              )}
            </td>

            <td>
              ${escapeAdminHtml(
                row.UTILIZADOR ||
                row.utilizador ||
                ''
              )}
            </td>

            <td>
              ${escapeAdminHtml(
                row.DATA ||
                row.data ||
                row.DATA_REGISTO ||
                ''
              )}
            </td>

          </tr>
        `
      );
    }
  );
}



/* =====================================
   HELPERS
===================================== */


function showAdminMessage(
  message,
  type
) {

  const box =
    document.getElementById(
      'adminMsg'
    );


  box.innerHTML = `
    <div class="message ${type}">
      ${escapeAdminHtml(
        message
      )}
    </div>
  `;


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}



function value_(id) {

  const el =
    document.getElementById(
      id
    );


  return el
    ? String(
        el.value || ''
      ).trim()
    : '';
}



function setValue_(
  id,
  value
) {

  const el =
    document.getElementById(
      id
    );


  if (el) {

    el.value =
      value == null
        ? ''
        : value;
  }
}



function setText_(
  id,
  value
) {

  const el =
    document.getElementById(
      id
    );


  if (el) {

    el.textContent =
      value == null
        ? ''
        : value;
  }
}



function escapeAdminHtml(
  value
) {

  return String(
    value ?? ''
  )
  .replaceAll(
    '&',
    '&amp;'
  )
  .replaceAll(
    '<',
    '&lt;'
  )
  .replaceAll(
    '>',
    '&gt;'
  )
  .replaceAll(
    '"',
    '&quot;'
  )
  .replaceAll(
    "'",
    '&#039;'
  );
}



function escapeAdminJs(
  value
) {

  return String(
    value ?? ''
  )
  .replaceAll(
    '\\',
    '\\\\'
  )
  .replaceAll(
    "'",
    "\\'"
  );
}
