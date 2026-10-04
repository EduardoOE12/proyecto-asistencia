import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './StudentDashboard.css';
import lobosImg from './assets/lobos.JPG';

const StudentDashboard = ({ user, onLogout }) => {
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [estadoCamara, setEstadoCamara] = useState('inicial'); // 'inicial', 'activa', 'bloqueada'
  const [opcionPermiso, setOpcionPermiso] = useState(null); // 'una_vez', 'en_uso', 'nunca'

  // Estados para Registro de Asistencia vía QR / Token
  const [tokenInput, setTokenInput] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scanStatus, setScanStatus] = useState(''); // 'success', 'error', ''
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState([]);

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

  // Inicialización del escáner de QR
  useEffect(() => {
    let scanner = null;
    if (mostrarScanner) {
      scanner = new Html5QrcodeScanner('qr-reader-container', { fps: 10, qrbox: { width: 220, height: 220 } }, false);
      scanner.render(
        (decodedText) => {
          handleRegisterToken(decodedText);
          scanner.clear().catch(e => console.log("Clear error:", e));
          setMostrarScanner(false);
        },
        () => {}
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.log("Clear error cleanup:", e));
      }
    };
  }, [mostrarScanner]);

  // Enviar Token QR al Backend para registrar Asistencia
  const handleRegisterToken = async (tokenAValidar) => {
    const tokenFinal = tokenAValidar || tokenInput;
    if (!tokenFinal.trim()) {
      setScanStatus('error');
      setScanMessage('Por favor ingresa un código Token válido.');
      return;
    }

    setIsSubmittingToken(true);
    setScanMessage('');
    setScanStatus('');

    try {
      const nombreAlumno = alumno ? alumno.nombre : (user?.nombre || "Alumno");
      const res = await fetch('http://localhost:8000/api/asistencia/escaneo-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenFinal,
          identificador: identificador || "",
          nombre: nombreAlumno
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setScanStatus('success');
        setScanMessage(data.mensaje || '¡Asistencia registrada correctamente!');
        setTokenInput('');
        setAsistenciasRegistradas(prev => [
          { materia: data.materia, grupo: data.grupo, hora: new Date().toLocaleTimeString() },
          ...prev
        ]);
      } else {
        setScanStatus('error');
        setScanMessage(data.detail || 'El código QR es inválido o el tiempo de 15 minutos ha expirado.');
      }
    } catch (err) {
      console.error("Error al registrar asistencia por QR:", err);
      setScanStatus('error');
      setScanMessage('Error de conexión con el servidor.');
    } finally {
      setIsSubmittingToken(false);
    }
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

        {/* MÓDULO DE ESCANEO DE ASISTENCIA QR */}
        <div className="sd-card qr-student-card">
          <div className="card-header">
            <div className="avatar-icon">📱</div>
            <div className="card-header-text">
              <h4>Registro de Asistencia por QR</h4>
              <p>Escanea el código QR proyectado por tu docente (Válido los primeros 15 min de clase)</p>
            </div>
          </div>

          <div className="student-qr-body">
            {scanMessage && (
              <div className={`scan-banner ${scanStatus}`}>
                {scanStatus === 'success' ? '✅ ' : '❌ '} {scanMessage}
              </div>
            )}

            {/* OPCIÓN 1: ESCANEAR CON CÁMARA */}
            <div className="qr-scanner-section">
              {!mostrarScanner ? (
                <button 
                  className="btn-start-scanner"
                  onClick={() => setMostrarScanner(true)}
                >
                  📷 Abrir Escáner QR con Cámara
                </button>
              ) : (
                <div className="scanner-container-box">
                  <div id="qr-reader-container"></div>
                  <button 
                    className="btn-cancel-scanner"
                    onClick={() => setMostrarScanner(false)}
                  >
                    ✕ Cerrar Escáner
                  </button>
                </div>
              )}
            </div>

            <div className="qr-divider">
              <span>O INGRESA EL TOKEN DEL QR</span>
            </div>

            {/* OPCIÓN 2: INGRESAR CÓDIGO TOKEN MANUALMENTE */}
            <form 
              className="token-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleRegisterToken();
              }}
            >
              <input 
                type="text" 
                className="token-input"
                placeholder="Ejemplo: QR-A1B2C3"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              />
              <button 
                type="submit" 
                className="btn-submit-token"
                disabled={isSubmittingToken}
              >
                {isSubmittingToken ? 'Validando...' : 'Registrar Asistencia'}
              </button>
            </form>

            {asistenciasRegistradas.length > 0 && (
              <div className="recent-attendances">
                <h5> Asistencias registradas hoy:</h5>
                <ul>
                  {asistenciasRegistradas.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.materia}</strong> ({item.grupo}) - Registrado a las {item.hora}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

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

