let accountUser = null;


document.addEventListener(
  'DOMContentLoaded',
  () => {

    accountUser =
      requireAuth();

    if (!accountUser) {
      return;
    }


    document.getElementById(
      'userName'
    ).textContent =
      accountUser.nome ||
      accountUser.email ||
      '';
  }
);



async function handleChangePassword() {

  const currentPassword =
    document.getElementById(
      'currentPassword'
    ).value;


  const newPassword =
    document.getElementById(
      'newPassword'
    ).value;


  const confirmPassword =
    document.getElementById(
      'confirmPassword'
    ).value;


  const btn =
    document.getElementById(
      'changePasswordBtn'
    );


  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {

    showAccountMessage(
      'Preencha todos os campos.',
      'error'
    );

    return;
  }


  if (
    newPassword !==
    confirmPassword
  ) {

    showAccountMessage(
      'A confirmação não coincide com a nova password.',
      'error'
    );

    return;
  }


  if (
    newPassword.length < 6
  ) {

    showAccountMessage(
      'A nova password deve possuir pelo menos 6 caracteres.',
      'error'
    );

    return;
  }


  btn.disabled = true;

  btn.textContent =
    'A alterar...';


  try {

    const response =
      await apiPost({

        action:
          'changePassword',

        email:
          accountUser.email,

        currentPassword:
          currentPassword,

        newPassword:
          newPassword

      });


    if (!response.success) {

      throw new Error(
        response.message
      );
    }


    showAccountMessage(
      response.message,
      'success'
    );


    document.getElementById(
      'currentPassword'
    ).value = '';


    document.getElementById(
      'newPassword'
    ).value = '';


    document.getElementById(
      'confirmPassword'
    ).value = '';


  } catch (err) {

    showAccountMessage(
      err.message,
      'error'
    );


  } finally {

    btn.disabled = false;

    btn.textContent =
      'Alterar Password';
  }
}



function showAccountMessage(
  message,
  type
) {

  document.getElementById(
    'accountMsg'
  ).innerHTML = `
    <div class="message ${type}">
      ${escapeAccountHtml(message)}
    </div>
  `;
}



function escapeAccountHtml(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
