let circulationUser = null;

let readers = [];
let openLoans = [];

let selectedReader = null;
let selectedCopy = null;
let selectedReturnLoan = null;

let circulationScanner = null;
let circulationScannerRunning = false;

let scannerMode = '';



document.addEventListener(
  'DOMContentLoaded',
  async () => {

    circulationUser =
      requireAuth();


    if (!circulationUser) {
      return;
    }


    document.getElementById(
      'userName'
    ).textContent =
      circulationUser.nome ||
      circulationUser.email ||
      '';


    await loadReaders();

    await loadOpenLoans();


    /*
     * Se veio da página do leitor:
     *
     * loans.html?reader=LEI-000001
     */
    const params =
      new URLSearchParams(
        window.location.search
      );


    const readerCode =
      params.get(
        'reader'
      );


    if (readerCode) {

      document.getElementById(
        'readerCode'
      ).value =
        readerCode;


      await findReaderByCode();
    }

  }
);



/* ===================================
   LEITORES
=================================== */


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


    readers =
      Array.isArray(
        response.data
      )
        ? response.data
        : [];


    const select =
      document.getElementById(
        'loanReader'
      );


    select.innerHTML = `
      <option value="">
        Seleccione o leitor
      </option>
    `;


    readers
      .filter(reader =>
        String(
          reader.ESTADO || ''
        )
        .toLowerCase()
        === 'activo'
      )
      .sort((a, b) =>
        String(
          a.NOME || ''
        )
        .localeCompare(
          String(
            b.NOME || ''
          )
        )
      )
      .forEach(reader => {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          reader.ID_LEITOR;


        option.textContent =
          `${reader.NOME}${
            reader.CODIGO_LEITOR
              ? ' - ' +
                reader.CODIGO_LEITOR
              : ''
          }`;


        select.appendChild(
          option
        );
      });


  } catch (err) {

    showLoanMessage(
      err.message,
      'error'
    );
  }
}



