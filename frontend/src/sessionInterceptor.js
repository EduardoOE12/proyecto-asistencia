/**
 * sessionInterceptor.js
 * Interceptor global de peticiones HTTP (fetch).
 * Inyecta automáticamente los encabezados de sesión única activa (token, identificador, rol)
 * y escucha respuestas 401 de sesión invalidada para alertar al usuario y redirigir a Login.
 */

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  window.fetch = async function (resource, init = {}) {
    const token = localStorage.getItem('usuario_token');
    const identificador = localStorage.getItem('usuario_identificador');
    const rol = localStorage.getItem('usuario_rol');

    // Manejar headers como objeto, instancia de Headers, o array
    let headersObj = {};

    if (resource instanceof Request) {
      resource.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    }

    if (init && init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((val, key) => {
          headersObj[key] = val;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => {
          headersObj[k] = v;
        });
      } else if (typeof init.headers === 'object') {
        Object.assign(headersObj, init.headers);
      }
    }

    // Inyectar encabezados de sesión si existen
    if (token && !headersObj['X-Session-Token']) {
      headersObj['X-Session-Token'] = token;
    }
    if (identificador && !headersObj['X-User-Id']) {
      headersObj['X-User-Id'] = identificador;
    }
    if (rol && !headersObj['X-User-Role']) {
      headersObj['X-User-Role'] = rol;
    }

    const newInit = {
      ...init,
      headers: headersObj
    };

    try {
      const response = await originalFetch(resource, newInit);

      // Si el servidor detectó que la sesión fue invalidada por otro dispositivo
      if (response.status === 401) {
        try {
          const clone = response.clone();
          clone.json().then((data) => {
            if (
              data &&
              (data.codigo === 'SESION_INVALIDADA' ||
                (typeof data.detail === 'string' &&
                  data.detail.toLowerCase().includes('otro dispositivo')))
            ) {
              window.dispatchEvent(
                new CustomEvent('sesion-invalidada', {
                  detail: {
                    motivo: 'NUEVO_DISPOSITIVO',
                    mensaje:
                      data.detail ||
                      'Tu sesión ha sido cerrada automáticamente porque se inició sesión en otro dispositivo.'
                  }
                })
              );
            }
          }).catch(() => {});
        } catch (_) {}
      }

      return response;
    } catch (err) {
      throw err;
    }
  };
}
