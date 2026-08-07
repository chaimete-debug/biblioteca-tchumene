function getStoredSessionForApi_() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'biblioteca_session'
      ) || 'null'
    );
  } catch (err) {
    return null;
  }
}


function getSessionTokenForApi_() {
  const session =
    getStoredSessionForApi_();

  return session &&
    session.token
      ? session.token
      : '';
}


async function apiGet(
  action,
  params = {}
) {
  const url =
    new URL(API_URL);

  url.searchParams.set(
    'action',
    action
  );

  const token =
    getSessionTokenForApi_();

  if (token) {
    url.searchParams.set(
      'token',
      token
    );
  }

  Object.entries(
    params || {}
  ).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null
      ) {
        url.searchParams.set(
          key,
          value
        );
      }
    }
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

  return response.json();
}


async function apiPost(
  payload = {}
) {
  const token =
    getSessionTokenForApi_();

  const body = {
    ...payload
  };

  if (
    token &&
    !body.token
  ) {
    body.token =
      token;
  }

  const response =
    await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body:
          JSON.stringify(
            body
          )
      }
    );

  return response.json();
}
