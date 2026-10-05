import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

import lobosImg from './assets/lobos.JPG';
import gatoImg from './assets/gato.JPG';
import perroImg from './assets/perro.JPG';

const LoadingScreen = ({ onFinish }) => {
  const [fase, setFase] = useState(1);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    if (fase === 1) {
      const timer = setTimeout(() => setFase(2), 2000);
      return () => clearTimeout(timer);
    }

    if (fase === 2) {
      const interval = setInterval(() => {
        setProgreso((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setFase(4);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    }

    if (fase === 4) {
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [fase, onFinish]);

  return (
    <div className="loading-container">
      <h1 className="app-title">CBTIS 287</h1>

      <div className="image-container">
        {fase === 1 && <img src={lobosImg} alt="Somos Lobos" className="opt-img" />}

        {(fase === 2 || fase === 3) && (
          <div className="fase-carga">
            <img src={gatoImg} alt="Cargando Gato" className="opt-img" />
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progreso}%` }}></div>
            </div>
            <p className="loading-text">Cargando... {progreso}%</p>
          </div>
        )}

        {fase === 4 && <img src={perroImg} alt="Carga Completa Perro" className="opt-img" />}
      </div>
    </div>
  );
};

export default LoadingScreen;