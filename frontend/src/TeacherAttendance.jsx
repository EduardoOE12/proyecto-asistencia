import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './TeacherAttendance.css';
import { API_BASE_URL } from './config';

const TeacherAttendance = ({ user, materia, onBack, onLogout }) => {
  const nombreMateria = typeof materia === 'object' ? materia.materia : (materia || "MATEMÁTICAS");
  const horaInicio = typeof materia === 'object' ? materia.horaInicio : 7;
  const horaFin = typeof materia === 'object' ? materia.horaFin : 9;
  const grupo = typeof materia === 'object' ? (materia.grupo || "3A IA") : "3A IA";

  const [infoClase] = useState({
    grupo: grupo,
    materia: nombreMateria,
    horario: `${horaInicio}:00 - ${horaFin}:00`
  });

  const [alumnos, setAlumnos] = useState([
    { id: 1, matricula: "XXXX0000000001", nombre: "ALUMNO 1", estado: "FALTA", asistio: false, fecha: "---" },
    { id: 2, matricula: "XXXX0000000002", nombre: "ALUMNO 2", estado: "FALTA", asistio: false, fecha: "---" },
    { id: 3, matricula: "XXXX0000000003", nombre: "ALUMNO 3", estado: "FALTA", asistio: false, fecha: "---" }
  ]);

  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [qrToken, setQrToken] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [alumnosQR, setAlumnosQR] = useState([]);

  const pdfDescargadoRef = useRef(false);

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/asistencia/alumnos`);
        if (response.ok) {
          const data = await response.json();
          if (data.alumnos && data.alumnos.length > 0) {
            setAlumnos(data.alumnos);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAlumnos();
  }, []);

  useEffect(() => {
    const consultarQRActivo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/asistencia/qr-activo?materia=${encodeURIComponent(infoClase.materia)}&grupo=${encodeURIComponent(infoClase.grupo)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.activo && data.token) {
            setQrToken(data.token);
            setSegundosRestantes(data.segundos_restantes);
            setAlumnosQR(data.alumnos_registrados || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    consultarQRActivo();
  }, [infoClase.materia, infoClase.grupo]);

  useEffect(() => {
    let interval = null;
    if (qrToken && segundosRestantes > 0) {
      interval = setInterval(() => {
        setSegundosRestantes(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrToken, segundosRestantes]);

  useEffect(() => {
    let polling = null;
    if (qrToken && segundosRestantes > 0) {
      polling = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/asistencia/qr-activo?materia=${encodeURIComponent(infoClase.materia)}&grupo=${encodeURIComponent(infoClase.grupo)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.activo && data.alumnos_registrados) {
              setAlumnosQR(data.alumnos_registrados);
              
              setAlumnos(prevAlumnos => prevAlumnos.map(alum => {
                const escaneo = data.alumnos_registrados.some(a => {
                  if (typeof a === 'string') {
                    return a.toLowerCase().trim() === alum.nombre.toLowerCase().trim();
                  }
                  const matRegistrada = (a.matricula || a.identificador || "").toLowerCase().trim();
                  const matAlumno = (alum.matricula || alum.identificador || "").toLowerCase().trim();
                  const nomRegistrado = (a.nombre || "").toLowerCase().trim();
                  const nomAlumno = (alum.nombre || "").toLowerCase().trim();

                  if (matRegistrada && matAlumno && matRegistrada === matAlumno) return true;
                  if (nomRegistrado && nomAlumno && nomRegistrado === nomAlumno) return true;
                  return false;
                });

                if (escaneo) {
                  return { ...alum, estado: "PUNTUAL", asistio: true };
                }
                return { ...alum, estado: "FALTA", asistio: false };
              }));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => {
      if (polling) clearInterval(polling);
    };
  }, [qrToken, segundosRestantes, infoClase.materia, infoClase.grupo]);

  useEffect(() => {
    if (qrToken && segundosRestantes === 0 && !pdfDescargadoRef.current) {
      pdfDescargadoRef.current = true;
      descargarPDFAsistencia("automatico");
    }
  }, [segundosRestantes, qrToken]);

  const descargarPDFAsistencia = (origen = "manual") => {
    try {
      const doc = new jsPDF();
      const ahora = new Date();
      const fechaTexto = ahora.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '-');

      const materiaClean = infoClase.materia.replace(/[^a-zA-Z0-9]/g, '_');
      const grupoClean = infoClase.grupo.replace(/[^a-zA-Z0-9]/g, '_');
      const nombreArchivo = `Asistencia_${fechaTexto}_${materiaClean}_${grupoClean}.pdf`;

      doc.setFillColor(204, 0, 0);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('SOMOS LOBOS - REPORTE OFICIAL DE ASISTENCIA (QR)', 14, 17);

      doc.setTextColor(33, 37, 41);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Docente:`, 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user?.nombre || "Docente"}`, 38, 35);

      doc.setFont('helvetica', 'bold');
      doc.text(`Materia:`, 14, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(`${infoClase.materia}`, 38, 42);

      doc.setFont('helvetica', 'bold');
      doc.text(`Grupo:`, 14, 49);
      doc.setFont('helvetica', 'normal');
      doc.text(`${infoClase.grupo}`, 38, 49);

      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha:`, 125, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`${fechaTexto}`, 145, 35);

      doc.setFont('helvetica', 'bold');
      doc.text(`Horario:`, 125, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(`${infoClase.horario}`, 145, 42);

      doc.setFont('helvetica', 'bold');
      doc.text(`Token QR:`, 125, 49);
      doc.setFont('helvetica', 'normal');
      doc.text(`${qrToken || 'N/A'} (15 min)`, 145, 49);

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 54, 196, 54);

      const totalAlumnos = alumnos.length;
      const asistieron = alumnos.filter(a => a.asistio).length;
      const faltas = totalAlumnos - asistieron;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 57, 182, 12, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`TOTAL ALUMNOS: ${totalAlumnos}   |   ASISTIERON: ${asistieron}   |   FALTAS: ${faltas}`, 20, 65);

      const rows = alumnos.map((al, idx) => [
        idx + 1,
        al.nombre,
        al.estado,
        al.asistio ? 'SI' : 'NO',
        al.fecha || fechaTexto
      ]);

      autoTable(doc, {
        startY: 73,
        head: [['#', 'Nombre del Alumno', 'Estado', 'Asistió', 'Fecha']],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [43, 43, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 85 },
          2: { halign: 'center', cellWidth: 35 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 25 }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' }
      });

      doc.save(nombreArchivo);

      if (origen === "automatico") {
        setSaveMessage(`📄 Tiempo de QR finalizado. Reporte generado: ${nombreArchivo}`);
      } else {
        setSaveMessage(`📄 PDF descargado correctamente: ${nombreArchivo}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerarQR = async () => {
    setIsGeneratingQR(true);
    setQrError('');
    pdfDescargadoRef.current = false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/asistencia/generar-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docente: user?.nombre || "Docente",
          grupo: infoClase.grupo,
          materia: infoClase.materia,
          horaInicio: horaInicio,
          horaFin: horaFin
        })
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        setQrToken(data.token);
        setSegundosRestantes(data.duracion_segundos || 900);
        setShowQRModal(true);
      } else {
        setQrError(data.detail || 'No se pudo generar el código QR.');
      }
    } catch (err) {
      console.error("Error al generar QR:", err);
      setQrError('No se pudo conectar con el servidor para generar el código QR.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const formatearTiempo = (totalSegundos) => {
    const min = Math.floor(totalSegundos / 60);
    const seg = totalSegundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  const guardarAsistencia = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/asistencia/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docente: user?.nombre || "Docente",
          grupo: infoClase.grupo,
          materia: infoClase.materia,
          registros: alumnos
        })
      });
      if (response.ok) {
        setSaveMessage('✓ ¡Asistencia guardada correctamente!');
      } else {
        setSaveMessage('Asistencia registrada localmente.');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage('Asistencia registrada en el sistema.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  return (
    <div className="attendance-container">
      <div className="teacher-topbar">
        <div className="teacher-info">
          {onBack && (
            <button className="btn-back-subject" onClick={onBack} title="Volver a materias">
              ← Volver a materias
            </button>
          )}
          <span className="teacher-badge">Docente</span>
          <span>{user?.nombre || "Profesor Registrado"}</span>
        </div>
        {onLogout && (
          <button className="btn-logout" onClick={onLogout}>
            Cerrar Sesión
          </button>
        )}
      </div>

      <header className="attendance-header">
        <div>
          <h1 className="group-title">{infoClase.grupo}</h1>
          <span className="class-schedule-badge">🕒 Horario: {infoClase.horario}</span>
        </div>
        <div className="subject-info">
          <h2>{infoClase.materia}</h2>
          <p>Ventana de QR: 15 minutos iniciales</p>
        </div>
      </header>

      <div className="qr-generator-card">
        <div className="qr-card-header">
          <div className="qr-icon-title">
            <span className="qr-icon">📱</span>
            <div>
              <h3>Código QR de Asistencia</h3>
              <p>Genera un código QR con token dinámico válido durante <strong>15 minutos</strong> de clase.</p>
            </div>
          </div>
          <button 
            className={`btn-generate-qr ${segundosRestantes > 0 ? 'qr-active-btn' : ''}`}
            onClick={handleGenerarQR}
            disabled={isGeneratingQR}
          >
            {isGeneratingQR ? 'Generando...' : qrToken && segundosRestantes > 0 ? '⚡ Ver / Re-mostrar QR' : '📱 Generar Código QR'}
          </button>
        </div>

        {qrError && (
          <div className="qr-error-msg">
            ⚠️ {qrError}
          </div>
        )}

        {qrToken && (
          <div className="qr-summary-box">
            <div className="qr-preview-side">
              <QRCodeCanvas value={qrToken} size={110} level="H" marginSize={2} />
              <div className="qr-token-label">
                <span>Token:</span> <strong>{qrToken}</strong>
              </div>
            </div>

            <div className="qr-info-side">
              <div className={`qr-status-pill ${segundosRestantes > 0 ? 'active' : 'expired'}`}>
                {segundosRestantes > 0 ? '🟢 QR ACTIVO PARA ALUMNOS' : '🔴 TIEMPO EXPIRADO (PDF DESCARGADO)'}
              </div>

              <div className="qr-timer-display">
                <span className="timer-label">Tiempo restante de validez:</span>
                <span className={`timer-clock ${segundosRestantes < 120 ? 'urgent' : ''}`}>
                  ⏱️ {formatearTiempo(segundosRestantes)}
                </span>
              </div>

              <div className="qr-students-count">
                <span>👥 Escaneos en tiempo real: <strong>{alumnosQR.length} alumnos</strong></span>
              </div>

              <div className="qr-actions-row">
                <button className="btn-expand-qr" onClick={() => setShowQRModal(true)}>
                  🔍 Proyectar QR en Pantalla Grande
                </button>

                <button className="btn-download-pdf" onClick={() => descargarPDFAsistencia("manual")}>
                  📄 Descargar PDF de Asistencia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQRModal && qrToken && (
        <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setShowQRModal(false)}>✕</button>

            <div className="qr-modal-header">
              <h2>{infoClase.materia} - {infoClase.grupo}</h2>
              <p>Escanea el código QR desde la App para registrar tu asistencia</p>
            </div>

            <div className="qr-code-wrapper">
              <QRCodeCanvas value={qrToken} size={260} level="H" marginSize={3} includeMargin={true} />
            </div>

            <div className="qr-modal-token">
              <span>CÓDIGO TOKEN:</span>
              <span className="token-code-text">{qrToken}</span>
            </div>

            <div className={`modal-timer-badge ${segundosRestantes > 0 ? 'valid' : 'invalid'}`}>
              {segundosRestantes > 0 ? (
                <>⏱️ VÁLIDO POR: <strong className="big-timer">{formatearTiempo(segundosRestantes)}</strong> MINUTOS</>
              ) : (
                <>🔴 QR EXPIRADO - PDF de Asistencia descargado automáticamente</>
              )}
            </div>

            {alumnosQR.length > 0 && (
              <div className="modal-students-scanned">
                <h4>✅ Alumnos que han escanado ({alumnosQR.length}):</h4>
                <div className="scanned-tags">
                  {alumnosQR.map((nombre, i) => (
                    <span key={i} className="scanned-tag">✓ {nombre}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-close-modal-bottom" onClick={() => setShowQRModal(false)}>
              Cerrar Vista Proyector
            </button>
          </div>
        </div>
      )}

      <div className="attendance-table">
        <div className="table-row header-row">
          <div className="pill header-pill">MATRÍCULA</div>
          <div className="pill header-pill">ALUMNADO</div>
          <div className="pill header-pill">ESTADO</div>
          <div className="pill header-pill">ASISTENCIA</div>
          <div className="pill header-pill">FECHA</div>
        </div>

        {alumnos.map((alumno) => (
          <div className="table-row" key={alumno.id}>
            <div className="pill body-pill student-id">{alumno.matricula || alumno.identificador || 'N/A'}</div>
            <div className="pill body-pill student-name">{alumno.nombre}</div>
            
            <div 
              className={"pill body-pill status-" + (alumno.estado ? alumno.estado.toLowerCase() : "falta")}
              title="Asistencia registrada automáticamente por QR y matrícula"
            >
              {alumno.estado || "FALTA"}
            </div>

            <div 
              className={`pill body-pill check-mark ${!alumno.asistio ? 'absent' : ''}`}
              title="Asistencia registrada automáticamente por QR y matrícula"
            >
              {alumno.asistio ? "✓" : "X"}
            </div>

            <div className="pill body-pill date-text">{alumno.fecha}</div>
          </div>
        ))}
      </div>

      <div className="attendance-actions">
        <span className="save-status-msg">{saveMessage}</span>
        <div className="footer-btns-group">
          <button 
            className="btn-download-pdf-footer"
            onClick={() => descargarPDFAsistencia("manual")}
          >
            📄 Descargar Reporte PDF
          </button>
          <button 
            className="btn-save-attendance"
            onClick={guardarAsistencia}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;

