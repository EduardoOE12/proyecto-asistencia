import React, { useState, useEffect } from 'react';
import './DirectorDashboard.css';
import lobosImg from './assets/lobos.JPG';
import { API_BASE_URL } from './config';

const DirectorDashboard = ({ user, onLogout }) => {
  const directorName = user?.nombre || "Director(a)";
  const [docentes, setDocentes] = useState([]);
  const [todosGrupos, setTodosGrupos] = useState(["3A IA", "3B IA", "1A IA", "2A IA"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDocente, setSelectedDocente] = useState(null);
  const [selectedGrupos, setSelectedGrupos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const [resDocentes, resGrupos] = await Promise.all([
        fetch(`${API_BASE_URL}/api/docentes`),
        fetch(`${API_BASE_URL}/api/grupos`)
      ]);

      if (resDocentes.ok) {
        const dataDoc = await resDocentes.json();
        setDocentes(dataDoc.docentes || []);
      }
      if (resGrupos.ok) {
        const dataGrp = await resGrupos.json();
        if (dataGrp.grupos && dataGrp.grupos.length > 0) {
          setTodosGrupos(dataGrp.grupos);
        }
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de docentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleOpenAssign = (docente) => {
    setSelectedDocente(docente);
    setSelectedGrupos(docente.grupos || []);
    setStatusMessage('');
  };

  const handleToggleGrupo = (grupo) => {
    if (selectedGrupos.includes(grupo)) {
      setSelectedGrupos(selectedGrupos.filter(g => g !== grupo));
    } else {
      setSelectedGrupos([...selectedGrupos, grupo]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedDocente) return;
    setIsSaving(true);
    setStatusMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/docentes/asignar-grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: selectedDocente.correo || selectedDocente.nombre,
          nombre: selectedDocente.nombre,
          grupos: selectedGrupos
        })
      });

      if (response.ok) {
        setStatusMessage('¡Grupos asignados correctamente!');
        setDocentes(prev => prev.map(doc => {
          if (doc.nombre === selectedDocente.nombre || doc.correo === selectedDocente.correo) {
            return { ...doc, grupos: selectedGrupos };
          }
          return doc;
        }));
        setTimeout(() => {
          setSelectedDocente(null);
          setStatusMessage('');
        }, 1200);
      } else {
        setStatusMessage('Error al guardar la asignación.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error de conexión con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="director-container">
      <div className="director-box">
        
        <div className="director-topbar">
          <div className="director-info">
            {selectedDocente && (
              <button className="btn-back-director" onClick={() => setSelectedDocente(null)}>
                ← Volver
              </button>
            )}
            <span className="director-badge">Director</span>
            <span className="director-name">{directorName}</span>
          </div>
          {onLogout && (
            <button className="btn-logout" onClick={onLogout}>
              Cerrar Sesión
            </button>
          )}
        </div>

        <header className="director-header">
          <h2 className="director-welcome">
            Bienvenido, <span>{directorName}</span>
          </h2>
          <div className="director-logo-container">
            {lobosImg && (
              <img 
                src={lobosImg} 
                alt="Logo Somos Lobos" 
                className="director-logo" 
              />
            )}
            <h3 className="director-slogan">Somos Lobos</h3>
          </div>
        </header>

        {selectedDocente ? (
          <div>
            <div className="assign-teacher-header">
              <h3>Asignar grupos a: <strong>{selectedDocente.nombre}</strong></h3>
              <p>{selectedDocente.correo || 'Docente de la institución'}</p>
            </div>

            <p className="assign-instruction">Selecciona los grupos que impartirá este docente:</p>

            <div className="assign-grupos-grid">
              {todosGrupos.map((grupo, idx) => {
                const isSelected = selectedGrupos.includes(grupo);
                return (
                  <div
                    key={idx}
                    className={`assign-grupo-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleGrupo(grupo)}
                  >
                    <span>{grupo}</span>
                    <span className="assign-check-icon">{isSelected ? '✓' : '+'}</span>
                  </div>
                );
              })}
            </div>

            <div className="assign-actions-bar">
              <button 
                className="btn-cancel-assign"
                onClick={() => setSelectedDocente(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-save-assign"
                onClick={handleSaveAssignments}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Grupos'}
              </button>
            </div>

            {statusMessage && (
              <div className="assign-feedback-msg">{statusMessage}</div>
            )}
          </div>
        ) : (
          <>
            <div className="director-list-title">
              <span>Lista de Docentes</span>
              <span className="director-count-badge">{docentes.length} Docentes</span>
            </div>

            {loading ? (
              <div className="director-loading">Cargando docentes...</div>
            ) : error ? (
              <div className="director-empty">{error}</div>
            ) : docentes.length === 0 ? (
              <div className="director-empty">No hay docentes registrados en el sistema.</div>
            ) : (
              <div className="director-docentes-lista">
                {docentes.map((docente, index) => (
                  <div 
                    key={index} 
                    className="director-docente-card"
                    onClick={() => handleOpenAssign(docente)}
                    title="Haz clic o usa el lápiz para asignar grupos"
                  >
                    <div className="director-docente-info">
                      <span className="director-docente-name">{docente.nombre}</span>
                      {docente.correo && (
                        <span className="director-docente-email">{docente.correo}</span>
                      )}
                      <div className="director-docente-grupos-tag">
                        {docente.grupos && docente.grupos.length > 0 ? (
                          docente.grupos.map((g, gi) => (
                            <span key={gi} className="grupo-mini-tag">{g}</span>
                          ))
                        ) : (
                          <span className="grupo-mini-tag" style={{ background: '#888' }}>Sin grupos</span>
                        )}
                      </div>
                    </div>
                    <div className="director-docente-actions">
                      <button 
                        className="btn-edit-pencil" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssign(docente);
                        }}
                        title="Asignar grupos a este docente"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default DirectorDashboard;
