let reportsUser = null;

let reportLoans = [];
let reportTopBooks = [];
let reportTopReaders = [];
let reportOverdue = [];


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    reportsUser =
      requireAuth();

    if (!reportsUser) {
      return;
    }

    document.getElementById(
      'userName'
    ).textContent =
      reportsUser.nome ||
      reportsUser.email ||
      '';

    await loadReports();
  }
);



function getReportFilters() {
  return {
    start:
      document.getElementById(
        'reportStart'
      ).value,

    end:
      document.getElementById(
        'reportEnd'
      ).value
  };
}



async function loadReports() {
  const filters =
    getReportFilters();

  try {

    const [
      summaryRes,
      loansRes,
      booksRes,
      readersRes,
      overdueRes
    ] = await Promise.all([
      apiGet(
        'getReportsSummary',
        filters
      ),

      apiGet(
        'getReportsLoans',
        filters
      ),

      apiGet(
        'getReportsTopBooks',
        filters
      ),

      apiGet(
        'getReportsTopReaders',
        filters
      ),

      apiGet(
        'getReportsOverdue'
      )
    ]);


    [
      summaryRes,
      loansRes,
      booksRes,
      readersRes,
      overdueRes
    ].forEach(
      response => {

        if (!response.success) {
          throw new Error(
            response.message
          );
        }
      }
    );


    renderSummary(
      summaryRes.data || {}
    );


    reportLoans =
      Array.isArray(
        loansRes.data
      )
        ? loansRes.data
        : [];


    reportTopBooks =
      Array.isArray(
        booksRes.data
      )
        ? booksRes.data
        : [];


    reportTopReaders =
      Array.isArray(
        readersRes.data
      )
        ? readersRes.data
        : [];


    reportOverdue =
      Array.isArray(
        overdueRes.data
      )
        ? overdueRes.data
        : [];


    renderLoans();
    renderTopBooks();
    renderTopReaders();
    renderOverdue();


  } catch (err) {

    showReportMessage(
      err.message,
      'error'
    );
  }
}



function renderSummary(data) {
  setReportText_(
    'reportTotal',
    data.totalEmprestimos || 0
  );

  setReportText_(
    'reportActive',
    data.activos || 0
  );

  setReportText_(
    'reportReturned',
    data.devolvidos || 0
  );

  setReportText_(
    'reportOverdue',
    data.atrasados || 0
  );

  setReportText_(
    'reportFine',
    formatMoney_(
      data.multas || 0
    )
  );
}



function renderTopBooks() {
  const tbody =
    document.getElementById(
      'topBooksTable'
    );

  tbody.innerHTML = '';

  if (!reportTopBooks.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="empty-table"
        >
          Sem dados no período.
        </td>
      </tr>
    `;

    return;
  }

  reportTopBooks
    .slice(
      0,
      10
    )
    .forEach(
      (item, index) => {

        tbody.insertAdjacentHTML(
          'beforeend',
          `
            <tr>

              <td>
                <span class="ranking-number">
                  ${index + 1}
                </span>
              </td>

              <td>
                <strong>
                  ${escapeReportHtml(
                    item.TITULO || ''
                  )}
                </strong>
              </td>

              <td>
                ${escapeReportHtml(
                  item.ISBN || '—'
                )}
              </td>

              <td>
                ${Number(
                  item.TOTAL || 0
                )}
              </td>

            </tr>
          `
        );
      }
    );
}



function renderTopReaders() {
  const tbody =
    document.getElementById(
      'topReadersTable'
    );

  tbody.innerHTML = '';

  if (!reportTopReaders.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-table"
        >
          Sem dados no período.
        </td>
      </tr>
    `;

    return;
  }

  reportTopReaders
    .slice(
      0,
      10
    )
    .forEach(
      (item, index) => {

        tbody.insertAdjacentHTML(
          'beforeend',
          `
            <tr>

              <td>
                <span class="ranking-number">
                  ${index + 1}
                </span>
              </td>

              <td>
                <strong>
                  ${escapeReportHtml(
                    item.NOME || ''
                  )}
                </strong>
              </td>

              <td>
                ${Number(
                  item.TOTAL || 0
                )}
              </td>

              <td>
                ${Number(
                  item.ACTIVOS || 0
                )}
              </td>

              <td>
                ${Number(
                  item.ATRASADOS || 0
                )}
              </td>

            </tr>
          `
        );
      }
    );
}



