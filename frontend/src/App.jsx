import React, { useState } from 'react';
import LoadingScreen from './LoadingScreen';
import Login from './Login'; // Importamos tu nuevo componente de Login

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? (
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      ) : (
        <Login /> // Mostramos el login cuando termina de cargar
      )}
    </>
  );
}

import TeacherAttendance from './TeacherAttendance';

function App() {
  return (
    <div>
      <TeacherAttendance />
    </div>
  );
}

export default App;