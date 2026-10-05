# Sistema de Control de Asistencia Escolar - CBTIS 287

Sistema web para la gestión automatizada de asistencias escolares mediante códigos QR dinámicos, adaptado para funcionar en red local (LAN) en dispositivos móviles y de escritorio. Cuenta con roles de **Alumno**, **Docente** y **Director**.

---

## 📋 Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas en el equipo anfitrión:

- **Python 3.10 o superior**: [Descargar Python](https://www.python.org/)
- **Node.js 18 o superior**: [Descargar Node.js](https://nodejs.org/)
- **pnpm** (recomendado) o **npm**:
  ```powershell
  npm install -g pnpm
  ```

---

## 📦 Instalación de Dependencias

### 1. Dependencias del Backend (Python)
Desde la terminal en la raíz del proyecto:
```powershell
pip install -r backend/requirements.txt
```

> **Librerías principales:**
> - `fastapi` y `uvicorn`: API REST de alto rendimiento y servidor ASGI.
> - `pydantic`: Validación de modelos y datos de entrada.
> - `qrcode[pil]`, `pandas`, `openpyxl`: Generación y exportación de datos.

### 2. Dependencias del Frontend (React + Vite)
Dirígete a la carpeta `frontend` e instala los paquetes:
```powershell
cd frontend
pnpm install
# O si usas npm:
# npm install
cd ..
```

> **Librerías principales:**
> - `react` y `react-dom` (v19)
> - `html5-qrcode`: Lector de códigos QR directo desde la cámara del navegador.
> - `qrcode.react`: Renderizado de códigos QR en lienzo para docentes.
> - `jspdf` y `jspdf-autotable`: Generación de reportes de asistencia en PDF descargables.
> - `@vitejs/plugin-basic-ssl`: Habilitación de HTTPS en desarrollo local (requerido para permisos de cámara en celulares).

---

## 🌐 Configuración de Red Central (`network_config.json`)

En la raíz del proyecto se encuentra el archivo [`network_config.json`](./network_config.json), que centraliza la IP y los puertos para todo el sistema:

```json
{
  "SERVER_IP": "auto",
  "BACKEND_PORT": 8000,
  "FRONTEND_PORT": 5173
}
```

### ¿Cómo configurarlo según tus necesidades?

1. **Modo Automático (`"SERVER_IP": "auto"`)**:
   - No necesitas escribir tu IP manual. El frontend detecta automáticamente la dirección IP del equipo host (`window.location.hostname`).
   - Al cambiar de red Wi-Fi o probar en otra computadora, funcionará sin necesidad de editar código.

2. **IP Fija (Opcional)**:
   - Si deseas forzar una IP específica, cambia `"auto"` por la IP deseada.

3. **Disponibilidad de Puertos (`BACKEND_PORT` / `FRONTEND_PORT`)**:
   - Si el puerto `8000` o `5173` está ocupado por otra aplicación en la computadora donde realizas pruebas, simplemente cámbialo en este archivo. Tanto el backend como el frontend adoptarán la nueva configuración universalmente.

> [!IMPORTANT]
> `network_config.json` está en `.gitignore` y **no se sube a GitHub**. Para crear tu copia local copia el archivo de ejemplo:
> ```powershell
> copy network_config.json.example network_config.json
> ```

---

## 🔐 Seguridad — Archivos que NO se suben a GitHub

Los siguientes archivos contienen datos sensibles (contraseñas, matrículas, teléfonos, IPs locales) y están excluidos mediante `.gitignore`:

| Archivo | Motivo |
|---|---|
| `backend/regristos - Hoja 1.csv` | Credenciales de todos los usuarios |
| `backend/bd_prueba - Hoja 1.csv` | Matrículas y teléfonos de alumnos |
| `backend/registros-docentes.csv` | Correos y teléfonos de docentes |
| `backend/registros-directores.csv` | Correos y teléfonos de directores |
| `backend/asignaciones_docentes.csv` | Asignaciones de grupos en curso |
| `backend/registro_asistencias.csv` | Historial de asistencias |
| `network_config.json` | IP local y puertos del equipo anfitrión |

Cada uno de estos archivos tiene una versión `.example` en el repositorio que muestra su estructura sin datos reales. Al clonar el proyecto, crea tus propios archivos de datos copiando los ejemplos:
```powershell
copy network_config.json.example network_config.json
copy "backend\regristos - Hoja 1.csv.example" "backend\regristos - Hoja 1.csv"
copy "backend\bd_prueba - Hoja 1.csv.example" "backend\bd_prueba - Hoja 1.csv"
copy "backend\registros-docentes.csv.example" "backend\registros-docentes.csv"
copy "backend\registros-directores.csv.example" "backend\registros-directores.csv"
```

---

## 🚀 Ejecución del Proyecto

Abre dos terminales (una para el Backend y otra para el Frontend):

### Terminal 1: Iniciar Backend
Desde la raíz del proyecto:
```powershell
python run_server.py
```
*El script detectará tu IP en la red local y mostrará un banner informativo con las URLs de acceso.*

### Terminal 2: Iniciar Frontend
```powershell
cd frontend
pnpm run dev
# O si usas npm:
# npm run dev
```

---

## 📱 Cómo Probar en Dispositivos Móviles (en la misma red Wi-Fi)

1. Conecta tu teléfono celular o tablet a la **misma red Wi-Fi** donde está corriendo el servidor.
2. Abre el navegador móvil (Safari, Chrome, Edge) y escribe la dirección mostrada por Vite con HTTPS, por ejemplo:
   ```text
   https://192.168.1.XXX:XXXX
   ```
3. **Certificado de Seguridad Local (Paso único)**:
   - Dado que el servidor de desarrollo utiliza un certificado SSL local seguro para permitir el acceso a la cámara, el navegador móvil mostrará una advertencia de "Conexión no privada" o "Sitio no seguro".
   - Toca en **Configuración avanzada** (o *Mostrar detalles*) y selecciona **Continuar a [tu IP] (no seguro)**.
4. Con esto, el navegador otorgará los permisos nativos a la cámara para escanear el QR sin bloqueos.

---

## 🧪 Flujo de Prueba del Sistema

1. **Docente**:
   - Inicia sesión seleccionando el rol **Docente**.
   - Haz clic en una materia dentro de su horario activo.
   - Presiona **Generar Código QR** (el token tiene una validez de 15 minutos).
   - Puedes hacer clic en **Proyectar QR en Pantalla Grande** para mostrarlo al alumnado.

2. **Alumno**:
   - En el dispositivo móvil, inicia sesión con el rol **Alumno** ingresando su matrícula.
   - Pulsa en **Abrir Escáner de Cámara** y concede el permiso solicitado por el navegador.
   - Apunta la cámara al código QR proyectado por el docente.
   - El sistema validará el token y la matrícula del alumno en el servidor.

3. **Verificación en Tiempo Real**:
   - En la pantalla del Docente, el alumno cambiará automáticamente su estado de **FALTA** a **PRESENTE** con su marca de verificación (✓).
   - El docente puede hacer clic en **Descargar Reporte PDF** para obtener el documento oficial de asistencias.
