import React, { useState } from 'react';
import './TeacherAttendance.css';

const TeacherAttendance = () => {
  const [infoClase] = useState({
    grupo: "3A IA",
    materia: "MATEMATICAS",
    horario: "7:00 am - 9:00am"
  });

  const [alumnos] = useState([
    { id: 1, nombre: "FATIMA", estado: "ATRASADO", asistio: true, fecha: "17-SEP-26" },
    { id: 2, nombre: "CLAUDIA", estado: "PUNTUAL", asistio: true, fecha: "17-SEP-26" },
    { id: 3, nombre: "REINA", estado: "PUNTUAL", asistio: true, fecha: "17-SEP-26" }
  ]);

  return (
    <div className="attendance-container">
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
            <div className={"pill body-pill status-" + alumno.estado.toLowerCase()}>
              {alumno.estado}
            </div>
            <div className="pill body-pill check-mark">
              {alumno.asistio ? "✓" : "X"}
            </div>
            <div className="pill body-pill date-text">{alumno.fecha}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherAttendance;