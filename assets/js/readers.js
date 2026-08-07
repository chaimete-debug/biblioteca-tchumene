let readersUser = null;

let allReaders = [];

let currentReaderCard = null;



document.addEventListener(
  'DOMContentLoaded',
  async () => {

    readersUser =
      requireAuth();


    if (!readersUser) {
      return;
    }


    document.getElementById(
      'userName'
    ).textContent =
      readersUser.nome ||
      readersUser.email ||
      '';


    await loadReaders();
  }
);



async function loadReaders() {

  try {

    const response =
      await apiGet(
        'getReaders'
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    allReaders =
      Array.isArray(
        response.data
      )
        ? response.data
        : [];


    renderReaders();


  } catch (err) {

    showReaderMessage(
      err.message,
      'error'
    );
  }
}



function renderReaders() {

  const tbody =
    document.getElementById(
      'readersTable'
    );


  const search =
    String(
      document.getElementById(
        'readerSearch'
      )?.value || ''
    )
    .trim()
    .toLowerCase();


  tbody.innerHTML = '';


  const filtered =
    allReaders.filter(reader => {

      const haystack = [
        reader.CODIGO_LEITOR,
        reader.NOME,
        reader.TELEFONE,
        reader.EMAIL,
        reader.BI,
        reader.TIPO_LEITOR
      ]
      .join(' ')
      .toLowerCase();


      return haystack.includes(
        search
      );
    });


  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-table"
        >
          Nenhum leitor encontrado.
        </td>
      </tr>
    `;

    return;
  }


  filtered.forEach(reader => {

    const active =
      String(
        reader.ESTADO || ''
      )
      .toLowerCase()
      === 'activo';


    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>

          <td>
            <strong>
              ${escapeReaderHtml(
                reader.CODIGO_LEITOR || ''
              )}
            </strong>
          </td>

          <td>
            ${escapeReaderHtml(
              reader.NOME || ''
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              reader.TELEFONE || ''
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              reader.EMAIL || ''
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              reader.TIPO_LEITOR || ''
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
                  : escapeReaderHtml(
                      reader.ESTADO || ''
                    )
              }
            </span>
          </td>

          <td>

            <div class="copy-actions">

              <button
                class="btn btn-small"
                onclick="
                  showReaderQr(
                    '${escapeReaderJs(
                      reader.ID_LEITOR
                    )}'
                  )
                "
              >
                QR
              </button>

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  showReaderProfile(
                    '${escapeReaderJs(
                      reader.ID_LEITOR
                    )}'
                  )
                "
              >
                Histórico
              </button>

            </div>

          </td>

        </tr>
      `
    );
  });
}



async function submitReader() {

  const nome =
    document.getElementById(
      'nome'
    ).value.trim();


  if (!nome) {

    showReaderMessage(
      'O nome do leitor é obrigatório.',
      'error'
    );

    return;
  }


  const btn =
    document.getElementById(
      'saveReaderBtn'
    );


  btn.disabled = true;

  btn.textContent =
    'A guardar...';


  try {

    const response =
      await apiPost({

        action:
          'addReader',

        nome:
          nome,

        telefone:
          document.getElementById(
            'telefone'
          ).value.trim(),

        email:
          document.getElementById(
            'email'
          ).value.trim(),

        bi:
          document.getElementById(
            'bi'
          ).value.trim(),

        morada:
          document.getElementById(
            'morada'
          ).value.trim(),

        tipoLeitor:
          document.getElementById(
            'tipoLeitor'
          ).value.trim(),

        operador:
          readersUser.email ||
          readersUser.nome ||
          ''
      });


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    showReaderMessage(
      `${response.message}. Código: ${response.data.codigoLeitor}`,
      'success'
    );


    clearReaderForm();

    await loadReaders();


  } catch (err) {

    showReaderMessage(
      err.message,
      'error'
    );


  } finally {

    btn.disabled = false;

    btn.textContent =
      'Guardar Leitor';
  }
}



function clearReaderForm() {

  [
    'nome',
    'telefone',
    'email',
    'bi',
    'morada',
    'tipoLeitor'
  ]
  .forEach(id => {

    document.getElementById(
      id
    ).value = '';
  });
}



/* QR */


function showReaderQr(
  idLeitor
) {

  const reader =
    allReaders.find(item =>
      String(
        item.ID_LEITOR
      ) ===
      String(
        idLeitor
      )
    );


  if (!reader) {

    showReaderMessage(
      'Leitor não encontrado.',
      'error'
    );

    return;
  }


  if (
    !reader.CODIGO_LEITOR
  ) {

    showReaderMessage(
      'Este leitor ainda não possui código QR.',
      'error'
    );

    return;
  }


  if (
    typeof QRCode ===
    'undefined'
  ) {

    showReaderMessage(
      'O gerador de QR Code não foi carregado.',
      'error'
    );

    return;
  }


  currentReaderCard =
    reader;


  document.getElementById(
    'readerCardCode'
  ).textContent =
    reader.CODIGO_LEITOR;


  document.getElementById(
    'readerCardName'
  ).textContent =
    reader.NOME;


  const box =
    document.getElementById(
      'readerQrBox'
    );


  box.innerHTML = '';


  new QRCode(
    box,
    {
      text:
        reader.CODIGO_LEITOR,

      width:
        190,

      height:
        190,

      colorDark:
        '#000000',

      colorLight:
        '#ffffff',

      correctLevel:
        QRCode.CorrectLevel.M
    }
  );


  document.getElementById(
    'readerQrModal'
  ).classList.remove(
    'hidden'
  );
}



