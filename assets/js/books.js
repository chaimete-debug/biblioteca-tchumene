let currentUser = null;

let allWorks = [];
let allCopies = [];

let scanner = null;
let scannerRunning = false;

let selectedCopyIds = new Set();

let currentQrCopy = null;



document.addEventListener(
  'DOMContentLoaded',
  async () => {

    currentUser = requireAuth();

    if (!currentUser) {
      return;
    }

    document.getElementById(
      'userName'
    ).textContent =
      currentUser.nome ||
      currentUser.email ||
      '';

    await refreshCatalog();
  }
);



/* ==========================================
   CARREGAMENTO
========================================== */


async function refreshCatalog() {

  try {

    const [
      worksResponse,
      copiesResponse
    ] = await Promise.all([
      apiGet('getWorks'),
      apiGet('getCopies')
    ]);

    if (!worksResponse.success) {
      throw new Error(
        worksResponse.message
      );
    }

    if (!copiesResponse.success) {
      throw new Error(
        copiesResponse.message
      );
    }

    allWorks =
      Array.isArray(
        worksResponse.data
      )
        ? worksResponse.data
        : [];

    allCopies =
      Array.isArray(
        copiesResponse.data
      )
        ? copiesResponse.data
        : [];

    cleanInvalidSelections();

    renderWorks();
    renderCopies();

  } catch (err) {

    showBookMessage(
      err.message,
      'error'
    );
  }
}



/* ==========================================
   CATÁLOGO
========================================== */


function renderWorks() {

  const tbody =
    document.getElementById(
      'worksTable'
    );

  const search =
    String(
      document.getElementById(
        'catalogSearch'
      )?.value || ''
    )
    .trim()
    .toLowerCase();

  tbody.innerHTML = '';

  const filtered =
    allWorks.filter(work => {

      const haystack = [
        work.ISBN,
        work.TITULO,
        work.AUTOR,
        work.CATEGORIA,
        work.EDITORA
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
          Nenhuma obra encontrada.
        </td>
      </tr>
    `;

    return;
  }

  filtered.forEach(work => {

    const copies =
      allCopies.filter(copy =>
        String(copy.ID_OBRA) ===
        String(work.ID_OBRA)
      );

    const available =
      copies.filter(copy =>
        String(
          copy.SITUACAO || ''
        )
        .toLowerCase()
        === 'disponivel'
      ).length;

    const cover =
      work.CAPA_URL
        ? `
          <img
            src="${escapeHtml(
              work.CAPA_URL
            )}"
            class="catalog-cover"
            alt=""
          >
        `
        : `
          <div class="catalog-no-cover">
            📖
          </div>
        `;

    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>

          <td>${cover}</td>

          <td>
            ${escapeHtml(
              work.ISBN || ''
            )}
          </td>

          <td>
            <strong>
              ${escapeHtml(
                work.TITULO || ''
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              work.AUTOR || ''
            )}
          </td>

          <td>
            ${escapeHtml(
              work.CATEGORIA || ''
            )}
          </td>

          <td>
            ${copies.length}
          </td>

          <td>
            <span
              class="${
                available > 0
                  ? 'status-available'
                  : 'status-unavailable'
              }"
            >
              ${available}
            </span>
          </td>

        </tr>
      `
    );
  });
}



/* ==========================================
   EXEMPLARES
========================================== */


function getFilteredCopies() {

  const search =
    String(
      document.getElementById(
        'copiesSearch'
      )?.value || ''
    )
    .trim()
    .toLowerCase();

  return allCopies.filter(copy => {

    const haystack = [
      copy.CODIGO_EXEMPLAR,
      copy.TITULO,
      copy.ISBN,
      copy.ESTANTE,
      copy.ESTADO_FISICO,
      copy.SITUACAO
    ]
    .join(' ')
    .toLowerCase();

    return haystack.includes(
      search
    );
  });
}



