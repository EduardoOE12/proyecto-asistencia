import React, { useState } from 'react';
import LoadingScreen from './LoadingScreen';
import Login from './Login';
import TeacherSubjects from './TeacherSubjects';
import TeacherAttendance from './TeacherAttendance';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ESTADO: Para saber qué materia seleccionó el maestro
  const [selectedSubject, setSelectedSubject] = useState(null);

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setSelectedSubject(null); // Reiniciamos la materia al iniciar sesión
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedSubject(null);
  };

  return (
    <>
      {isLoading ? (
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      ) : !currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.rol === 'Docente' ? (
        
        /* --- LÓGICA PARA DOCENTES --- */
        !selectedSubject ? (
          /* 1. Si no ha elegido materia, mostramos la pantalla de materias (Diseño Libreta) */
          <TeacherSubjects 
            user={currentUser} 
            onSubjectSelect={(materia) => setSelectedSubject(materia)}
            onLogout={handleLogout}
          />
        ) : (
          /* 2. Si ya eligió materia, mostramos la pantalla de asistencia (Diseño Oscuro) */
          <TeacherAttendance 
            user={currentUser} 
            materia={selectedSubject} 
            onBack={() => setSelectedSubject(null)} 
            onLogout={handleLogout} 
          />
        )
        /* ---------------------------------- */

      ) : (
        /* Pantalla para otros roles (Alumno / Director) */
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