async function findReaderByCode() {

  const code =
    normalizeClientCode(
      document.getElementById(
        'readerCode'
      ).value
    );


  if (!code) {

    showLoanMessage(
      'Informe o código do leitor.',
      'error'
    );

    return;
  }


  showLoanMessage(
    'A procurar leitor...',
    'info'
  );


  try {

    const response =
      await apiGet(
        'getReaderByCode',
        {
          code: code
        }
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    const reader =
      response.data;


    if (
      String(
        reader.ESTADO || ''
      )
      .toLowerCase()
      !== 'activo'
    ) {

      throw new Error(
        'Este leitor encontra-se inactivo.'
      );
    }


    selectedReader =
      reader;


    document.getElementById(
      'readerCode'
    ).value =
      reader.CODIGO_LEITOR || '';


    document.getElementById(
      'loanReader'
    ).value =
      reader.ID_LEITOR;


    renderReaderPreview(
      reader
    );


    showLoanMessage(
      'Leitor identificado. Agora digitalize ou introduza o código do exemplar.',
      'success'
    );


    updateBorrowButton();


  } catch (err) {

    selectedReader =
      null;


    document.getElementById(
      'loanReader'
    ).value = '';


    hideElement(
      'readerPreview'
    );


    updateBorrowButton();


    showLoanMessage(
      err.message,
      'error'
    );
  }
}



function selectReaderFromDropdown() {

  const idLeitor =
    document.getElementById(
      'loanReader'
    ).value;


  if (!idLeitor) {

    selectedReader =
      null;


    document.getElementById(
      'readerCode'
    ).value = '';


    hideElement(
      'readerPreview'
    );


    updateBorrowButton();

    return;
  }


  const reader =
    readers.find(item =>
      String(
        item.ID_LEITOR
      ) ===
      String(
        idLeitor
      )
    );


  if (!reader) {

    selectedReader =
      null;

    updateBorrowButton();

    return;
  }


  selectedReader =
    reader;


  document.getElementById(
    'readerCode'
  ).value =
    reader.CODIGO_LEITOR || '';


  renderReaderPreview(
    reader
  );


  updateBorrowButton();
}



function renderReaderPreview(
  reader
) {

  const box =
    document.getElementById(
      'readerPreview'
    );


  box.innerHTML = `
    <div>
      <strong>
        ${escapeCirculationHtml(
          reader.NOME || ''
        )}
      </strong>
    </div>

    <div>
      Código:
      <strong>
        ${escapeCirculationHtml(
          reader.CODIGO_LEITOR || ''
        )}
      </strong>
    </div>

    <div>
      Telefone:
      ${escapeCirculationHtml(
        reader.TELEFONE || '—'
      )}
    </div>

    <div>
      Tipo:
      ${escapeCirculationHtml(
        reader.TIPO_LEITOR || '—'
      )}
    </div>

    <div>
      Estado:
      <strong>
        ${escapeCirculationHtml(
          reader.ESTADO || ''
        )}
      </strong>
    </div>
  `;


  box.classList.remove(
    'hidden'
  );
}



/* ===================================
   EXEMPLARES
=================================== */


async function findLoanCopy() {

  const code =
    normalizeClientCode(
      document.getElementById(
        'loanCopyCode'
      ).value
    );


  if (!code) {

    showLoanMessage(
      'Informe o código do exemplar.',
      'error'
    );

    return;
  }


  showLoanMessage(
    'A procurar exemplar...',
    'info'
  );


  try {

    const response =
      await apiGet(
        'getCopyByCode',
        {
          code: code
        }
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    const copy =
      response.data;


    if (
      String(
        copy.SITUACAO || ''
      )
      .toLowerCase()
      !== 'disponivel'
    ) {

      throw new Error(
        `O exemplar ${copy.CODIGO_EXEMPLAR} encontra-se ${copy.SITUACAO}.`
      );
    }


    selectedCopy =
      copy;


    document.getElementById(
      'loanCopyCode'
    ).value =
      copy.CODIGO_EXEMPLAR;


    renderLoanCopyPreview(
      copy
    );


    showLoanMessage(
      selectedReader
        ? 'Leitor e exemplar identificados. Confirme o empréstimo.'
        : 'Exemplar identificado. Falta identificar o leitor.',
      selectedReader
        ? 'success'
        : 'info'
    );


    updateBorrowButton();


  } catch (err) {

    selectedCopy =
      null;


    hideElement(
      'loanCopyPreview'
    );


    updateBorrowButton();


    showLoanMessage(
      err.message,
      'error'
    );
  }
}



function renderLoanCopyPreview(
  copy
) {

  const box =
    document.getElementById(
      'loanCopyPreview'
    );


  box.innerHTML = `
    <div>
      <strong>
        ${escapeCirculationHtml(
          copy.TITULO || ''
        )}
      </strong>
    </div>

    <div>
      Exemplar:
      <strong>
        ${escapeCirculationHtml(
          copy.CODIGO_EXEMPLAR || ''
        )}
      </strong>
    </div>

    <div>
      ISBN:
      ${escapeCirculationHtml(
        copy.ISBN || '—'
      )}
    </div>

    <div>
      Estante:
      ${escapeCirculationHtml(
        copy.ESTANTE || '—'
      )}
    </div>

    <div>
      Situação:
      <strong>
        ${escapeCirculationHtml(
          copy.SITUACAO || ''
        )}
      </strong>
    </div>
  `;


  box.classList.remove(
    'hidden'
  );
}



/* ===================================
   CONFIRMAR EMPRÉSTIMO
=================================== */


function updateBorrowButton() {

  document.getElementById(
    'borrowBtn'
  ).disabled =
    !selectedReader ||
    !selectedCopy;
}



async function confirmBorrow() {

  if (!selectedReader) {

    showLoanMessage(
      'Primeiro identifique o leitor.',
      'error'
    );

    return;
  }


  if (!selectedCopy) {

    showLoanMessage(
      'Primeiro identifique o exemplar.',
      'error'
    );

    return;
  }


  const btn =
    document.getElementById(
      'borrowBtn'
    );


  btn.disabled =
    true;


  btn.textContent =
    'A registar...';


  try {

    const response =
      await apiPost({

        action:
          'borrowCopyByCode',

        codigoExemplar:
          selectedCopy
            .CODIGO_EXEMPLAR,

        idLeitor:
          selectedReader
            .ID_LEITOR,

        operador:
          circulationUser.email ||
          circulationUser.nome ||
          ''

      });


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    showLoanMessage(
      `${response.message}. Devolução prevista: ${response.data.dataPrevista}`,
      'success'
    );


    clearLoanForm(
      false
    );


    await loadOpenLoans();


  } catch (err) {

    showLoanMessage(
      err.message,
      'error'
    );


  } finally {

    btn.textContent =
      'Confirmar Empréstimo';


    updateBorrowButton();
  }
}



/* ===================================
   DEVOLUÇÃO
=================================== */


async function findReturnLoan() {

  const code =
    normalizeClientCode(
      document.getElementById(
        'returnCopyCode'
      ).value
    );


  if (!code) {

    showReturnMessage(
      'Informe o código do exemplar.',
      'error'
    );

    return;
  }


  showReturnMessage(
    'A procurar empréstimo...',
    'info'
  );


  try {

    const response =
      await apiGet(
        'getActiveLoanByCopyCode',
        {
          code: code
        }
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    selectedReturnLoan =
      response.data;


    document.getElementById(
      'returnCopyCode'
    ).value =
      selectedReturnLoan
        .CODIGO_EXEMPLAR;


    renderReturnPreview(
      selectedReturnLoan
    );


    document.getElementById(
      'returnBtn'
    ).disabled =
      false;


    showReturnMessage(
      'Empréstimo localizado. Confirme a devolução.',
      'success'
    );


  } catch (err) {

    selectedReturnLoan =
      null;


    document.getElementById(
      'returnBtn'
    ).disabled =
      true;


    hideElement(
      'returnPreview'
    );


    showReturnMessage(
      err.message,
      'error'
    );
  }
}



function renderReturnPreview(
  loan
) {

  const box =
    document.getElementById(
      'returnPreview'
    );


  box.innerHTML = `
    <div>
      <strong>
        ${escapeCirculationHtml(
          loan.TITULO_LIVRO || ''
        )}
      </strong>
    </div>

    <div>
      Exemplar:
      <strong>
        ${escapeCirculationHtml(
          loan.CODIGO_EXEMPLAR || ''
        )}
      </strong>
    </div>

    <div>
      Leitor:
      ${escapeCirculationHtml(
        loan.NOME_LEITOR || ''
      )}
    </div>

    <div>
      Empréstimo:
      ${escapeCirculationHtml(
        formatClientDate(
          loan.DATA_EMPRESTIMO
        )
      )}
    </div>

    <div>
      Devolução prevista:
      <strong>
        ${escapeCirculationHtml(
          formatClientDate(
            loan.DATA_DEVOLUCAO_PREVISTA
          )
        )}
      </strong>
    </div>
  `;


  box.classList.remove(
    'hidden'
  );
}



async function confirmReturn() {

  if (!selectedReturnLoan) {

    showReturnMessage(
      'Primeiro localize o empréstimo.',
      'error'
    );

    return;
  }


  const btn =
    document.getElementById(
      'returnBtn'
    );


  btn.disabled =
    true;


  btn.textContent =
    'A devolver...';


  try {

    const response =
      await apiPost({

        action:
          'returnCopyByCode',

        codigoExemplar:
          selectedReturnLoan
            .CODIGO_EXEMPLAR,

        operador:
          circulationUser.email ||
          circulationUser.nome ||
          ''

      });


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    const result =
      response.data;


    let message =
      response.message;


    if (
      Number(
        result.diasAtraso || 0
      ) > 0
    ) {

      message +=
        ` | Atraso: ${result.diasAtraso} dia(s)`;
    }


    if (
      Number(
        result.multa || 0
      ) > 0
    ) {

      message +=
        ` | Multa: ${result.multa}`;
    }


    showReturnMessage(
      message,
      'success'
    );


    clearReturnForm(
      false
    );


    await loadOpenLoans();


  } catch (err) {

    showReturnMessage(
      err.message,
      'error'
    );


  } finally {

    btn.textContent =
      'Confirmar Devolução';


    btn.disabled =
      !selectedReturnLoan;
  }
}



/* ===================================
   EMPRÉSTIMOS ACTIVOS
=================================== */


async function loadOpenLoans() {

  try {

    const response =
      await apiGet(
        'getOpenLoans'
      );


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    openLoans =
      Array.isArray(
        response.data
      )
        ? response.data
        : [];


    renderOpenLoans();


  } catch (err) {

    showLoanMessage(
      err.message,
      'error'
    );
  }
}



function renderOpenLoans() {

  const tbody =
    document.getElementById(
      'loansTable'
    );


  const search =
    String(
      document.getElementById(
        'loanSearch'
      )?.value || ''
    )
    .trim()
    .toLowerCase();


  tbody.innerHTML = '';


  const filtered =
    openLoans.filter(
      loan => {

        const haystack = [
          loan.CODIGO_EXEMPLAR,
          loan.TITULO_LIVRO,
          loan.NOME_LEITOR,
          loan.ISBN
        ]
        .join(' ')
        .toLowerCase();


        return haystack.includes(
          search
        );
      }
    );


  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="7"
          class="empty-table"
        >
          Não existem empréstimos activos.
        </td>

      </tr>
    `;

    return;
  }


  filtered.forEach(
    loan => {

      const overdue =
        isLoanOverdue(
          loan
        );


      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>
              <strong>
                ${escapeCirculationHtml(
                  loan.CODIGO_EXEMPLAR || ''
                )}
              </strong>
            </td>

            <td>
              ${escapeCirculationHtml(
                loan.TITULO_LIVRO || ''
              )}
            </td>

            <td>
              ${escapeCirculationHtml(
                loan.NOME_LEITOR || ''
              )}
            </td>

            <td>
              ${escapeCirculationHtml(
                formatClientDate(
                  loan.DATA_EMPRESTIMO
                )
              )}
            </td>

            <td>
              ${escapeCirculationHtml(
                formatClientDate(
                  loan.DATA_DEVOLUCAO_PREVISTA
                )
              )}
            </td>

            <td>

              <span
                class="${
                  overdue
                    ? 'status-overdue'
                    : 'status-active'
                }"
              >
                ${
                  overdue
                    ? 'Atrasado'
                    : 'Activo'
                }
              </span>

            </td>

            <td>

              <button
                class="btn btn-small"
                onclick="
                  prepareReturnFromTable(
                    '${escapeJsValue(
                      loan.CODIGO_EXEMPLAR
                    )}'
                  )
                "
              >
                Devolver
              </button>

            </td>

          </tr>
        `
      );
    }
  );
}



