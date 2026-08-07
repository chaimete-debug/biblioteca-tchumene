let deferredInstallPrompt = null;



document.addEventListener(
  'DOMContentLoaded',
  () => {

    registerServiceWorker();

    setupInstallButton();

    setupConnectionStatus();

  }
);



/* ====================================
   SERVICE WORKER
==================================== */


async function registerServiceWorker() {

  if (
    !(
      'serviceWorker'
      in navigator
    )
  ) {

    return;
  }


  try {

    const registration =
      await navigator
        .serviceWorker
        .register(
          '/sw.js',
          {
            scope: '/'
          }
        );


    /*
     * Procurar actualizações.
     */
    registration.update();


  } catch (err) {

    console.error(
      'Erro ao registar Service Worker:',
      err
    );
  }
}



/* ====================================
   INSTALAÇÃO
==================================== */


function setupInstallButton() {

  const button =
    document.getElementById(
      'installAppBtn'
    );


  /*
   * App já aberta em standalone.
   */
  if (
    isAppInstalled()
  ) {

    if (button) {

      button.textContent =
        '✓ Aplicação instalada';

      button.disabled =
        true;

      button.classList.add(
        'pwa-installed'
      );
    }

    return;
  }


  window.addEventListener(
    'beforeinstallprompt',
    event => {

      event.preventDefault();

      deferredInstallPrompt =
        event;


      if (button) {

        button.classList.remove(
          'hidden'
        );

        button.disabled =
          false;
      }

    }
  );


  window.addEventListener(
    'appinstalled',
    () => {

      deferredInstallPrompt =
        null;


      if (button) {

        button.textContent =
          '✓ Aplicação instalada';

        button.disabled =
          true;

        button.classList.remove(
          'hidden'
        );

        button.classList.add(
          'pwa-installed'
        );
      }

    }
  );


  /*
   * iOS não suporta
   * beforeinstallprompt.
   */
  if (
    isIOS() &&
    !isAppInstalled() &&
    button
  ) {

    button.classList.remove(
      'hidden'
    );

    button.textContent =
      'Instalar Aplicação';

  }

}



async function installApp() {

  const button =
    document.getElementById(
      'installAppBtn'
    );


  /*
   * Android / Chrome
   */
  if (
    deferredInstallPrompt
  ) {

    deferredInstallPrompt.prompt();


    const choice =
      await deferredInstallPrompt
        .userChoice;


    if (
      choice.outcome ===
      'accepted'
    ) {

      if (button) {

        button.textContent =
          'A instalar...';

        button.disabled =
          true;
      }

    }


    deferredInstallPrompt =
      null;

    return;
  }


  /*
   * iPhone / iPad
   */
  if (isIOS()) {

    showIOSInstallInstructions();

    return;
  }


  alert(
    'A opção de instalação ainda não está disponível neste navegador. Pode também instalar a aplicação através do menu do navegador.'
  );
}



/* ====================================
   iOS
==================================== */


function isIOS() {

  return (
    /iphone|ipad|ipod/i
      .test(
        navigator.userAgent
      )
  );
}



function isAppInstalled() {

  return (

    window.matchMedia(
      '(display-mode: standalone)'
    ).matches ||

    window.navigator
      .standalone === true

  );
}



function showIOSInstallInstructions() {

  const modal =
    document.getElementById(
      'iosInstallModal'
    );


  if (modal) {

    modal.classList.remove(
      'hidden'
    );

    return;
  }


  alert(
    'No iPhone/iPad: abra o menu Partilhar do Safari e escolha “Adicionar ao Ecrã Principal”.'
  );
}



function closeIOSInstallInstructions() {

  const modal =
    document.getElementById(
      'iosInstallModal'
    );


  if (modal) {

    modal.classList.add(
      'hidden'
    );
  }
}



/* ====================================
   ONLINE / OFFLINE
==================================== */


function setupConnectionStatus() {

  updateConnectionStatus();


  window.addEventListener(
    'online',
    updateConnectionStatus
  );


  window.addEventListener(
    'offline',
    updateConnectionStatus
  );

}



function updateConnectionStatus() {

  const indicator =
    document.getElementById(
      'connectionStatus'
    );


  if (!indicator) {
    return;
  }


  if (
    navigator.onLine
  ) {

    indicator.textContent =
      'Online';

    indicator.className =
      'connection-status online';

  } else {

    indicator.textContent =
      'Offline';

    indicator.className =
      'connection-status offline';
  }

}
