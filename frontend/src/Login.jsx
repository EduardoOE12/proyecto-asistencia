import React, { useState } from 'react';
import './Login.css';
import lobosImg from './assets/lobos.JPG'; 

// 1. Agregamos la propiedad 'onLoginSuccess' que le manda App.jsx
const Login = ({ onLoginSuccess }) => {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [rol, setRol] = useState('');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validarFormulario = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (rol === 'Alumno') {
      if (identificador.length < 1 || identificador.length > 15) {
        setErrorMsg('La matrícula debe tener entre 1 y 15 caracteres.');
        return;
      }
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rol: rol,
          identificador: identificador,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`¡Bienvenido ${data.alumno || rol}!`);
        
        // 2. AQUI ESTÁ LA MAGIA: 
        // Le avisamos a App.jsx que el login fue exitoso y le mandamos los datos
        if (onLoginSuccess) {
          onLoginSuccess({
            nombre: data.alumno || "Usuario",
            rol: rol,
            identificador: identificador
          });
        }
      } else {
        setErrorMsg(data.detail || 'Ocurrió un error al iniciar sesión.');
      }
    } catch (error) {
      setErrorMsg('Error de conexión con el servidor. ¿Está encendido el backend?');
    }
  };

  const irAPantallaRoles = () => setPantalla('roles');
  
  const seleccionarRol = (rolSeleccionado) => {
    setRol(rolSeleccionado);
    setIdentificador('');
    setPassword('');
    setErrorMsg('');
    setPantalla('formulario');
  };

  const volverAtras = () => {
    if (pantalla === 'formulario') setPantalla('roles');
    else if (pantalla === 'roles') setPantalla('bienvenida');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        
        {pantalla === 'bienvenida' && (
          <div className="view-section">
            <h1 className="title-black">Bienvenidos</h1>
            <img src={lobosImg} alt="Logo Somos Lobos" className="logo-login" />
            <button className="btn-red" onClick={irAPantallaRoles}>
              Iniciar Sesión
            </button>
          </div>
        )}

        {pantalla === 'roles' && (
          <div className="view-section">
            <button className="btn-back" onClick={volverAtras}>← Volver</button>
            <h1 className="title-black">Bienvenidos</h1>
            <img src={lobosImg} alt="Logo Somos Lobos" className="logo-login-small" />
            <h2 className="subtitle-gray">Iniciar sesión como:</h2>
            <div className="role-buttons">
              <button className="btn-gray" onClick={() => seleccionarRol('Alumno')}>Alumno</button>
              <button className="btn-gray" onClick={() => seleccionarRol('Docente')}>Docente</button>
              <button className="btn-gray" onClick={() => seleccionarRol('Director')}>Director</button>
            </div>
          </div>
        )}

        {pantalla === 'formulario' && (
          <div className="view-section">
            <button className="btn-back" onClick={volverAtras}>← Volver</button>
            
            <h1 className="title-black">{rol}</h1>
            <h2 className="subtitle-gray">Iniciar Sesión</h2>

            <form onSubmit={validarFormulario} className="login-form">
              <div className="input-group">
                <label>{rol === 'Alumno' ? 'Matrícula:' : 'Correo:'}</label>
                <input 
                  type={rol === 'Alumno' ? 'text' : 'email'} 
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  maxLength={rol === 'Alumno' ? 15 : undefined}
                  required 
                  placeholder={rol === 'Alumno' ? 'Ingresa tu matrícula' : 'correo@ejemplo.com'}
                />
              </div>

              <div className="input-group">
                <label>Contraseña:</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  placeholder="********"
                />
              </div>

              {errorMsg && <div className="error-message">{errorMsg}</div>}

              <button type="submit" className="btn-red submit-btn">
                Entrar
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;