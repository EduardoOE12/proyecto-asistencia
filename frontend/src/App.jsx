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
          maxWidth: '800px',
          margin: '40px auto',
          padding: '30px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: '#8b0000',
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            {currentUser.rol}
          </div>

          <h1 style={{ color: '#111', margin: '10px 0' }}>
            Bienvenido(a), {currentUser.nombre}
          </h1>
          
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Has iniciado sesión correctamente en el sistema.
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setCurrentUser({ ...currentUser, rol: 'Docente' })}
              style={{
                padding: '12px 24px',
                background: '#2b2b2b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Ir a Pantalla de Docentes (Pasar Lista)
            </button>

            <button 
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                background: '#c62828',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
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