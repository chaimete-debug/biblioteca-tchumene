let productivityUser = null;


document.addEventListener(
  'DOMContentLoaded',
  async () => {

    productivityUser =
      requireAdmin();


    if (!productivityUser) {
      return;
    }


    document.getElementById(
      'userName'
    ).textContent =
      productivityUser.nome ||
      productivityUser.email ||
      '';


    setTodayProductivity(
      false
    );


    await loadProductivity();

  }
);



function getTodayLocal_() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    );


  return (
    `${year}-${month}-${day}`
  );
}



function setTodayProductivity(
  reload = true
) {

  document.getElementById(
    'productivityDate'
  ).value =
    getTodayLocal_();


  if (reload) {

    loadProductivity();

  }
}



async function loadProductivity() {

  const selectedDate =
    document.getElementById(
      'productivityDate'
    ).value ||
    getTodayLocal_();


  try {

    const res =
      await apiGet(
        'getDailyProductivity',
        {
          date:
            selectedDate
        }
      );


    if (!res.success) {

      throw new Error(
        res.message
      );

    }


    renderProductivity(
      res.data
    );


  } catch (err) {

    showProductivityMessage(
      err.message,
      'error'
    );

  }
}



function renderProductivity(
  data
) {

  const summary =
    data.resumo || {};


  document.getElementById(
    'productivityUsers'
  ).textContent =
    Number(
      summary.registadoresActivos || 0
    );


  document.getElementById(
    'productivityWorks'
  ).textContent =
    Number(
      summary.obras || 0
    );


  document.getElementById(
    'productivityCopies'
  ).textContent =
    Number(
      summary.exemplares || 0
    );


  document.getElementById(
    'productivityPeriod'
  ).textContent =
    formatProductivityDateClient_(
      data.data
    );


  const tbody =
    document.getElementById(
      'productivityTable'
    );


  tbody.innerHTML = '';


  const rows =
    Array.isArray(
      data.registadores
    )
      ? data.registadores
      : [];


  if (!rows.length) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="4"
          class="empty-table"
        >
          Não existem registos neste dia.
        </td>

      </tr>
    `;

    return;
  }


  rows.forEach(
    (item, index) => {

      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>

            <td>

              <span class="productivity-ranking">
                ${index + 1}
              </span>

            </td>


            <td>

              <span class="productivity-name">
                ${escapeProductivityHtml(
                  item.nome || ''
                )}
              </span>

              <span class="productivity-email">
                ${escapeProductivityHtml(
                  item.email || ''
                )}
              </span>

            </td>


            <td>

              <span class="productivity-big">
                ${Number(
                  item.obras || 0
                )}
              </span>

            </td>


            <td>

              <span class="productivity-big">
                ${Number(
                  item.exemplares || 0
                )}
              </span>

            </td>

          </tr>
        `
      );

    }
  );
}



function formatProductivityDateClient_(
  value
) {

  if (!value) {
    return '';
  }


  const parts =
    String(value)
      .split('-');


  if (
    parts.length !== 3
  ) {
    return value;
  }


  return (
    `${parts[2]}/${parts[1]}/${parts[0]}`
  );
}



function showProductivityMessage(
  message,
  type
) {

  document.getElementById(
    'productivityMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeProductivityHtml(
        message
      )}
    </div>
  `;
}



function escapeProductivityHtml(
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
