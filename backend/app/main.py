# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginData(BaseModel):
    rol: str
    identificador: str
    password: str

# Ruta base para ubicar los archivos CSV dentro de backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO_BD_ALUMNOS = os.path.join(BASE_DIR, "bd_prueba - Hoja 1.csv")
ARCHIVO_BD_DOCENTES = os.path.join(BASE_DIR, "registros-docentes.csv")
ARCHIVO_BD_DIRECTORES = os.path.join(BASE_DIR, "registros-directores.csv")

# Archivo central donde SE GUARDAN TODOS LOS REGISTROS (Alumnos, Docentes y Directores)
ARCHIVO_REGISTRO = os.path.join(BASE_DIR, "regristos - Hoja 1.csv")

@app.post("/api/login")
async def iniciar_sesion(datos: LoginData):
    identificador_clean = datos.identificador.strip()
    password_clean = datos.password.strip()
    rol_clean = datos.rol.strip()

    ya_registrado = False
    nombre_usuario = ""

    # 1. Revisar si ya está guardado en 'regristos - Hoja 1.csv' (Inicio de sesión subsiguiente)
    if os.path.exists(ARCHIVO_REGISTRO):
        with open(ARCHIVO_REGISTRO, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
                # Ignorar encabezados conocidos
                if row[0].upper().strip() in ["NOMBRE", "COREO/MATRICULA", "MATRICULA", "CORREO"]:
                    continue

                # Formato preferido: [Nombre, Identificador (Matrícula/Correo), Contraseña, Rol]
                if len(row) >= 3 and row[1].strip().lower() == identificador_clean.lower():
                    # Verificar que coincida estrictamente el ROL registrado
                    rol_registrado = row[3].strip() if len(row) >= 4 else None
                    if rol_registrado and rol_registrado.lower() != rol_clean.lower():
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Este usuario está registrado como {rol_registrado}. Por favor selecciona ese rol para iniciar sesión."
                        )

                    ya_registrado = True
                    nombre_usuario = row[0].strip()
                    password_guardada = row[2].strip()

                    if password_guardada != password_clean:
                        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
                    break

                # Formato legacy de 2 columnas: [Identificador, Contraseña]
                elif len(row) >= 2 and row[0].strip().lower() == identificador_clean.lower():
                    ya_registrado = True
                    nombre_usuario = row[0].strip()
                    password_guardada = row[1].strip()

                    if password_guardada != password_clean:
                        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
                    break

    # Si ya estaba registrado en 'regristos - Hoja 1.csv' y la contraseña es correcta, dar acceso
    if ya_registrado:
        return {"mensaje": "Inicio de sesión exitoso", "alumno": nombre_usuario, "nombre": nombre_usuario, "rol": rol_clean}

    # 2. Si es la PRIMERA VEZ, validamos estrictamente en la base de datos de SU ROL
    persona_encontrada = None

    if rol_clean == "Alumno":
        if not os.path.exists(ARCHIVO_BD_ALUMNOS):
            raise HTTPException(status_code=500, detail="El archivo bd_prueba - Hoja 1.csv no existe en el servidor.")

        with open(ARCHIVO_BD_ALUMNOS, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
                # bd_prueba: Columna 0 (Matrícula), Columna 1 (Teléfono), Columna 2 (Nombre)
                if row[0].strip().lower() == identificador_clean.lower():
                    persona_encontrada = {
                        "identificador": row[0].strip(),
                        "telefono": row[1].strip() if len(row) > 1 else "",
                        "nombre": row[2].strip() if len(row) > 2 else "Alumno"
                    }
                    break

        if not persona_encontrada:
            raise HTTPException(status_code=404, detail="La matrícula no existe en la base de datos de Alumnos.")

    elif rol_clean == "Docente":
        if not os.path.exists(ARCHIVO_BD_DOCENTES):
            raise HTTPException(status_code=500, detail="El archivo registros-docentes.csv no existe en el servidor.")

        with open(ARCHIVO_BD_DOCENTES, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
                # registros-docentes: Columna 0 (Correo), Columna 1 (Teléfono), Columna 2 (Nombre)
                if row[0].strip().lower() == identificador_clean.lower():
                    persona_encontrada = {
                        "identificador": row[0].strip(),
                        "telefono": row[1].strip() if len(row) > 1 else "",
                        "nombre": row[2].strip() if len(row) > 2 else "Docente"
                    }
                    break

        if not persona_encontrada:
            raise HTTPException(status_code=404, detail="El correo no existe en la base de datos de Docentes.")

    elif rol_clean == "Director":
        if not os.path.exists(ARCHIVO_BD_DIRECTORES):
            raise HTTPException(status_code=500, detail="El archivo registros-directores.csv no existe en el servidor.")

        with open(ARCHIVO_BD_DIRECTORES, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
                # registros-directores: Columna 0 (Correo), Columna 1 (Teléfono), Columna 2 (Nombre)
                if row[0].strip().lower() == identificador_clean.lower():
                    persona_encontrada = {
                        "identificador": row[0].strip(),
                        "telefono": row[1].strip() if len(row) > 1 else "",
                        "nombre": row[2].strip() if len(row) > 2 else "Director"
                    }
                    break

        if not persona_encontrada:
            raise HTTPException(status_code=404, detail="El correo no existe en la base de datos de Directivos.")

    else:
        raise HTTPException(status_code=400, detail=f"Rol '{rol_clean}' no es válido.")

    # 3. Si SÍ existe en su base de datos oficial, lo guardamos por PRIMERA VEZ en 'regristos - Hoja 1.csv'
    file_exists = os.path.exists(ARCHIVO_REGISTRO) and os.path.getsize(ARCHIVO_REGISTRO) > 0
    with open(ARCHIVO_REGISTRO, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(["NOMBRE", "IDENTIFICADOR", "CONTRASEÑA", "ROL"])

        # Guardamos a TODOS (Alumnos, Docentes, Directores) en 'regristos - Hoja 1.csv'
        writer.writerow([persona_encontrada["nombre"], persona_encontrada["identificador"], password_clean, rol_clean])

    return {
        "mensaje": "Registro e inicio de sesión exitosos por primera vez",
        "alumno": persona_encontrada["nombre"],
        "nombre": persona_encontrada["nombre"],
        "rol": rol_clean
    }

# backend/app/main.py
from fastapi import FastAPI
from app.routers import asistencia # Importas tu nuevo módulo

app = FastAPI()

# Incluyes el router
app.include_router(asistencia.router)
