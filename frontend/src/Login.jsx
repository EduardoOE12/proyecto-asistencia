import React, { useState } from 'react';
import './Login.css';
import lobosImg from './assets/lobos.JPG'; // Reutilizamos tu logo

const Login = ({ onLoginSuccess }) => {
  // Estados para controlar qué pantalla vemos
  const [pantalla, setPantalla] = useState('bienvenida'); // 'bienvenida', 'roles', 'formulario'
  const [rol, setRol] = useState(''); // 'Alumno', 'Docente', 'Director'

  // Estados para los inputs
  const [identificador, setIdentificador] = useState(''); // Servirá para Matrícula o Correo
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manejar cambio en el identificador (Solo permite números para Alumnos)
  const handleIdentificadorChange = (e) => {
    const val = e.target.value;
    if (rol === 'Alumno') {
      // Solo permite dígitos 0-9
      if (!/^\d*$/.test(val)) return;
    }
    setIdentificador(val);
  };

  // Validaciones y conexión con el backend
  const validarFormulario = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validación de Matrícula (Solo si es alumno)
    if (rol === 'Alumno') {
      if (identificador.length < 1 || identificador.length > 15) {
        setErrorMsg('La matrícula debe tener entre 1 y 15 números.');
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

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rol: rol,
          identificador: identificador.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.detail || 'Error al validar los datos.');
        return;
      }

      const userObj = {
        nombre: data.nombre || data.alumno || identificador,
        rol: data.rol || rol,
        identificador: identificador
      };

      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      } else {
        alert(`¡${data.mensaje}!\nUsuario: ${userObj.nombre}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudo establecer conexión con el servidor.');
    }
  };

  const irAPantallaRoles = () => setPantalla('roles');

  const seleccionarRol = (rolSeleccionado) => {
    setRol(rolSeleccionado);
    setIdentificador('');
    setPassword('');
    setShowPassword(false);
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
                  onChange={handleIdentificadorChange}
                  maxLength={rol === 'Alumno' ? 15 : undefined}
                  required
                  placeholder={rol === 'Alumno' ? 'Ingresa tu matrícula (solo números)' : 'correo@ejemplo.com'}
                />
              </div>

              <div className="input-group">
                <label>Contraseña:</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      /* Icono Ojo Tachado (Ocultar) */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      /* Icono Ojo (Ver) */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
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