import React from 'react';
import './TeacherSubjects.css';

const TeacherSubjects = ({ user, onSubjectSelect, onLogout }) => {
  const teacherName = user?.nombre || "DRA. MARIA GARCIA LUNA";

  const materias = [
    "Lengua", 
    "Matemáticas", 
    "Ciencias", 
    "Historia", 
    "Programación"
  ];

  return (
    <div className="ts-page-bg">
      <div className="ts-card">
        
        <h1 className="ts-title">Cerrobetis</h1>
        <h2 className="ts-subtitle">Docente: {teacherName}</h2>
        
        <h3 className="ts-list-title">Lista de materias</h3>
        
        {/* Aquí forzamos la lista */}
        <div className="ts-materias-lista">
          {materias.map((materia, index) => (
            <button 
              key={index} 
              className="ts-btn-materia"
              onClick={() => onSubjectSelect(materia)}
            >
              {materia}
            </button>
          ))}
        </div>

        <button className="ts-btn-logout" onClick={onLogout}>
          Cerrar Sesión
        </button>

      </div>
    </div>
  );
};

export default TeacherSubjects;