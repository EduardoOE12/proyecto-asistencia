import React from 'react';
import './TeacherSubjects.css';
import lobosImg from './assets/lobos.JPG';

const TeacherSubjects = ({ user, onSubjectSelect, onLogout }) => {
  // Jalamos el nombre del docente de la sesión activa
  const teacherName = user?.nombre || "Docente Registrado";

  const materias = [
    "Lengua", 
    "Matemáticas", 
    "Ciencias", 
    "Historia", 
    "Programación"
  ];

  return (
    <div className="ts-container">
      <div className="ts-box">
        
        {/* Barra superior de sesión del docente (igual que en TeacherAttendance) */}
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

        <h3 className="ts-list-title">LISTA DE MATERIAS</h3>
        
        {/* Materias en forma de lista estilo Pills (igual que en TeacherAttendance) */}
        <div className="ts-materias-lista">
          {materias.map((materia, index) => (
            <button 
              key={index} 
              className="ts-materia-pill"
              onClick={() => onSubjectSelect(materia)}
            >
              <span className="ts-materia-text">{materia}</span>
              <span className="ts-materia-arrow">➔</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TeacherSubjects;