function renderCopies() {

  const tbody =
    document.getElementById(
      'copiesTable'
    );

  const copies =
    getFilteredCopies();

  tbody.innerHTML = '';

  if (!copies.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          Nenhum exemplar encontrado.
        </td>
      </tr>
    `;

    updateSelectionControls();

    return;
  }

  copies.forEach(copy => {

    const selected =
      selectedCopyIds.has(
        copy.ID_EXEMPLAR
      );

    const situationClass =
      getSituationClass(
        copy.SITUACAO
      );

    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>

          <td class="checkbox-column">

            <input
              type="checkbox"
              class="copy-checkbox"
              ${
                selected
                  ? 'checked'
                  : ''
              }
              onchange="
                toggleCopySelection(
                  '${escapeJsValue(
                    copy.ID_EXEMPLAR
                  )}',
                  this.checked
                )
              "
            >

          </td>

          <td>
            <strong>
              ${escapeHtml(
                copy.CODIGO_EXEMPLAR || ''
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              copy.TITULO || ''
            )}
          </td>

          <td>
            ${escapeHtml(
              copy.ISBN || '—'
            )}
          </td>

          <td>
            ${escapeHtml(
              copy.ESTANTE || '—'
            )}
          </td>

          <td>
            ${escapeHtml(
              formatPhysicalState(
                copy.ESTADO_FISICO
              )
            )}
          </td>

          <td>

            <span
              class="${situationClass}"
            >
              ${escapeHtml(
                formatSituation(
                  copy.SITUACAO
                )
              )}
            </span>

          </td>

          <td>

            <div class="copy-actions">

              <button
                class="btn btn-small"
                onclick="
                  showQrForCopyById(
                    '${escapeJsValue(
                      copy.ID_EXEMPLAR
                    )}'
                  )
                "
              >
                QR
              </button>

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  printSingleLabelById(
                    '${escapeJsValue(
                      copy.ID_EXEMPLAR
                    )}'
                  )
                "
              >
                🖨️
              </button>

            </div>

          </td>

        </tr>
      `
    );
  });

  updateSelectionControls();
}



/* ==========================================
   SELECÇÃO
========================================== */


function toggleCopySelection(
  idExemplar,
  checked
) {

  if (checked) {

    selectedCopyIds.add(
      idExemplar
    );

  } else {

    selectedCopyIds.delete(
      idExemplar
    );
  }

  updateSelectionControls();
}



function toggleAllCopies(
  checked
) {

  const copies =
    getFilteredCopies();

  copies.forEach(copy => {

    if (checked) {

      selectedCopyIds.add(
        copy.ID_EXEMPLAR
      );

    } else {

      selectedCopyIds.delete(
        copy.ID_EXEMPLAR
      );
    }
  });

  renderCopies();
}



function selectAllVisibleCopies() {

  getFilteredCopies()
    .forEach(copy => {

      selectedCopyIds.add(
        copy.ID_EXEMPLAR
      );
    });

  renderCopies();
}



function clearCopySelection() {

  selectedCopyIds.clear();

  renderCopies();
}



function updateSelectionControls() {

  const button =
    document.getElementById(
      'printSelectedBtn'
    );

  if (button) {

    button.disabled =
      selectedCopyIds.size === 0;

    button.textContent =
      selectedCopyIds.size > 0
        ? `🖨️ Imprimir Seleccionados (${selectedCopyIds.size})`
        : '🖨️ Imprimir Seleccionados';
  }

  const master =
    document.getElementById(
      'masterCopyCheckbox'
    );

  if (!master) {
    return;
  }

  const visible =
    getFilteredCopies();

  if (!visible.length) {

    master.checked = false;
    master.indeterminate = false;

    return;
  }

  const selectedVisible =
    visible.filter(copy =>
      selectedCopyIds.has(
        copy.ID_EXEMPLAR
      )
    ).length;

  master.checked =
    selectedVisible ===
    visible.length;

  master.indeterminate =
    selectedVisible > 0 &&
    selectedVisible <
    visible.length;
}



