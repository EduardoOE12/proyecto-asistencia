import React, { useState, useEffect, useCallback } from 'react';
import LoadingScreen from './LoadingScreen';
import Login from './Login';
import TeacherSubjects from './TeacherSubjects';
import TeacherAttendance from './TeacherAttendance';
import StudentDashboard from './StudentDashboard';
import DirectorDashboard from './DirectorDashboard';
import SessionModal from './SessionModal';
import { API_BASE_URL } from './config';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Estado para el modal de sesión única invalidada
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionModalMsg, setSessionModalMsg] = useState('');

  // Función para cerrar la sesión localmente y mostrar aviso
  const handleInvalidateSession = useCallback((mensaje) => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_identificador');
    localStorage.removeItem('usuario_rol');
    localStorage.removeItem('usuario_nombre');
    setCurrentUser(null);
    setSelectedSubject(null);
    setSessionModalMsg(
      mensaje ||
        'Tu sesión ha sido cerrada automáticamente porque se inició sesión en otro dispositivo.'
    );
    setSessionModalOpen(true);
  }, []);

  // 1. Restaurar y validar sesión existente al iniciar la app
  useEffect(() => {
    const storedToken = localStorage.getItem('usuario_token');
    const storedId = localStorage.getItem('usuario_identificador');
    const storedRol = localStorage.getItem('usuario_rol');
    const storedNombre = localStorage.getItem('usuario_nombre');

    if (storedToken && storedId) {
      fetch(`${API_BASE_URL}/api/auth/verificar-sesion`, {
        headers: {
          'X-Session-Token': storedToken,
          'X-User-Id': storedId,
          'X-User-Role': storedRol || ''
        }
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setCurrentUser({
              nombre: data.usuario?.nombre || storedNombre || 'Usuario',
              rol: data.usuario?.rol || storedRol,
              identificador: data.usuario?.identificador || storedId,
              session_token: storedToken
            });
          } else {
            const data = await res.json().catch(() => ({}));
            if (
              data.codigo === 'SESION_INVALIDADA' ||
              (typeof data.detail === 'string' &&
                data.detail.toLowerCase().includes('otro dispositivo'))
            ) {
              handleInvalidateSession(data.detail);
            } else {
              // Token expirado o desconocido, limpiar sin alertar ruidosamente
              localStorage.removeItem('usuario_token');
              localStorage.removeItem('usuario_identificador');
              localStorage.removeItem('usuario_rol');
              localStorage.removeItem('usuario_nombre');
            }
          }
        })
        .catch(() => {
          // Si el servidor no responde en el arranque, mantener datos locales si los hay
          if (storedNombre && storedRol) {
            setCurrentUser({
              nombre: storedNombre,
              rol: storedRol,
              identificador: storedId,
              session_token: storedToken
            });
          }
        });
    }
  }, [handleInvalidateSession]);

  // 2. Escuchar evento global disparado por el sessionInterceptor cuando cualquier API responde 401
  useEffect(() => {
    const onSessionInvalidada = (event) => {
      const msg = event?.detail?.mensaje;
      handleInvalidateSession(msg);
    };

    window.addEventListener('sesion-invalidada', onSessionInvalidada);
    return () => {
      window.removeEventListener('sesion-invalidada', onSessionInvalidada);
    };
  }, [handleInvalidateSession]);

  // 3. Heartbeat en segundo plano: verificar periódicamente que la sesión siga activa
  useEffect(() => {
    if (!currentUser?.session_token) return;

    let isSubscribed = true;

    const checkActiveSession = async () => {
      try {
        const token = currentUser.session_token;
        const res = await fetch(`${API_BASE_URL}/api/auth/verificar-sesion`, {
          headers: {
            'X-Session-Token': token,
            'X-User-Id': currentUser.identificador,
            'X-User-Role': currentUser.rol
          }
        });

        if (!res.ok && isSubscribed) {
          const data = await res.json().catch(() => ({}));
          handleInvalidateSession(
            data.detail ||
              'Tu sesión ha sido cerrada automáticamente porque se inició sesión en otro dispositivo.'
          );
        }
      } catch (err) {
        // Ignorar caídas momentáneas de red para no interrumpir al usuario por lag
      }
    };

    // Verificar cada 3.5 segundos
    const intervalId = setInterval(checkActiveSession, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [currentUser, handleInvalidateSession]);

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setSelectedSubject(null);
  };

  const handleLogout = async () => {
    const token = currentUser?.session_token || localStorage.getItem('usuario_token');
    const id = currentUser?.identificador || localStorage.getItem('usuario_identificador');
    const rol = currentUser?.rol || localStorage.getItem('usuario_rol');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': token,
            'X-User-Id': id || '',
            'X-User-Role': rol || ''
          },
          body: JSON.stringify({ token, identificador: id, rol })
        });
      } catch (_) {}
    }

    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_identificador');
    localStorage.removeItem('usuario_rol');
    localStorage.removeItem('usuario_nombre');
    setCurrentUser(null);
    setSelectedSubject(null);
  };

  return (
    <>
      <SessionModal
        isOpen={sessionModalOpen}
        message={sessionModalMsg}
        onClose={() => setSessionModalOpen(false)}
      />

      {isLoading ? (
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      ) : !currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.rol === 'Docente' ? (
        !selectedSubject ? (
          <TeacherSubjects 
            user={currentUser} 
            onSubjectSelect={(materia) => setSelectedSubject(materia)}
            onLogout={handleLogout}
          />
        ) : (
          <TeacherAttendance 
            user={currentUser} 
            materia={selectedSubject} 
            onBack={() => setSelectedSubject(null)} 
            onLogout={handleLogout} 
          />
        )
      ) : currentUser.rol === 'Alumno' ? (
        <StudentDashboard 
          user={currentUser} 
          onLogout={handleLogout} 
        />
      ) : currentUser.rol === 'Director' ? (
        <DirectorDashboard 
          user={currentUser} 
          onLogout={handleLogout} 
        />
      ) : (
        <div style={{
          maxWidth: '420px',
          margin: '50px auto',
          padding: '35px 25px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          borderTop: '5px solid #cc0000',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '4px',
            background: '#cc0000',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            marginBottom: '15px'
          }}>
            {currentUser.rol}
          </div>

          <h1 style={{ color: '#000', fontSize: '1.5rem', margin: '10px 0' }}>
            Bienvenido(a), {currentUser.nombre}
          </h1>
          
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '0.95rem' }}>
            Has iniciado sesión correctamente como {currentUser.rol}.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#990000'}
              onMouseOut={(e) => e.target.style.background = '#cc0000'}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;