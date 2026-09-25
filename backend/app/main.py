from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginData(BaseModel):
    rol: str
    identificador: str
    password: str

ARCHIVO_BD = "bd_prueba - Hoja 1.csv"
ARCHIVO_REGISTRO = "regristos - Hoja 1.csv"

@app.post("/api/login")
async def iniciar_sesion(datos: LoginData):
    if datos.rol == "Alumno":
        ya_registrado = False
        nombre_alumno = ""
        
        # 1. Revisar si ya está guardado en 'regristos' (Inicio de sesión normal)
        if os.path.exists(ARCHIVO_REGISTRO):
            with open(ARCHIVO_REGISTRO, mode='r', encoding='utf-8') as file:
                reader = csv.reader(file)
                for row in reader:
                    # Asumimos que regristos tiene: Columna 0 (Nombre), Columna 1 (Matrícula), Columna 2 (Contraseña)
                    if len(row) >= 3 and row[1] == datos.identificador:
                        ya_registrado = True
                        nombre_alumno = row[0]
                        password_guardada = row[2]
                        
                        if password_guardada != datos.password:
                            raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
                        break
        
        # Si ya estaba registrado y la contraseña es correcta, lo dejamos pasar
        if ya_registrado:
            return {"mensaje": "Inicio de sesión exitoso", "alumno": nombre_alumno}
        
        # 2. Si es la PRIMERA VEZ, buscamos en la base de datos principal 'bd_prueba'
        alumno_encontrado = None
        if not os.path.exists(ARCHIVO_BD):
            raise HTTPException(status_code=500, detail="El archivo de bd_prueba no existe.")
            
        with open(ARCHIVO_BD, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                # bd_prueba tiene: Columna A (Matrícula), Columna B (Teléfono), Columna C (Nombre)
                if len(row) >= 3 and row[0] == datos.identificador:
                    alumno_encontrado = {
                        "matricula": row[0],
                        "telefono": row[1],
                        "nombre": row[2]
                    }
                    break
                    
        # 3. Si NO existe en bd_prueba, mandamos el error exacto que pediste
        if not alumno_encontrado:
            raise HTTPException(status_code=404, detail="Persona no encontrada en la base de datos.")
            
        # 4. Si SÍ existe, lo guardamos por primera vez en 'regristos' incluyendo la CONTRASEÑA
        with open(ARCHIVO_REGISTRO, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            # Guardamos: Nombre, Matrícula, Contraseña
            writer.writerow([alumno_encontrado["nombre"], alumno_encontrado["matricula"], datos.password])
            
        return {"mensaje": "Registro exitoso", "alumno": alumno_encontrado["nombre"]}

    else:
        # Lógica futura para Docentes y Directores
        return {"mensaje": f"Inicio de sesión exitoso como {datos.rol}"}