function prepareReturnFromTable(
  code
) {

  document.getElementById(
    'returnCopyCode'
  ).value =
    code;


  document.getElementById(
    'returnCopyCode'
  ).scrollIntoView({
    behavior:
      'smooth',

    block:
      'center'
  });


  findReturnLoan();
}



/* ===================================
   SCANNER
=================================== */


function openReaderScanner() {

  scannerMode =
    'reader';


  document.getElementById(
    'scannerTitle'
  ).textContent =
    'Digitalizar Leitor';


  document.getElementById(
    'scannerDescription'
  ).textContent =
    'Aponte a câmara para o QR do cartão do leitor.';


  document.getElementById(
    'scannerHelpText'
  ).innerHTML =
    'O QR deve conter um código como <strong>LEI-000001</strong>.';


  openCirculationScanner();
}



function openLoanScanner() {

  scannerMode =
    'loan';


  document.getElementById(
    'scannerTitle'
  ).textContent =
    'Digitalizar Exemplar';


  document.getElementById(
    'scannerDescription'
  ).textContent =
    'Aponte a câmara para o QR da etiqueta do livro.';


  document.getElementById(
    'scannerHelpText'
  ).innerHTML =
    'O QR deve conter um código como <strong>EXE-000001</strong>.';


  openCirculationScanner();
}



