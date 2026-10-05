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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO_BD_ALUMNOS = os.path.join(BASE_DIR, "bd_prueba - Hoja 1.csv")
ARCHIVO_BD_DOCENTES = os.path.join(BASE_DIR, "registros-docentes.csv")
ARCHIVO_BD_DIRECTORES = os.path.join(BASE_DIR, "registros-directores.csv")
ARCHIVO_REGISTRO = os.path.join(BASE_DIR, "regristos - Hoja 1.csv")

@app.post("/api/login")
async def iniciar_sesion(datos: LoginData):
    identificador_clean = datos.identificador.strip()
    password_clean = datos.password.strip()
    rol_clean = datos.rol.strip()

    ya_registrado = False
    nombre_usuario = ""

    if os.path.exists(ARCHIVO_REGISTRO):
        with open(ARCHIVO_REGISTRO, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
                if row[0].upper().strip() in ["NOMBRE", "COREO/MATRICULA", "MATRICULA", "CORREO"]:
                    continue

                if len(row) >= 3 and row[1].strip().lower() == identificador_clean.lower():
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

                elif len(row) >= 2 and row[0].strip().lower() == identificador_clean.lower():
                    ya_registrado = True
                    nombre_usuario = row[0].strip()
                    password_guardada = row[1].strip()

                    if password_guardada != password_clean:
                        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
                    break

    if ya_registrado:
        return {"mensaje": "Inicio de sesión exitoso", "alumno": nombre_usuario, "nombre": nombre_usuario, "rol": rol_clean}

    persona_encontrada = None

    if rol_clean == "Alumno":
        if not os.path.exists(ARCHIVO_BD_ALUMNOS):
            raise HTTPException(status_code=500, detail="El archivo bd_prueba - Hoja 1.csv no existe en el servidor.")

        with open(ARCHIVO_BD_ALUMNOS, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row:
                    continue
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

    file_exists = os.path.exists(ARCHIVO_REGISTRO) and os.path.getsize(ARCHIVO_REGISTRO) > 0
    with open(ARCHIVO_REGISTRO, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(["NOMBRE", "IDENTIFICADOR", "CONTRASEÑA", "ROL"])

        writer.writerow([persona_encontrada["nombre"], persona_encontrada["identificador"], password_clean, rol_clean])

    return {
        "mensaje": "Registro e inicio de sesión exitosos por primera vez",
        "alumno": persona_encontrada["nombre"],
        "nombre": persona_encontrada["nombre"],
        "rol": rol_clean
    }

from app.routers import asistencia
app.include_router(asistencia.router)

ARCHIVO_ASIGNACIONES_DOCENTES = os.path.join(BASE_DIR, "asignaciones_docentes.csv")

@app.get("/api/alumnos/consulta/{identificador}")
async def consultar_alumno(identificador: str):
    identificador_clean = identificador.strip().lower()

    if not os.path.exists(ARCHIVO_BD_ALUMNOS):
        raise HTTPException(status_code=500, detail="El archivo bd_prueba - Hoja 1.csv no existe.")

    with open(ARCHIVO_BD_ALUMNOS, mode='r', encoding='utf-8-sig') as file:
        reader = csv.reader(file)
        for row in reader:
            if not row:
                continue
            if row[0].upper().strip() in ["MATRICULA", "MATRÍCULA"]:
                continue
            
            if row[0].strip().lower() == identificador_clean:
                return {
                    "ok": True,
                    "alumno": {
                        "matricula": row[0].strip(),
                        "telefono": row[1].strip() if len(row) > 1 else "",
                        "nombre": row[2].strip() if len(row) > 2 else "Alumno"
                    }
                }

    raise HTTPException(status_code=404, detail="El alumno no fue encontrado en la base de datos.")


@app.get("/api/docentes")
async def listar_docentes():
    docentes_map = {}

    if os.path.exists(ARCHIVO_BD_DOCENTES):
        with open(ARCHIVO_BD_DOCENTES, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row or row[0].upper().strip() in ["CORREO", "EMAIL"]:
                    continue
                correo = row[0].strip()
                telefono = row[1].strip() if len(row) > 1 else ""
                nombre = row[2].strip() if len(row) > 2 else "Docente"
                docentes_map[correo.lower()] = {
                    "correo": correo,
                    "telefono": telefono,
                    "nombre": nombre,
                    "grupos": []
                }

    if os.path.exists(ARCHIVO_ASIGNACIONES_DOCENTES):
        with open(ARCHIVO_ASIGNACIONES_DOCENTES, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row or row[0].upper().strip() in ["DOCENTE_CORREO", "CORREO"]:
                    continue
                correo = row[0].strip().lower()
                nombre = row[1].strip() if len(row) > 1 else ""
                grupos = [g.strip() for g in row[2:] if g.strip()] if len(row) > 2 else []

                if correo in docentes_map:
                    docentes_map[correo]["grupos"] = grupos
                else:
                    docentes_map[correo] = {
                        "correo": row[0].strip(),
                        "telefono": "",
                        "nombre": nombre,
                        "grupos": grupos
                    }

    return {"docentes": list(docentes_map.values())}


@app.get("/api/grupos")
async def listar_grupos():
    return {"grupos": ["3A IA", "3B IA", "1A IA", "2A IA", "4A IA", "5A IA"]}


class AsignarGruposData(BaseModel):
    identificador: str
    nombre: str
    grupos: list[str]

@app.post("/api/docentes/asignar-grupos")
async def asignar_grupos_docente(datos: AsignarGruposData):
    asig_existentes = {}

    if os.path.exists(ARCHIVO_ASIGNACIONES_DOCENTES):
        with open(ARCHIVO_ASIGNACIONES_DOCENTES, mode='r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            for row in reader:
                if not row or row[0].upper().strip() in ["DOCENTE_CORREO", "CORREO"]:
                    continue
                correo = row[0].strip().lower()
                nombre = row[1].strip() if len(row) > 1 else ""
                grupos = [g.strip() for g in row[2:] if g.strip()] if len(row) > 2 else []
                asig_existentes[correo] = {"correo": row[0].strip(), "nombre": nombre, "grupos": grupos}

    correo_key = datos.identificador.strip().lower()
    asig_existentes[correo_key] = {
        "correo": datos.identificador.strip(),
        "nombre": datos.nombre.strip(),
        "grupos": datos.grupos
    }

    with open(ARCHIVO_ASIGNACIONES_DOCENTES, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["DOCENTE_CORREO", "DOCENTE_NOMBRE", "GRUPOS"])
        for key, item in asig_existentes.items():
            writer.writerow([item["correo"], item["nombre"]] + item["grupos"])

    return {"mensaje": "Asignación de grupos guardada correctamente", "docente": datos.nombre, "grupos": datos.grupos}

if __name__ == "__main__":
    import uvicorn
    import json
    
    port = 8000
    config_file = os.path.join(os.path.dirname(BASE_DIR), "network_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                port = int(cfg.get("BACKEND_PORT", 8000))
        except Exception:
            pass

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