function cleanInvalidSelections() {

  const validIds =
    new Set(
      allCopies.map(
        copy =>
          copy.ID_EXEMPLAR
      )
    );

  [
    ...selectedCopyIds
  ].forEach(id => {

    if (!validIds.has(id)) {

      selectedCopyIds.delete(
        id
      );
    }
  });
}



/* ==========================================
   QR - NOVA IMPLEMENTAÇÃO
========================================== */


function ensureQrLibrary() {

  if (
    typeof QRCode ===
    'undefined'
  ) {

    throw new Error(
      'A biblioteca de QR Code não foi carregada.'
    );
  }
}



function renderQrIntoElement(
  element,
  text,
  size = 190
) {

  ensureQrLibrary();

  if (!text) {

    throw new Error(
      'Código do exemplar vazio.'
    );
  }

  element.innerHTML = '';

  new QRCode(
    element,
    {
      text:
        String(text),

      width:
        size,

      height:
        size,

      colorDark:
        '#000000',

      colorLight:
        '#ffffff',

      correctLevel:
        QRCode.CorrectLevel.M
    }
  );
}



async function generateQrDataUrl(
  text,
  size = 220
) {

  ensureQrLibrary();

  return new Promise(
    (resolve, reject) => {

      try {

        const holder =
          document.createElement(
            'div'
          );

        holder.style.position =
          'fixed';

        holder.style.left =
          '-10000px';

        holder.style.top =
          '-10000px';

        document.body.appendChild(
          holder
        );

        new QRCode(
          holder,
          {
            text:
              String(text),

            width:
              size,

            height:
              size,

            colorDark:
              '#000000',

            colorLight:
              '#ffffff',

            correctLevel:
              QRCode.CorrectLevel.M
          }
        );

        setTimeout(
          () => {

            try {

              const canvas =
                holder.querySelector(
                  'canvas'
                );

              const img =
                holder.querySelector(
                  'img'
                );

              let dataUrl = '';

              if (
                canvas &&
                typeof canvas.toDataURL ===
                'function'
              ) {

                dataUrl =
                  canvas.toDataURL(
                    'image/png'
                  );

              } else if (
                img &&
                img.src
              ) {

                dataUrl =
                  img.src;
              }

              holder.remove();

              if (!dataUrl) {

                reject(
                  new Error(
                    'Não foi possível converter o QR Code em imagem.'
                  )
                );

                return;
              }

              resolve(
                dataUrl
              );

            } catch (err) {

              holder.remove();

              reject(err);
            }

          },
          100
        );

      } catch (err) {

        reject(err);
      }
    }
  );
}



function showQrForCopyById(
  idExemplar
) {

  const copy =
    allCopies.find(item =>
      String(
        item.ID_EXEMPLAR
      ) ===
      String(
        idExemplar
      )
    );

  if (!copy) {

    showBookMessage(
      'Exemplar não encontrado.',
      'error'
    );

    return;
  }

  try {

    currentQrCopy =
      copy;

    document.getElementById(
      'qrCopyCode'
    ).textContent =
      copy.CODIGO_EXEMPLAR || '';

    document.getElementById(
      'qrBookTitle'
    ).textContent =
      copy.TITULO || '';

    const box =
      document.getElementById(
        'qrCanvasBox'
      );

    renderQrIntoElement(
      box,
      copy.CODIGO_EXEMPLAR,
      190
    );

    document.getElementById(
      'qrModal'
    ).classList.remove(
      'hidden'
    );

    clearBookMessage();

  } catch (err) {

    currentQrCopy =
      null;

    showBookMessage(
      err.message,
      'error'
    );
  }
}



function closeQrModal() {

  currentQrCopy =
    null;

  document.getElementById(
    'qrModal'
  ).classList.add(
    'hidden'
  );

  document.getElementById(
    'qrCanvasBox'
  ).innerHTML = '';
}



/* ==========================================
   IMPRESSÃO
========================================== */


