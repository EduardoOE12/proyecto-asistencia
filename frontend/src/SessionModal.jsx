import React from 'react';
import './SessionModal.css';

const SessionModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="session-modal-overlay" role="dialog" aria-modal="true">
      <div className="session-modal-backdrop" onClick={onClose}></div>
      <div className="session-modal-container">
        <div className="session-modal-icon-wrapper">
          <svg
            className="session-modal-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <path d="M12 7v3" stroke="#cc0000" strokeWidth="2.5" />
            <circle cx="12" cy="13" r="0.75" fill="#cc0000" />
          </svg>
          <span className="session-modal-badge-warn">!</span>
        </div>

        <div className="session-modal-tag">SESIÓN ÚNICA ACTIVA</div>
        <h2 className="session-modal-title">Sesión Cerrada</h2>

        <p className="session-modal-desc">
          {message ||
            'Se ha iniciado sesión con tu cuenta en un nuevo dispositivo. Por seguridad, la sesión anterior en este dispositivo ha sido invalidada de manera automática.'}
        </p>

        <div className="session-modal-info-box">
          <svg
            className="session-modal-info-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            Solo se permite <strong>1 dispositivo conectado</strong> a la vez para evitar registros simultáneos de asistencia.
          </span>
        </div>

        <button className="session-modal-btn" onClick={onClose}>
          Aceptar e Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default SessionModal;
