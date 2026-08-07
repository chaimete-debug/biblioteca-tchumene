const CACHE_NAME =
  'biblioteca-tchumene-v7b-final-1';


const OFFLINE_URL =
  '/offline.html';


const STATIC_ASSETS = [

  '/',

  '/index.html',

  '/dashboard.html',

  '/books.html',

  '/readers.html',

  '/loans.html',

  '/reports.html',

  '/productivity.html',

  '/account.html',

  '/admin.html',

  '/offline.html',

  '/manifest.webmanifest',


  '/assets/css/style.css',


  '/assets/js/config.js',

  '/assets/js/api.js',

  '/assets/js/auth.js',

  '/assets/js/dashboard.js',

  '/assets/js/books.js',

  '/assets/js/readers.js',

  '/assets/js/loans.js',

  '/assets/js/reports.js',

  '/assets/js/productivity.js',

  '/assets/js/account.js',

  '/assets/js/admin.js',

  '/assets/js/pwa.js',


  '/assets/icons/icon.svg',

  '/assets/icons/icon-maskable.svg'
];



/* ============================================================
   INSTALL
============================================================ */


self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )

        .then(
          cache =>
            cache.addAll(
              STATIC_ASSETS
            )
        )

        .then(
          () =>
            self.skipWaiting()
        )
    );
  }
);



/* ============================================================
   ACTIVATE
============================================================ */


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          keys =>
            Promise.all(

              keys.map(
                key => {

                  if (
                    key !==
                    CACHE_NAME
                  ) {

                    return caches.delete(
                      key
                    );
                  }


                  return Promise.resolve();
                }
              )
            )
        )

        .then(
          () =>
            self.clients.claim()
        )
    );
  }
);



/* ============================================================
   FETCH
============================================================ */


self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;


    if (
      request.method !==
      'GET'
    ) {

      return;
    }


    const url =
      new URL(
        request.url
      );


    /*
     * Nunca fazer cache da API do Apps Script.
     */
    if (
      url.hostname.includes(
        'script.google.com'
      ) ||
      url.hostname.includes(
        'script.googleusercontent.com'
      )
    ) {

      return;
    }


    /*
     * HTML, JavaScript e CSS:
     *
     * NETWORK FIRST.
     *
     * Isto é importante enquanto continuamos
     * a melhorar a aplicação, pois evita que
     * a PWA fique presa em versões antigas.
     */

    const useNetworkFirst =
      request.mode ===
        'navigate' ||

      url.pathname.endsWith(
        '.html'
      ) ||

      url.pathname.endsWith(
        '.js'
      ) ||

      url.pathname.endsWith(
        '.css'
      );


    if (useNetworkFirst) {

      event.respondWith(

        fetch(
          request
        )

        .then(
          response => {

            /*
             * Só guardamos respostas válidas.
             */
            if (
              !response ||
              response.status !== 200
            ) {

              return response;
            }


            const clone =
              response.clone();


            caches
              .open(
                CACHE_NAME
              )

              .then(
                cache =>
                  cache.put(
                    request,
                    clone
                  )
              );


            return response;
          }
        )

        .catch(
          async () => {

            const cached =
              await caches.match(
                request
              );


            if (cached) {

              return cached;
            }


            if (
              request.mode ===
              'navigate'
            ) {

              return caches.match(
                OFFLINE_URL
              );
            }


            throw new Error(
              'Recurso indisponível offline'
            );
          }
        )
      );


      return;
    }


    /*
     * Imagens, ícones e restantes recursos:
     *
     * CACHE FIRST.
     */

    event.respondWith(

      caches
        .match(
          request
        )

        .then(
          cached => {

            if (cached) {

              return cached;
            }


            return fetch(
              request
            )

            .then(
              response => {

                if (
                  !response ||
                  response.status !== 200
                ) {

                  return response;
                }


                const clone =
                  response.clone();


                caches
                  .open(
                    CACHE_NAME
                  )

                  .then(
                    cache =>
                      cache.put(
                        request,
                        clone
                      )
                  );


                return response;
              }
            );
          }
        )
    );
  }
);