async function printCurrentLabel() {

  if (!currentQrCopy) {
    return;
  }

  await printCopies(
    [currentQrCopy]
  );
}



async function printSingleLabelById(
  idExemplar
) {

  const copy =
    allCopies.find(item =>
      String(
        item.ID_EXEMPLAR
      ) ===
      String(
        idExemplar
      )
    );

  if (!copy) {

    showBookMessage(
      'Exemplar não encontrado.',
      'error'
    );

    return;
  }

  await printCopies(
    [copy]
  );
}



async function printSelectedLabels() {

  const copies =
    allCopies.filter(copy =>
      selectedCopyIds.has(
        copy.ID_EXEMPLAR
      )
    );

  if (!copies.length) {

    showBookMessage(
      'Seleccione pelo menos um exemplar.',
      'error'
    );

    return;
  }

  await printCopies(
    copies
  );
}



async function printCopies(
  copies
) {

  try {

    const prepared = [];

    for (
      const copy of copies
    ) {

      const qrDataUrl =
        await generateQrDataUrl(
          copy.CODIGO_EXEMPLAR,
          220
        );

      prepared.push({
        ...copy,
        qrDataUrl
      });
    }

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=900,height=700'
      );

    if (!printWindow) {

      throw new Error(
        'O navegador bloqueou a janela de impressão.'
      );
    }

    const labels =
      prepared.map(copy => `
        <div class="label">

          <div class="library">
            Biblioteca Tchumene
          </div>

          <img
            src="${copy.qrDataUrl}"
            class="qr"
            alt="QR"
          >

          <div class="code">
            ${escapeHtml(
              copy.CODIGO_EXEMPLAR || ''
            )}
          </div>

          <div class="title">
            ${escapeHtml(
              copy.TITULO || ''
            )}
          </div>

          ${
            copy.ESTANTE
              ? `
                <div class="shelf">
                  Estante:
                  ${escapeHtml(
                    copy.ESTANTE
                  )}
                </div>
              `
              : ''
          }

        </div>
      `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Etiquetas - Biblioteca Tchumene
        </title>

        <style>

          @page {
            margin: 8mm;
          }

          * {
            box-sizing:
              border-box;
          }

          body {
            margin: 0;
            font-family:
              Arial,
              sans-serif;
          }

          .sheet {
            display: grid;

            grid-template-columns:
              repeat(
                auto-fill,
                minmax(
                  55mm,
                  1fr
                )
              );

            gap: 5mm;
          }

          .label {
            width: 55mm;
            min-height: 70mm;

            border:
              1px solid #000;

            padding: 4mm;

            text-align:
              center;

            break-inside:
              avoid;

            page-break-inside:
              avoid;
          }

          .library {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 2mm;
          }

          .qr {
            width: 35mm;
            height: 35mm;
            object-fit: contain;
          }

          .code {
            margin-top: 2mm;
            font-size: 13pt;
            font-weight: bold;
            letter-spacing:
              0.5px;
          }

          .title {
            margin-top: 2mm;
            font-size: 9pt;
            line-height: 1.2;
          }

          .shelf {
            margin-top: 2mm;
            font-size: 8pt;
          }

        </style>

      </head>

      <body>

        <div class="sheet">
          ${labels}
        </div>

      </body>

      </html>
    `);

    printWindow.document.close();

    setTimeout(
      () => {

        printWindow.focus();
        printWindow.print();

      },
      500
    );

  } catch (err) {

    showBookMessage(
      err.message,
      'error'
    );
  }
}



/* ==========================================
   ISBN
========================================== */


async function searchISBN() {

  const isbn =
    document.getElementById(
      'isbn'
    ).value.trim();

  if (!isbn) {

    showBookMessage(
      'Introduza ou digitalize um ISBN.',
      'error'
    );

    return;
  }

  showBookMessage(
    'A procurar dados do livro...',
    'info'
  );

  try {

    const response =
      await apiGet(
        'lookupISBN',
        {
          isbn
        }
      );

    if (!response.success) {

      throw new Error(
        response.message
      );
    }

    const result =
      response.data || {};

    if (result.obra) {

      fillBookForm(
        result.obra
      );
    }

    if (result.existente) {

      showBookMessage(
        'Esta obra já existe. Pode adicionar novos exemplares.',
        'info'
      );

    } else if (
      result.encontrado
    ) {

      showBookMessage(
        `Dados encontrados através de ${result.fonte}. Confirme antes de guardar.`,
        'success'
      );

    } else {

      showBookMessage(
        'ISBN não encontrado. Preencha os restantes dados manualmente.',
        'info'
      );
    }

  } catch (err) {

    showBookMessage(
      err.message,
      'error'
    );
  }
}



function fillBookForm(
  work
) {

  setValue(
    'isbn',
    work.ISBN
  );

  setValue(
    'titulo',
    work.TITULO
  );

  setValue(
    'autor',
    work.AUTOR
  );

  setValue(
    'categoria',
    work.CATEGORIA
  );

  setValue(
    'editora',
    work.EDITORA
  );

  setValue(
    'ano',
    work.ANO
  );

  setValue(
    'idioma',
    work.IDIOMA
  );

  setValue(
    'edicao',
    work.EDICAO
  );

  setValue(
    'descricao',
    work.DESCRICAO
  );

  setValue(
    'capaUrl',
    work.CAPA_URL
  );

  updateCoverPreview(
    work.CAPA_URL
  );
}



function setValue(
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



function updateCoverPreview(
  url
) {

  const img =
    document.getElementById(
      'coverPreview'
    );

  const placeholder =
    document.getElementById(
      'coverPlaceholder'
    );

  if (url) {

    img.src =
      url;

    img.style.display =
      'block';

    placeholder.style.display =
      'none';

  } else {

    img.removeAttribute(
      'src'
    );

    img.style.display =
      'none';

    placeholder.style.display =
      'flex';
  }
}



/* ==========================================
   GUARDAR LIVRO
========================================== */


async function saveBook() {

  const btn =
    document.getElementById(
      'saveBookBtn'
    );

  const titulo =
    document.getElementById(
      'titulo'
    ).value.trim();

  const quantidade =
    Number(
      document.getElementById(
        'quantidade'
      ).value
    );

  if (!titulo) {

    showBookMessage(
      'O título é obrigatório.',
      'error'
    );

    return;
  }

  if (
    !Number.isInteger(
      quantidade
    ) ||
    quantidade < 1
  ) {

    showBookMessage(
      'Informe uma quantidade válida de exemplares.',
      'error'
    );

    return;
  }

  const payload = {

    action:
      'saveWorkAndCopies',

    isbn:
      document.getElementById(
        'isbn'
      ).value.trim(),

    titulo:
      titulo,

    autor:
      document.getElementById(
        'autor'
      ).value.trim(),

    categoria:
      document.getElementById(
        'categoria'
      ).value.trim(),

    editora:
      document.getElementById(
        'editora'
      ).value.trim(),

    ano:
      document.getElementById(
        'ano'
      ).value.trim(),

    idioma:
      document.getElementById(
        'idioma'
      ).value.trim(),

    edicao:
      document.getElementById(
        'edicao'
      ).value.trim(),

    descricao:
      document.getElementById(
        'descricao'
      ).value.trim(),

    capaUrl:
      document.getElementById(
        'capaUrl'
      ).value.trim(),

    quantidade:
      quantidade,

    estante:
      document.getElementById(
        'estante'
      ).value.trim(),

    estadoFisico:
      document.getElementById(
        'estadoFisico'
      ).value,

    operador:
      currentUser.email ||
      currentUser.nome ||
      ''
  };

  btn.disabled =
    true;

  btn.textContent =
    'A guardar...';

  try {

    const response =
      await apiPost(
        payload
      );

    if (!response.success) {

      throw new Error(
        response.message
      );
    }

    showBookMessage(
      response.message,
      'success'
    );

    clearBookForm();

    await refreshCatalog();

  } catch (err) {

    showBookMessage(
      err.message,
      'error'
    );

  } finally {

    btn.disabled =
      false;

    btn.textContent =
      'Guardar Livro';
  }
}



function clearBookForm() {

  [
    'isbn',
    'titulo',
    'autor',
    'categoria',
    'editora',
    'ano',
    'idioma',
    'edicao',
    'descricao',
    'capaUrl',
    'estante'
  ]
  .forEach(id => {

    setValue(
      id,
      ''
    );
  });

  setValue(
    'quantidade',
    '1'
  );

  document.getElementById(
    'estadoFisico'
  ).value =
    'bom';

  updateCoverPreview('');

  clearBookMessage();
}



/* ==========================================
   CÂMARA ISBN
========================================== */


function openScanner() {

  const modal =
    document.getElementById(
      'scannerModal'
    );

  modal.classList.remove(
    'hidden'
  );

  if (
    typeof Html5Qrcode ===
    'undefined'
  ) {

    showBookMessage(
      'O leitor de código de barras não foi carregado.',
      'error'
    );

    closeScanner();

    return;
  }

  scanner =
    new Html5Qrcode(
      'reader'
    );

  scanner.start(

    {
      facingMode:
        'environment'
    },

    {
      fps: 10,

      qrbox: {
        width: 280,
        height: 140
      },

      aspectRatio:
        1.777778,

      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128
      ]
    },

    async decodedText => {

      const code =
        String(
          decodedText || ''
        )
        .replace(
          /[^0-9Xx]/g,
          ''
        );

      if (
        code.length !== 10 &&
        code.length !== 13
      ) {

        return;
      }

      document.getElementById(
        'isbn'
      ).value =
        code;

      await closeScanner();

      await searchISBN();
    },

    () => {}

  )
  .then(() => {

    scannerRunning =
      true;

  })
  .catch(() => {

    scannerRunning =
      false;

    showBookMessage(
      'Não foi possível abrir a câmara. Verifique as permissões.',
      'error'
    );

    closeScanner();
  });
}



async function closeScanner() {

  const modal =
    document.getElementById(
      'scannerModal'
    );

  if (
    scanner &&
    scannerRunning
  ) {

    try {

      await scanner.stop();

    } catch (err) {}
  }

  scannerRunning =
    false;

  scanner =
    null;

  const reader =
    document.getElementById(
      'reader'
    );

  if (reader) {

    reader.innerHTML = '';
  }

  modal.classList.add(
    'hidden'
  );
}



/* ==========================================
   FORMATAÇÃO
========================================== */


function formatPhysicalState(
  value
) {

  const map = {
    novo: 'Novo',
    bom: 'Bom',
    razoavel: 'Razoável',
    danificado: 'Danificado'
  };

  return map[
    String(value || '')
    .toLowerCase()
  ] || value || '';
}



function formatSituation(
  value
) {

  const map = {
    disponivel: 'Disponível',
    emprestado: 'Emprestado',
    reservado: 'Reservado',
    perdido: 'Perdido',
    danificado: 'Danificado',
    inactivo: 'Inactivo'
  };

  return map[
    String(value || '')
    .toLowerCase()
  ] || value || '';
}



function getSituationClass(
  value
) {

  const status =
    String(
      value || ''
    )
    .toLowerCase();

  if (
    status ===
    'disponivel'
  ) {

    return 'status-available';
  }

  if (
    status ===
    'emprestado'
  ) {

    return 'status-loaned';
  }

  return 'status-neutral';
}



/* ==========================================
   MENSAGENS
========================================== */


function showBookMessage(
  message,
  type = 'info'
) {

  document.getElementById(
    'bookMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeHtml(
        message
      )}
    </div>
  `;
}



function clearBookMessage() {

  const box =
    document.getElementById(
      'bookMsg'
    );

  if (box) {

    box.innerHTML = '';
  }
}



function escapeHtml(
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
