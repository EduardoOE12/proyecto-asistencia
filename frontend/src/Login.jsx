import React, { useState } from 'react';
import './Login.css';
import lobosImg from './assets/lobos.JPG'; // Reutilizamos tu logo

const Login = () => {
  // Estados para controlar qué pantalla vemos
  const [pantalla, setPantalla] = useState('bienvenida'); // 'bienvenida', 'roles', 'formulario'
  const [rol, setRol] = useState(''); // 'Alumno', 'Docente', 'Director'
  
  // Estados para los inputs
  const [identificador, setIdentificador] = useState(''); // Servirá para Matrícula o Correo
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Validaciones
  const validarFormulario = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validación de Matrícula (Solo si es alumno)
    if (rol === 'Alumno') {
      if (identificador.length < 1 || identificador.length > 15) {
        setErrorMsg('La matrícula debe tener entre 1 y 15 caracteres.');
        return;
      }
    }

    // Validación de Contraseña
    // Regex: Mínimo 8 chars, 1 mayúscula, 1 número, 1 caracter especial
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.');
      return;
    }

    // Si pasa las validaciones, aquí lo conectarías con tu backend en Python (FastAPI)
    alert(`Inicio de sesión exitoso como ${rol}.\nUsuario: ${identificador}`);
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
        
        {/* PANTALLA 1: Bienvenida */}
        {pantalla === 'bienvenida' && (
          <div className="view-section">
            <h1 className="title-black">Bienvenidos</h1>
            <img src={lobosImg} alt="Logo Somos Lobos" className="logo-login" />
            <button className="btn-red" onClick={irAPantallaRoles}>
              Iniciar Sesión
            </button>
          </div>
        )}

        {/* PANTALLA 2: Selección de Roles */}
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

        {/* PANTALLAS 3, 4 y 5: Formulario dinámico según el rol */}
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