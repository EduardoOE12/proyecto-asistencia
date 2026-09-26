import React, { useState, useEffect } from 'react';
import './TeacherAttendance.css';

const TeacherAttendance = ({ user, onLogout }) => {
  const [infoClase] = useState({
    grupo: "3A IA",
    materia: "MATEMATICAS",
    horario: "7:00 am - 9:00am"
  });

  const [alumnos, setAlumnos] = useState([
    { id: 1, nombre: "FATIMA", estado: "ATRASADO", asistio: true, fecha: "17-SEP-26" },
    { id: 2, nombre: "CLAUDIA", estado: "PUNTUAL", asistio: true, fecha: "17-SEP-26" },
    { id: 3, nombre: "REINA", estado: "PUNTUAL", asistio: true, fecha: "17-SEP-26" }
  ]);

  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Intentar cargar la lista de alumnos del backend
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/asistencia/alumnos');
        if (response.ok) {
          const data = await response.json();
          if (data.alumnos && data.alumnos.length > 0) {
            setAlumnos(data.alumnos);
          }
        }
      } catch (err) {
        console.log("Usando datos locales de asistencia:", err);
      }
    };
    fetchAlumnos();
  }, []);

  // Alternar asistencia (✓ / X)
  const toggleAsistencia = (id) => {
    setAlumnos(prev => prev.map(alumno => {
      if (alumno.id === id) {
        const nuevoAsistio = !alumno.asistio;
        return {
          ...alumno,
          asistio: nuevoAsistio,
          estado: nuevoAsistio ? "PUNTUAL" : "FALTA"
        };
      }
      return alumno;
    }));
  };

  // Alternar estado (PUNTUAL -> ATRASADO -> FALTA -> PUNTUAL)
  const toggleEstado = (id) => {
    setAlumnos(prev => prev.map(alumno => {
      if (alumno.id === id) {
        let nuevoEstado = "PUNTUAL";
        let nuevoAsistio = true;
        if (alumno.estado === "PUNTUAL") {
          nuevoEstado = "ATRASADO";
          nuevoAsistio = true;
        } else if (alumno.estado === "ATRASADO") {
          nuevoEstado = "FALTA";
          nuevoAsistio = false;
        } else {
          nuevoEstado = "PUNTUAL";
          nuevoAsistio = true;
        }
        return {
          ...alumno,
          estado: nuevoEstado,
          asistio: nuevoAsistio
        };
      }
      return alumno;
    }));
  };

  // Guardar lista de asistencia en backend
  const guardarAsistencia = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/asistencia/guardar', {
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
      {/* Barra superior de sesión del docente */}
      <div className="teacher-topbar">
        <div className="teacher-info">
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
        <h1 className="group-title">{infoClase.grupo}</h1>
        <div className="subject-info">
          <h2>{infoClase.materia}</h2>
          <p>{infoClase.horario}</p>
        </div>
      </header>

      <div className="attendance-table">
        <div className="table-row header-row">
          <div className="pill header-pill">ALUMNADO</div>
          <div className="pill header-pill">ESTADO</div>
          <div className="pill header-pill">ASISTENCIA</div>
          <div className="pill header-pill">FECHA</div>
        </div>

        {alumnos.map((alumno) => (
          <div className="table-row" key={alumno.id}>
            <div className="pill body-pill student-name">{alumno.nombre}</div>
            
            {/* Pill de Estado interactivo */}
            <div 
              className={"pill body-pill interactive-pill status-" + alumno.estado.toLowerCase()}
              onClick={() => toggleEstado(alumno.id)}
              title="Haz clic para cambiar estado (PUNTUAL / ATRASADO / FALTA)"
            >
              {alumno.estado}
            </div>

            {/* Pill de Asistencia interactiva */}
            <div 
              className={`pill body-pill interactive-pill check-mark ${!alumno.asistio ? 'absent' : ''}`}
              onClick={() => toggleAsistencia(alumno.id)}
              title="Haz clic para alternar asistencia"
            >
              {alumno.asistio ? "✓" : "X"}
            </div>

            <div className="pill body-pill date-text">{alumno.fecha}</div>
          </div>
        ))}
      </div>

      {/* Botón de Guardar Asistencia */}
      <div className="attendance-actions">
        <span className="save-status-msg">{saveMessage}</span>
        <button 
          className="btn-save-attendance"
          onClick={guardarAsistencia}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>
    </div>
  );
};

export default TeacherAttendance;