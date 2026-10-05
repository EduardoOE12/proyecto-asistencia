import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './StudentDashboard.css';
import lobosImg from './assets/lobos.JPG';
import { API_BASE_URL } from './config';

const StudentDashboard = ({ user, onLogout }) => {
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tokenInput, setTokenInput] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState([]);

  const identificador = user?.identificador || localStorage.getItem('usuario_identificador');

  useEffect(() => {
    if (!identificador) {
      setError('No se encontró una sesión activa o matrícula asociada.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/api/alumnos/consulta/${identificador}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los datos del alumno.');
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          setAlumno(data.alumno);
        } else {
          setError('No se pudieron obtener los detalles del alumno.');
        }
      })
      .catch(() => {
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

  const abrirScannerQR = () => {
    setScannerError('');
    setScanMessage('');
    setMostrarScanner(true);
  };

  const cerrarScannerQR = () => {
    setMostrarScanner(false);
    setScannerError('');
  };

  useEffect(() => {
    let html5QrCode = null;
    let isSubscribed = true;

    if (mostrarScanner) {
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader-container");
          const config = { fps: 10, qrbox: { width: 240, height: 240 } };

          const onScanSuccess = (decodedText) => {
            if (!isSubscribed) return;
            handleRegisterToken(decodedText);
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => setMostrarScanner(false)).catch(() => {});
            } else {
              setMostrarScanner(false);
            }
          };

          html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {}
          ).catch(() => {
            if (html5QrCode && isSubscribed) {
              html5QrCode.start(
                true,
                config,
                onScanSuccess,
                () => {}
              ).catch(() => {
                setScannerError("Permiso de cámara denegado o no disponible. Permite el acceso a la cámara en tu navegador o ingresa el token manualmente.");
              });
            }
          });
        } catch {
          setScannerError("No se pudo iniciar el escáner de cámara.");
        }
      }, 100);

      return () => {
        isSubscribed = false;
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(() => {});
          }
          html5QrCode.clear();
        }
      };
    }
  }, [mostrarScanner]);

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
      const res = await fetch(`${API_BASE_URL}/api/asistencia/escaneo-qr`, {
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
    } catch {
      setScanStatus('error');
      setScanMessage('Error de conexión con el servidor.');
    } finally {
      setIsSubmittingToken(false);
    }
  };

  return (
    <div className="sd-container">
      <div className="sd-box">
        <div className="sd-topbar">
          <div className="sd-user-info">
            <span className="student-badge">Alumno</span>
            <span className="sd-user-name">
              {alumno ? alumno.nombre : (user?.nombre || "Alumno")}
            </span>
          </div>
          {onLogout && (
            <button className="btn-logout" onClick={onLogout}>
              Cerrar Sesión
            </button>
          )}
        </div>

        <header className="sd-header">
          <h1 className="sd-title">Somos Lobos</h1>
          {lobosImg && <img src={lobosImg} alt="Logo Somos Lobos" className="sd-logo" />}
        </header>

        <h3 className="sd-section-title">PORTAL DEL ALUMNO</h3>

        {error && <div className="sd-error-banner">{error}</div>}

        <div className="sd-card qr-student-card">
          <div className="card-header">
            <div className="avatar-icon">📱</div>
            <div className="card-header-text">
              <h4>Registro de Asistencia por QR</h4>
              <p>Escanea el código QR proyectado por tu docente o ingresa el token de clase</p>
            </div>
          </div>

          <div className="student-qr-body">
            {scanMessage && (
              <div className={`scan-banner ${scanStatus}`}>
                {scanStatus === 'success' ? '✅ ' : '❌ '} {scanMessage}
              </div>
            )}

            <div className="qr-scanner-section">
              {!mostrarScanner ? (
                <button 
                  type="button"
                  className="btn-start-scanner"
                  onClick={abrirScannerQR}
                >
                  📷 Escanear Código QR con Cámara
                </button>
              ) : (
                <div className="scanner-container-box">
                  <div id="qr-reader-container"></div>
                  {scannerError && (
                    <div className="sd-error-banner" style={{ margin: '10px 0', width: '100%' }}>
                      ⚠️ {scannerError}
                    </div>
                  )}
                  <button 
                    type="button"
                    className="btn-cancel-scanner"
                    onClick={cerrarScannerQR}
                  >
                    ✕ Cerrar Escáner
                  </button>
                </div>
              )}
            </div>

            <div className="qr-divider">
              <span>O INGRESA EL TOKEN DEL QR</span>
            </div>

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
                <h5>📋 Asistencias registradas hoy:</h5>
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

      </div>
    </div>
  );
};

export default StudentDashboard;