function closeReaderQr() {

  currentReaderCard =
    null;


  document.getElementById(
    'readerQrModal'
  ).classList.add(
    'hidden'
  );


  document.getElementById(
    'readerQrBox'
  ).innerHTML = '';
}



function printReaderCard() {

  if (!currentReaderCard) {
    return;
  }


  const source =
    document.getElementById(
      'readerQrBox'
    );


  const canvas =
    source.querySelector(
      'canvas'
    );


  const img =
    source.querySelector(
      'img'
    );


  let qrUrl = '';


  if (
    canvas &&
    canvas.toDataURL
  ) {

    qrUrl =
      canvas.toDataURL(
        'image/png'
      );

  } else if (
    img &&
    img.src
  ) {

    qrUrl =
      img.src;
  }


  if (!qrUrl) {

    showReaderMessage(
      'Não foi possível preparar o QR para impressão.',
      'error'
    );

    return;
  }


  const win =
    window.open(
      '',
      '_blank',
      'width=700,height=600'
    );


  if (!win) {

    showReaderMessage(
      'O navegador bloqueou a janela de impressão.',
      'error'
    );

    return;
  }


  win.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="UTF-8">

      <title>
        Cartão do Leitor
      </title>

      <style>

        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        .card {
          width: 86mm;
          height: 54mm;
          border: 1px solid #000;
          border-radius: 4mm;
          padding: 5mm;
          display: grid;
          grid-template-columns: 35mm 1fr;
          gap: 4mm;
          align-items: center;
        }

        .qr {
          width: 32mm;
          height: 32mm;
        }

        .library {
          font-weight: bold;
          font-size: 12pt;
          margin-bottom: 4mm;
        }

        .name {
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 3mm;
        }

        .code {
          font-size: 12pt;
          font-weight: bold;
        }

      </style>

    </head>

    <body>

      <div class="card">

        <img
          class="qr"
          src="${qrUrl}"
        >

        <div>

          <div class="library">
            Biblioteca Tchumene
          </div>

          <div class="name">
            ${escapeReaderHtml(
              currentReaderCard.NOME
            )}
          </div>

          <div class="code">
            ${escapeReaderHtml(
              currentReaderCard.CODIGO_LEITOR
            )}
          </div>

        </div>

      </div>

    </body>

    </html>
  `);


  win.document.close();


  setTimeout(
    () => {

      win.focus();

      win.print();

    },
    400
  );
}



/* HISTÓRICO */


async function showReaderProfile(
  idLeitor
) {

  try {

    const response =
      await apiGet(
        'getReaderProfile',
        {
          idLeitor:
            idLeitor
        }
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    const data =
      response.data;


    const reader =
      data.leitor;


    document.getElementById(
      'profileReaderName'
    ).textContent =
      reader.NOME;


    document.getElementById(
      'profileReaderCode'
    ).textContent =
      reader.CODIGO_LEITOR || '';


    document.getElementById(
      'profileTotalLoans'
    ).textContent =
      data.resumo.totalEmprestimos || 0;


    document.getElementById(
      'profileActiveLoans'
    ).textContent =
      data.resumo.activos || 0;


    document.getElementById(
      'profileOverdueLoans'
    ).textContent =
      data.resumo.atrasados || 0;


    document.getElementById(
      'profileBorrowBtn'
    ).onclick =
      () => {

        window.location.href =
          `loans.html?reader=${encodeURIComponent(
            reader.CODIGO_LEITOR
          )}`;
      };


    renderReaderHistory(
      data.historico || []
    );


    document.getElementById(
      'readerProfileModal'
    ).classList.remove(
      'hidden'
    );


  } catch (err) {

    showReaderMessage(
      err.message,
      'error'
    );
  }
}



function renderReaderHistory(
  history
) {

  const tbody =
    document.getElementById(
      'readerHistoryTable'
    );


  tbody.innerHTML = '';


  if (!history.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-table"
        >
          Este leitor ainda não possui empréstimos.
        </td>
      </tr>
    `;

    return;
  }


  history.forEach(loan => {

    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>

          <td>
            ${escapeReaderHtml(
              loan.CODIGO_EXEMPLAR || ''
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              loan.TITULO_LIVRO || ''
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              formatReaderDate(
                loan.DATA_EMPRESTIMO
              )
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              formatReaderDate(
                loan.DATA_DEVOLUCAO_PREVISTA
              )
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              formatReaderDate(
                loan.DATA_DEVOLUCAO_REAL
              )
            )}
          </td>

          <td>
            ${escapeReaderHtml(
              loan.ESTADO || ''
            )}
          </td>

        </tr>
      `
    );
  });
}



function closeReaderProfile() {

  document.getElementById(
    'readerProfileModal'
  ).classList.add(
    'hidden'
  );
}



/* HELPERS */


function showReaderMessage(
  message,
  type
) {

  document.getElementById(
    'readerMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeReaderHtml(
        message
      )}
    </div>
  `;
}



function formatReaderDate(
  value
) {

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



function escapeReaderHtml(
  value
) {

  return String(
    value ?? ''
  )
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
}



function escapeReaderJs(
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