function openReturnScanner() {

  scannerMode =
    'return';


  document.getElementById(
    'scannerTitle'
  ).textContent =
    'Digitalizar Devolução';


  document.getElementById(
    'scannerDescription'
  ).textContent =
    'Aponte a câmara para o QR do exemplar devolvido.';


  document.getElementById(
    'scannerHelpText'
  ).innerHTML =
    'O QR deve conter um código como <strong>EXE-000001</strong>.';


  openCirculationScanner();
}



function openCirculationScanner() {

  const modal =
    document.getElementById(
      'circulationScannerModal'
    );


  modal.classList.remove(
    'hidden'
  );


  if (
    typeof Html5Qrcode ===
    'undefined'
  ) {

    showScannerError(
      'O leitor QR não foi carregado.'
    );

    closeCirculationScanner();

    return;
  }


  circulationScanner =
    new Html5Qrcode(
      'circulationReader'
    );


  circulationScanner
    .start(

      {
        facingMode:
          'environment'
      },

      {
        fps: 10,

        qrbox: {
          width: 260,
          height: 260
        },

        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      },

      async decodedText => {

        const code =
          normalizeClientCode(
            decodedText
          );


        if (!code) {
          return;
        }


        /*
         * Filtrar para evitar
         * QR de tipo errado.
         */

        if (
          scannerMode ===
          'reader' &&
          !code.startsWith(
            'LEI-'
          )
        ) {

          return;
        }


        if (
          (
            scannerMode ===
            'loan' ||
            scannerMode ===
            'return'
          ) &&
          !code.startsWith(
            'EXE-'
          )
        ) {

          return;
        }


        await closeCirculationScanner();


        if (
          scannerMode ===
          'reader'
        ) {

          document.getElementById(
            'readerCode'
          ).value =
            code;


          await findReaderByCode();

          return;
        }


        if (
          scannerMode ===
          'loan'
        ) {

          document.getElementById(
            'loanCopyCode'
          ).value =
            code;


          await findLoanCopy();

          return;
        }


        if (
          scannerMode ===
          'return'
        ) {

          document.getElementById(
            'returnCopyCode'
          ).value =
            code;


          await findReturnLoan();
        }
      },

      () => {
        // Leituras sem resultado são normais.
      }

    )
    .then(() => {

      circulationScannerRunning =
        true;

    })
    .catch(() => {

      circulationScannerRunning =
        false;


      showScannerError(
        'Não foi possível abrir a câmara. Verifique as permissões do navegador.'
      );


      closeCirculationScanner();
    });
}



