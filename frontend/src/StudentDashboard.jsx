import React, { useState, useEffect, useRef } from 'react';
import './StudentDashboard.css';
import lobosImg from './assets/lobos.JPG';

const StudentDashboard = ({ user, onLogout }) => {
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [estadoCamara, setEstadoCamara] = useState('inicial'); // 'inicial', 'activa', 'bloqueada'
  const [opcionPermiso, setOpcionPermiso] = useState(null); // 'una_vez', 'en_uso', 'nunca'
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Obtener identificador desde props o localStorage
  const identificador = user?.identificador || localStorage.getItem('usuario_identificador');

  // 1. Consulta al backend de los datos del alumno
  useEffect(() => {
    if (!identificador) {
      setError('No se encontró una sesión activa o matrícula asociada.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:8000/api/alumnos/consulta/${identificador}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los datos del alumno en la base de datos.');
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          setAlumno(data.alumno);
        } else {
          setError('No se pudieron obtener los detalles del alumno.');
        }
      })
      .catch((err) => {
        console.error("Error al consultar alumno:", err);
        // Fallback si no responde el backend pero tenemos el nombre en user prop
        if (user && user.nombre) {
          setAlumno({
            nombre: user.nombre,
            matricula: identificador,
            telefono: 'No especificado'
          });
        } else {
          setError('Error de conexión con el servidor.');
        }
      })
      .finally(() => setLoading(false));
  }, [identificador, user]);

  // 2. Comprobación previa de permisos de cámara
  useEffect(() => {
    const permisoGuardado = localStorage.getItem('permiso_camara_modo');
    
    if (permisoGuardado === 'nunca') {
      setEstadoCamara('bloqueada');
      setOpcionPermiso('nunca');
    } else if (permisoGuardado === 'en_uso') {
      activarCamara('en_uso');
    }
  }, []);

  // Función para activar la cámara vía MediaDevices API
  const activarCamara = async (modo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setEstadoCamara('activa');
      setOpcionPermiso(modo);

      if (modo === 'en_uso') {
        localStorage.setItem('permiso_camara_modo', 'en_uso');
      }
    } catch (err) {
      console.error('Acceso a la cámara denegado o no disponible:', err);
      setEstadoCamara('bloqueada');
    }
  };

  // Asignar comportamiento según opción seleccionada
  const seleccionarPermiso = (opcion) => {
    if (opcion === 'nunca') {
      setEstadoCamara('bloqueada');
      setOpcionPermiso('nunca');
      localStorage.setItem('permiso_camara_modo', 'nunca');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    activarCamara(opcion);
  };

  // Restablecer permisos de cámara para volver a preguntar
  const restablecerPermisos = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    localStorage.removeItem('permiso_camara_modo');
    setEstadoCamara('inicial');
    setOpcionPermiso(null);
  };

  // Cleanup de la cámara al desmontar el componente
  useEffect(() => {
    return () => {
      const modo = localStorage.getItem('permiso_camara_modo');
      if (modo !== 'en_uso' && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="sd-container">
      <div className="sd-box">
        
        {/* Barra superior del Alumno */}
        <div className="sd-topbar">
          <div className="sd-user-info">
            <span className="student-badge">Alumno</span>
            <span className="sd-user-name">
              {alumno ? alumno.nombre : (user?.nombre || "Alumno")}
            </span>
          </div>
          {onLogout && (
            <button className="btn-logout" onClick={() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              onLogout();
            }}>
              Cerrar Sesión
            </button>
          )}
        </div>

        {/* Encabezado Principal */}
        <header className="sd-header">
          <h1 className="sd-title">Somos Lobos</h1>
          {lobosImg && <img src={lobosImg} alt="Logo Somos Lobos" className="sd-logo" />}
        </header>

        <h3 className="sd-section-title">PORTAL DEL ALUMNO</h3>

        {error && <div className="sd-error-banner">{error}</div>}

        {/* Tarjeta de Información del Alumno */}
        <div className="sd-card info-card">
          <div className="card-header">
            <div className="avatar-icon">👤</div>
            <div className="card-header-text">
              <h4>Información Personal</h4>
              <p>Datos registrados en el sistema de asistencia</p>
            </div>
          </div>

          {loading ? (
            <div className="sd-loading-text">Cargando información del alumno...</div>
          ) : alumno ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nombre Completo:</span>
                <span className="info-value highlight">{alumno.nombre}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Matrícula:</span>
                <span className="info-value">{alumno.matricula}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Teléfono:</span>
                <span className="info-value">{alumno.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado de Cuenta:</span>
                <span className="info-value status-active">● Activo</span>
              </div>
            </div>
          ) : (
            <div className="sd-warning-text">No se encontraron datos disponibles.</div>
          )}
        </div>

        {/* Módulo de Acceso a la Cámara */}
        <div className="sd-card camera-card">
          <div className="card-header">
            <div className="avatar-icon">📷</div>
            <div className="card-header-text">
              <h4>Verificación y Acceso a la Cámara</h4>
              <p>Módulo de reconocimiento y validación presencial</p>
            </div>
          </div>

          <div className="camera-content">
            {estadoCamara === 'inicial' && (
              <div className="permission-prompt">
                <p className="prompt-text">
                  Selecciona una opción de permiso para activar la cámara:
                </p>
                <div className="permission-buttons">
                  <button 
                    className="btn-perm btn-once" 
                    onClick={() => seleccionarPermiso('una_vez')}
                  >
                    Solo esta vez
                  </button>
                  <button 
                    className="btn-perm btn-use" 
                    onClick={() => seleccionarPermiso('en_uso')}
                  >
                    Mientras la App esté en uso
                  </button>
                  <button 
                    className="btn-perm btn-never" 
                    onClick={() => seleccionarPermiso('nunca')}
                  >
                    Nunca
                  </button>
                </div>
              </div>
            )}

            {estadoCamara === 'activa' && (
              <div className="camera-active-view">
                <div className="camera-badge-success">
                  <span className="pulse-dot">●</span> Cámara activa (Permiso: {opcionPermiso === 'en_uso' ? 'En uso' : 'Solo esta vez'})
                </div>
                
                <div className="video-wrapper">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="video-feed"
                  />
                  <div className="video-overlay-grid"></div>
                </div>

                <div className="camera-actions">
                  <button className="btn-reset-perm" onClick={restablecerPermisos}>
                    ⚙️ Cambiar permisos de cámara
                  </button>
                </div>
              </div>
            )}

            {estadoCamara === 'bloqueada' && (
              <div className="camera-blocked-view">
                <div className="blocked-icon">🚫</div>
                <p className="blocked-text">
                  {opcionPermiso === 'nunca'
                    ? 'El acceso a la cámara está configurado como "Nunca".'
                    : 'Acceso a la cámara denegado o bloqueado por el navegador.'}
                </p>
                <button className="btn-reset-perm" onClick={restablecerPermisos}>
                  🔄 Restablecer permisos de cámara
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
