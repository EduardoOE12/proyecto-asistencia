import React, { useState } from 'react';
import LoadingScreen from './LoadingScreen'; // Aquí importamos tu componente

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? (
        // Muestra la pantalla de carga
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      ) : (
        // Lo que se muestra cuando la carga termina
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
          <h1>¡Bienvenido a cerobetis!</h1>
          <p>La pantalla de carga finalizó. Aquí irá el resto de tu proyecto conectado a tu backend de Python.</p>
        </div>
      )}
    </>
  );
}

export default App;