function showScannerError(
  message
) {

  if (
    scannerMode ===
    'return'
  ) {

    showReturnMessage(
      message,
      'error'
    );

  } else {

    showLoanMessage(
      message,
      'error'
    );
  }
}



async function closeCirculationScanner() {

  if (
    circulationScanner &&
    circulationScannerRunning
  ) {

    try {

      await circulationScanner.stop();

    } catch (err) {}
  }


  circulationScannerRunning =
    false;


  circulationScanner =
    null;


  const reader =
    document.getElementById(
      'circulationReader'
    );


  if (reader) {

    reader.innerHTML = '';
  }


  document.getElementById(
    'circulationScannerModal'
  ).classList.add(
    'hidden'
  );
}



/* ===================================
   LIMPEZA
=================================== */


function clearLoanForm(
  clearMessage = true
) {

  selectedReader =
    null;


  selectedCopy =
    null;


  document.getElementById(
    'readerCode'
  ).value = '';


  document.getElementById(
    'loanReader'
  ).value = '';


  document.getElementById(
    'loanCopyCode'
  ).value = '';


  hideElement(
    'readerPreview'
  );


  hideElement(
    'loanCopyPreview'
  );


  updateBorrowButton();


  if (clearMessage) {

    document.getElementById(
      'loanMsg'
    ).innerHTML = '';
  }
}



function clearReturnForm(
  clearMessage = true
) {

  selectedReturnLoan =
    null;


  document.getElementById(
    'returnCopyCode'
  ).value = '';


  hideElement(
    'returnPreview'
  );


  document.getElementById(
    'returnBtn'
  ).disabled =
    true;


  if (clearMessage) {

    document.getElementById(
      'returnMsg'
    ).innerHTML = '';
  }
}



/* ===================================
   HELPERS
=================================== */


function showLoanMessage(
  message,
  type
) {

  document.getElementById(
    'loanMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeCirculationHtml(
        message
      )}
    </div>
  `;
}



function showReturnMessage(
  message,
  type
) {

  document.getElementById(
    'returnMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeCirculationHtml(
        message
      )}
    </div>
  `;
}



function hideElement(
  id
) {

  const el =
    document.getElementById(
      id
    );


  if (el) {

    el.classList.add(
      'hidden'
    );
  }
}



function normalizeClientCode(
  value
) {

  return String(
    value || ''
  )
  .trim()
  .toUpperCase();
}



function formatClientDate(
  value
) {

  if (!value) {
    return '';
  }


  const date =
    new Date(
      value
    );


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return String(
      value
    );
  }


  return date
    .toLocaleString(
      'pt-PT'
    );
}



function isLoanOverdue(
  loan
) {

  if (
    String(
      loan.ESTADO || ''
    )
    .toLowerCase()
    !== 'activo'
  ) {

    return false;
  }


  const due =
    new Date(
      loan.DATA_DEVOLUCAO_PREVISTA
    );


  if (
    isNaN(
      due.getTime()
    )
  ) {

    return false;
  }


  return due <
    new Date();
}



function escapeCirculationHtml(
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



function escapeJsValue(
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
