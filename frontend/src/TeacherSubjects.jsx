import React from 'react';
import './TeacherSubjects.css';
import lobosImg from './assets/lobos.JPG';

const TeacherSubjects = ({ user, onSubjectSelect, onLogout }) => {
  // Jalamos el nombre del docente de la sesión activa
  const teacherName = user?.nombre || "Docente Registrado";

  const handleSubjectClick = (materia, diaAsignado, horaInicio, horaFin) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const timeInHours = currentHour + (currentMinutes / 60);

    // Verificamos si el día coincide y si la hora actual está dentro del rango
    if (currentDay === diaAsignado && timeInHours >= horaInicio && timeInHours < horaFin) {
      onSubjectSelect(materia);
    } else {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      alert(`ACCESO DENEGADO\n\nNo puedes ingresar a esta materia. El horario asignado no coincide con el día y la hora actual.\n\nHorario de esta clase: ${dias[diaAsignado]} de ${horaInicio}:00 a ${horaFin}:00`);
    }
  };

  return (
    <div className="ts-container">
      <div className="ts-box">
        
        {/* Barra superior de sesión del docente */}
        <div className="ts-topbar">
          <div className="ts-teacher-info">
            <span className="teacher-badge">Docente</span>
            <span className="ts-teacher-name">{teacherName}</span>
          </div>
          {onLogout && (
            <button className="btn-logout" onClick={onLogout}>
              Cerrar Sesión
            </button>
          )}
        </div>

        <header className="ts-header">
          <h1 className="ts-title">Somos Lobos</h1>
          {lobosImg && <img src={lobosImg} alt="Logo Somos Lobos" className="ts-logo" />}
        </header>

        <h3 className="ts-list-title">HORARIO DE MATERIAS</h3>
        
        <div className="ts-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>HORARIO</th>
                <th>LUNES</th>
                <th>MARTES</th>
                <th>MIÉRCOLES</th>
                <th>JUEVES</th>
                <th>VIERNES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="time-col">07:00 - 08:00</td>
                <td></td>
                <td onClick={() => handleSubjectClick('INGLÉS III', 2, 7, 8)} className="subject-cell">INGLÉS III</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td className="time-col">08:00 - 09:00</td>
                <td onClick={() => handleSubjectClick('FORMACIÓN SOCIOEMOCIONAL III', 1, 8, 9)} className="subject-cell">FORMACIÓN SOCIOEMOCIONAL III</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL', 2, 8, 10)} className="subject-cell">Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('HUMANIDADES II', 3, 8, 10)} className="subject-cell">HUMANIDADES II</td>
                <td onClick={() => handleSubjectClick('Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL', 4, 8, 9)} className="subject-cell">Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL</td>
                <td onClick={() => handleSubjectClick('Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL', 5, 8, 9)} className="subject-cell">Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL</td>
              </tr>
              <tr>
                <td className="time-col">09:00 - 10:00</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('INGLÉS III', 1, 9, 11)} className="subject-cell">INGLÉS III</td>
                <td onClick={() => handleSubjectClick('Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL', 4, 9, 10)} className="subject-cell">Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL</td>
                <td onClick={() => handleSubjectClick('Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL', 5, 9, 10)} className="subject-cell">Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL</td>
              </tr>
              <tr>
                <td className="time-col">10:00 - 11:00</td>
                <td onClick={() => handleSubjectClick('Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL', 2, 10, 11)} className="subject-cell">Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL</td>
                <td onClick={() => handleSubjectClick('LENGUA Y COMUNICACIÓN III', 3, 10, 11)} className="subject-cell">LENGUA Y COMUNICACIÓN III</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('LENGUA Y COMUNICACIÓN III', 4, 10, 12)} className="subject-cell">LENGUA Y COMUNICACIÓN III</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('HUMANIDADES II', 5, 10, 12)} className="subject-cell">HUMANIDADES II</td>
              </tr>
              <tr>
                <td className="time-col">11:00 - 12:00</td>
                <td onClick={() => handleSubjectClick('ABC DE LAS EMOCIONES', 1, 11, 12)} className="subject-cell">ABC DE LAS EMOCIONES</td>
                <td onClick={() => handleSubjectClick('Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL', 2, 11, 12)} className="subject-cell">Sb2.-SOLUCIONA PROBLEMAS CON LENGUAJE NATURAL</td>
                <td onClick={() => handleSubjectClick('Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL', 3, 11, 12)} className="subject-cell">Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL</td>
              </tr>
              <tr>
                <td className="time-col">12:00 - 13:00</td>
                <td onClick={() => handleSubjectClick('Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL', 1, 12, 13)} className="subject-cell">Sb3.-SOLUCIONA PROBLEMAS CON VISIÓN ARTIFICIAL</td>
                <td onClick={() => handleSubjectClick('PENSAMIENTO MATEMÁTICO III', 2, 12, 13)} className="subject-cell">PENSAMIENTO MATEMÁTICO III</td>
                <td onClick={() => handleSubjectClick('PENSAMIENTO MATEMÁTICO III', 3, 12, 13)} className="subject-cell">PENSAMIENTO MATEMÁTICO III</td>
                <td onClick={() => handleSubjectClick('PENSAMIENTO MATEMÁTICO III', 4, 12, 13)} className="subject-cell">PENSAMIENTO MATEMÁTICO III</td>
                <td onClick={() => handleSubjectClick('TUTORÍA', 5, 12, 13)} className="subject-cell">TUTORÍA</td>
              </tr>
              <tr>
                <td className="time-col">13:00 - 14:00</td>
                <td onClick={() => handleSubjectClick('PENSAMIENTO MATEMÁTICO III', 1, 13, 14)} className="subject-cell">PENSAMIENTO MATEMÁTICO III</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('CIENCIAS NATURALES, EXPERIMENTALES Y TECNOLOGÍA III Nuestro hogar. El sistema terrestre.', 2, 13, 15)} className="subject-cell">CIENCIAS NATURALES, EXPERIMENTALES Y TECNOLOGÍA III<br/>Nuestro hogar. El sistema terrestre.</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('CIENCIAS NATURALES, EXPERIMENTALES Y TECNOLOGÍA III Nuestro hogar. El sistema terrestre.', 3, 13, 15)} className="subject-cell">CIENCIAS NATURALES, EXPERIMENTALES Y TECNOLOGÍA III<br/>Nuestro hogar. El sistema terrestre.</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING', 4, 13, 15)} className="subject-cell">Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING</td>
                <td rowSpan="2" onClick={() => handleSubjectClick('Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING', 5, 13, 15)} className="subject-cell">Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING</td>
              </tr>
              <tr>
                <td className="time-col">14:00 - 15:00</td>
                <td onClick={() => handleSubjectClick('Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING', 1, 14, 15)} className="subject-cell">Sb1.-SOLUCIONA PROBLEMAS CON MACHINE LEARNING</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default TeacherSubjects;