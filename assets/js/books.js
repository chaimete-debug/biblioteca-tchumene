let currentUser = null;

let allWorks = [];
let allCopies = [];

let scanner = null;
let scannerRunning = false;


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    currentUser = requireAuth();

    if (!currentUser) return;

    document.getElementById(
      'userName'
    ).textContent =
      currentUser.nome ||
      currentUser.email ||
      '';

    await refreshCatalog();
  }
);


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

    allWorks = Array.isArray(
      worksResponse.data
    )
      ? worksResponse.data
      : [];

    allCopies = Array.isArray(
      copiesResponse.data
    )
      ? copiesResponse.data
      : [];

    renderWorks();

  } catch (err) {

    showBookMessage(
      err.message,
      'error'
    );
  }
}


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

  const filtered = allWorks.filter(
    work => {

      const haystack = [
        work.ISBN,
        work.TITULO,
        work.AUTOR,
        work.CATEGORIA,
        work.EDITORA
      ]
      .join(' ')
      .toLowerCase();

      return haystack.includes(search);
    }
  );

  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          Nenhuma obra encontrada.
        </td>
      </tr>
    `;

    return;
  }


  filtered.forEach(work => {

    const copies = allCopies.filter(
      copy =>
        String(copy.ID_OBRA) ===
        String(work.ID_OBRA)
    );

    const available =
      copies.filter(
        copy =>
          String(
            copy.SITUACAO || ''
          ).toLowerCase()
          === 'disponivel'
      ).length;


    const cover = work.CAPA_URL
      ? `
        <img
          src="${escapeHtml(work.CAPA_URL)}"
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
            ${escapeHtml(work.ISBN || '')}
          </td>

          <td>
            <strong>
              ${escapeHtml(work.TITULO || '')}
            </strong>
          </td>

          <td>
            ${escapeHtml(work.AUTOR || '')}
          </td>

          <td>
            ${escapeHtml(work.CATEGORIA || '')}
          </td>

          <td>${copies.length}</td>

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

    const response = await apiGet(
      'lookupISBN',
      { isbn }
    );

    if (!response.success) {
      throw new Error(
        response.message
      );
    }

    const result = response.data || {};

    if (result.obra) {
      fillBookForm(
        result.obra
      );
    }


    if (result.existente) {

      showBookMessage(
        'Esta obra já existe na biblioteca. Pode indicar a quantidade para adicionar novos exemplares.',
        'info'
      );

    } else if (result.encontrado) {

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


function fillBookForm(work) {

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


function setValue(id, value) {

  const el =
    document.getElementById(id);

  if (el) {
    el.value =
      value == null
        ? ''
        : value;
  }
}


function updateCoverPreview(url) {

  const img =
    document.getElementById(
      'coverPreview'
    );

  const placeholder =
    document.getElementById(
      'coverPlaceholder'
    );

  if (url) {

    img.src = url;
    img.style.display = 'block';
    placeholder.style.display =
      'none';

  } else {

    img.removeAttribute('src');
    img.style.display = 'none';
    placeholder.style.display =
      'flex';
  }
}


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
    !Number.isInteger(quantidade) ||
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

    titulo: titulo,

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

    quantidade: quantidade,

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


  btn.disabled = true;
  btn.textContent =
    'A guardar...';


  try {

    const response =
      await apiPost(payload);

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

    btn.disabled = false;
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
  ].forEach(id => {
    setValue(id, '');
  });


  setValue(
    'quantidade',
    '1'
  );


  document.getElementById(
    'estadoFisico'
  ).value = 'bom';


  updateCoverPreview('');

  clearBookMessage();
}


/* ===============================
   CÂMARA / BARCODE
================================ */


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


  const config = {

    fps: 10,

    qrbox: {
      width: 280,
      height: 140
    },

    aspectRatio: 1.777778,

    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128
    ]
  };


  scanner.start(
    {
      facingMode:
        'environment'
    },

    config,

    async decodedText => {

      const code =
        String(decodedText || '')
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
      ).value = code;


      await closeScanner();

      await searchISBN();
    },

    () => {
      // Erros durante leitura são normais.
    }

  )
  .then(() => {
    scannerRunning = true;
  })
  .catch(err => {

    scannerRunning = false;

    showBookMessage(
      'Não foi possível abrir a câmara. Verifique a permissão do navegador.',
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
    } catch (err) {
      // Ignorar.
    }
  }


  scannerRunning = false;
  scanner = null;


  const reader =
    document.getElementById(
      'reader'
    );

  reader.innerHTML = '';


  modal.classList.add(
    'hidden'
  );
}


/* ===============================
   MENSAGENS
================================ */


function showBookMessage(
  message,
  type = 'info'
) {

  const box =
    document.getElementById(
      'bookMsg'
    );

  box.innerHTML = `
    <div class="message ${type}">
      ${escapeHtml(message)}
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


function escapeHtml(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
