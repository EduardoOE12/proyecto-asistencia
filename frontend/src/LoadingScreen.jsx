import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

// Importación de las imágenes JPG
import lobosImg from './assets/lobos.JPG';
import gatoImg from './assets/gato.JPG';
import perroImg from './assets/perro.JPG';

const LoadingScreen = ({ onFinish }) => {
  const [fase, setFase] = useState(1);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    // Fase 1: Nombre de la app y logo #somos lobos (Dura 2 segundos)
    if (fase === 1) {
      const timer = setTimeout(() => setFase(2), 2000);
      return () => clearTimeout(timer);
    }

    // Fase 2 y 3: Gato con barra de carga progresiva
    if (fase === 2) {
      const interval = setInterval(() => {
        setProgreso((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setFase(4); // Al llegar a 100%, pasa a la fase 4
            return 100;
          }
          return prev + 2; // Incremento de la barra
        });
      }, 50); // Velocidad de carga

      return () => clearInterval(interval);
    }

    // Fase 4: Perro (Dura 1.5 segundos y luego quita la pantalla de carga)
    if (fase === 4) {
      const timer = setTimeout(() => {
        if (onFinish) onFinish(); // Finaliza la carga
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [fase, onFinish]);

  return (
    <div className="loading-container">
      {/* El nombre de la aplicación siempre aparece */}
      <h1 className="app-title">cerrobetis</h1>

      <div className="image-container">
        {/* Pantalla 1 */}
        {fase === 1 && <img src={lobosImg} alt="Somos Lobos" className="opt-img" />}

        {/* Pantalla 2 y 3 */}
        {(fase === 2 || fase === 3) && (
          <div className="fase-carga">
            <img src={gatoImg} alt="Cargando Gato" className="opt-img" />
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progreso}%` }}></div>
            </div>
            <p className="loading-text">Cargando... {progreso}%</p>
          </div>
        )}

        {/* Pantalla 4 */}
        {fase === 4 && <img src={perroImg} alt="Carga Completa Perro" className="opt-img" />}
      </div>
    </div>
  );
};

export default LoadingScreen;