function renderOverdue() {
  const tbody =
    document.getElementById(
      'overdueTable'
    );

  tbody.innerHTML = '';

  if (!reportOverdue.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-table"
        >
          Não existem empréstimos atrasados.
        </td>
      </tr>
    `;

    return;
  }

  reportOverdue.forEach(
    item => {

      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>
              ${escapeReportHtml(
                item.CODIGO_EXEMPLAR || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                item.TITULO_LIVRO || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                item.NOME_LEITOR || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                formatReportDate_(
                  item.DATA_DEVOLUCAO_PREVISTA
                )
              )}
            </td>

            <td>
              <span class="status-overdue">
                ${Number(
                  item.ATRASO_ACTUAL || 0
                )}
              </span>
            </td>

          </tr>
        `
      );
    }
  );
}



function renderLoans() {
  const tbody =
    document.getElementById(
      'reportsLoansTable'
    );

  tbody.innerHTML = '';

  const search =
    String(
      document.getElementById(
        'reportSearch'
      )?.value || ''
    )
    .trim()
    .toLowerCase();


  const filtered =
    reportLoans.filter(
      item => {

        const text = [
          item.CODIGO_EXEMPLAR,
          item.TITULO_LIVRO,
          item.NOME_LEITOR,
          item.ISBN,
          item.ESTADO
        ]
        .join(' ')
        .toLowerCase();

        return text.includes(
          search
        );
      }
    );


  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          Sem registos.
        </td>
      </tr>
    `;

    return;
  }


  filtered.forEach(
    item => {

      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>
              ${escapeReportHtml(
                item.CODIGO_EXEMPLAR || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                item.TITULO_LIVRO || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                item.NOME_LEITOR || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                formatReportDate_(
                  item.DATA_EMPRESTIMO
                )
              )}
            </td>

            <td>
              ${escapeReportHtml(
                formatReportDate_(
                  item.DATA_DEVOLUCAO_PREVISTA
                )
              )}
            </td>

            <td>
              ${escapeReportHtml(
                formatReportDate_(
                  item.DATA_DEVOLUCAO_REAL
                )
              )}
            </td>

            <td>
              ${escapeReportHtml(
                item.ESTADO || ''
              )}
            </td>

            <td>
              ${escapeReportHtml(
                formatMoney_(
                  item.MULTA || 0
                )
              )}
            </td>

          </tr>
        `
      );
    }
  );
}



function clearReportFilters() {
  document.getElementById(
    'reportStart'
  ).value = '';

  document.getElementById(
    'reportEnd'
  ).value = '';

  loadReports();
}



function exportLoansCsv() {
  if (!reportLoans.length) {
    showReportMessage(
      'Não existem dados para exportar.',
      'error'
    );

    return;
  }

  const headers = [
    'Exemplar',
    'Livro',
    'ISBN',
    'Leitor',
    'Data Emprestimo',
    'Data Prevista',
    'Data Devolucao',
    'Estado',
    'Dias Atraso',
    'Multa'
  ];

  const rows =
    reportLoans.map(
      item => [
        item.CODIGO_EXEMPLAR || '',
        item.TITULO_LIVRO || '',
        item.ISBN || '',
        item.NOME_LEITOR || '',
        item.DATA_EMPRESTIMO || '',
        item.DATA_DEVOLUCAO_PREVISTA || '',
        item.DATA_DEVOLUCAO_REAL || '',
        item.ESTADO || '',
        item.DIAS_ATRASO || 0,
        item.MULTA || 0
      ]
    );

  const csv =
    [
      headers,
      ...rows
    ]
    .map(
      row =>
        row
          .map(
            csvEscape_
          )
          .join(';')
    )
    .join('\n');

  const blob =
    new Blob(
      [
        '\uFEFF' +
        csv
      ],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      'a'
    );

  link.href =
    url;

  link.download =
    'relatorio-circulacao-biblioteca.csv';

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}



function csvEscape_(value) {
  const text =
    String(
      value ?? ''
    );

  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}



function formatMoney_(value) {
  return Number(
    value || 0
  ).toLocaleString(
    'pt-MZ',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ) + ' MT';
}



function formatReportDate_(value) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    'pt-PT'
  );
}



function setReportText_(
  id,
  value
) {
  const el =
    document.getElementById(id);

  if (el) {
    el.textContent =
      value;
  }
}



function showReportMessage(
  message,
  type
) {
  document.getElementById(
    'reportMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeReportHtml(
        message
      )}
    </div>
  `;
}



function escapeReportHtml(
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
