import React, { useState } from 'react';
import './Login.css';
import lobosImg from './assets/lobos.JPG'; 
import { API_BASE_URL } from './config';

const Login = ({ onLoginSuccess }) => {
  const [pantalla, setPantalla] = useState('bienvenida');
  const [rol, setRol] = useState('');
  const [identificador, setIdentificador] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await fetch(`${API_BASE_URL}/api/login`, {
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
        localStorage.setItem('usuario_identificador', identificador);
        localStorage.setItem('usuario_rol', rol);

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
      setErrorMsg('Error de conexión con el servidor.');
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (rol === 'Alumno') {
                      setIdentificador(val.replace(/\D/g, ''));
                    } else {
                      setIdentificador(val);
                    }
                  }}
                  inputMode={rol === 'Alumno' ? 'numeric' : undefined}
                  maxLength={rol === 'Alumno' ? 15 : undefined}
                  required 
                  placeholder={rol === 'Alumno' ? 'Ingresa tu matrícula (solo números)' : 'correo@ejemplo.com'}
                />
              </div>

              <div className="input-group">
                <label>Contraseña:</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
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