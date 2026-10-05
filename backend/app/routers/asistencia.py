from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
import time
import random
import string
from datetime import datetime

router = APIRouter(prefix="/api/asistencia", tags=["asistencia"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARCHIVO_BD_ALUMNOS = os.path.join(BASE_DIR, "bd_prueba - Hoja 1.csv")
ARCHIVO_ASISTENCIA = os.path.join(BASE_DIR, "registro_asistencias.csv")

SESIONES_QR = {}

class RegistroAsistenciaItem(BaseModel):
    id: int
    nombre: str
    estado: str
    asistio: bool
    fecha: str

class GuardarAsistenciaRequest(BaseModel):
    docente: Optional[str] = "Docente"
    grupo: Optional[str] = "3A IA"
    materia: Optional[str] = "MATEMATICAS"
    registros: List[RegistroAsistenciaItem]

class GenerarQRRequest(BaseModel):
    docente: Optional[str] = "Docente"
    grupo: str
    materia: str
    horaInicio: Optional[int] = 7
    horaFin: Optional[int] = 9

class EscaneoQRRequest(BaseModel):
    token: str
    identificador: Optional[str] = ""
    nombre: str

@router.get("/alumnos")
async def obtener_alumnos():
    alumnos = []
    fecha_hoy = datetime.now().strftime("%d-%b-%y").upper()

    if os.path.exists(ARCHIVO_BD_ALUMNOS):
        try:
            with open(ARCHIVO_BD_ALUMNOS, mode='r', encoding='utf-8-sig') as file:
                reader = csv.reader(file)
                index = 1
                for row in reader:
                    if not row:
                        continue
                    if row[0].upper().strip() in ["MATRICULA", "MATRICULA "]:
                        continue
                    if len(row) >= 3:
                        matricula_alumno = row[0].strip()
                        nombre_alumno = row[2].strip()
                        alumnos.append({
                            "id": index,
                            "matricula": matricula_alumno,
                            "nombre": nombre_alumno,
                            "estado": "FALTA",
                            "asistio": False,
                            "fecha": fecha_hoy
                        })
                        index += 1
        except Exception as e:
            print(f"Error: {e}")

    if not alumnos:
        alumnos = [
            { "id": 1, "matricula": "20313052870145", "nombre": "FATIMA", "estado": "FALTA", "asistio": False, "fecha": fecha_hoy },
            { "id": 2, "matricula": "20313052870146", "nombre": "CLAUDIA", "estado": "FALTA", "asistio": False, "fecha": fecha_hoy },
            { "id": 3, "matricula": "20313052870147", "nombre": "REINA", "estado": "FALTA", "asistio": False, "fecha": fecha_hoy }
        ]

    return {"alumnos": alumnos, "grupo": "3A IA", "materia": "MATEMATICAS", "horario": "7:00 am - 9:00am"}

@router.post("/guardar")
async def guardar_asistencia(datos: GuardarAsistenciaRequest):
    file_exists = os.path.exists(ARCHIVO_ASISTENCIA) and os.path.getsize(ARCHIVO_ASISTENCIA) > 0
    try:
        with open(ARCHIVO_ASISTENCIA, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(["DOCENTE", "GRUPO", "MATERIA", "ALUMNO", "ESTADO", "ASISTIO", "FECHA"])
            
            for reg in datos.registros:
                writer.writerow([
                    datos.docente,
                    datos.grupo,
                    datos.materia,
                    reg.nombre,
                    reg.estado,
                    "SI" if reg.asistio else "NO",
                    reg.fecha
                ])
        return {"mensaje": "Asistencia guardada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar asistencia: {str(e)}")

@router.post("/generar-qr")
async def generar_qr(datos: GenerarQRRequest):
    clave = f"{datos.materia.strip().upper()}_{datos.grupo.strip().upper()}"
    
    rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    token = f"QR-{rand_str}"
    
    ahora = time.time()
    duracion = 900
    
    SESIONES_QR[clave] = {
        "token": token,
        "docente": datos.docente,
        "grupo": datos.grupo,
        "materia": datos.materia,
        "creado_en": ahora,
        "duracion_segundos": duracion,
        "alumnos_registrados": []
    }
    
    return {
        "ok": True,
        "token": token,
        "duracion_segundos": duracion,
        "mensaje": "Código QR generado exitosamente"
    }

@router.get("/qr-activo")
async def consultar_qr_activo(materia: str, grupo: str):
    clave = f"{materia.strip().upper()}_{grupo.strip().upper()}"
    
    if clave not in SESIONES_QR:
        return {"activo": False}
        
    sesion = SESIONES_QR[clave]
    transcurrido = time.time() - sesion["creado_en"]
    restante = int(sesion["duracion_segundos"] - transcurrido)
    
    if restante <= 0:
        del SESIONES_QR[clave]
        return {"activo": False}
        
    return {
        "activo": True,
        "token": sesion["token"],
        "segundos_restantes": restante,
        "alumnos_registrados": sesion["alumnos_registrados"]
    }

@router.post("/escaneo-qr")
async def registrar_escaneo_qr(datos: EscaneoQRRequest):
    token_buscado = datos.token.strip().upper()
    identificador_limpio = datos.identificador.strip()
    ahora = time.time()
    
    sesion_encontrada = None
    clave_encontrada = None
    
    for clave, sesion in list(SESIONES_QR.items()):
        transcurrido = ahora - sesion["creado_en"]
        if transcurrido > sesion["duracion_segundos"]:
            del SESIONES_QR[clave]
            continue
            
        if sesion["token"].upper() == token_buscado:
            sesion_encontrada = sesion
            clave_encontrada = clave
            break
            
    if not sesion_encontrada:
        raise HTTPException(
            status_code=400, 
            detail="El código QR es inválido o el tiempo de 15 minutos ha expirado."
        )

    nombre_validado = datos.nombre.strip()
    matricula_validada = identificador_limpio

    if os.path.exists(ARCHIVO_BD_ALUMNOS) and identificador_limpio:
        try:
            with open(ARCHIVO_BD_ALUMNOS, mode='r', encoding='utf-8-sig') as file:
                reader = csv.reader(file)
                for row in reader:
                    if not row or row[0].upper().strip() in ["MATRICULA", "MATRICULA "]:
                        continue
                    if row[0].strip().lower() == identificador_limpio.lower():
                        matricula_validada = row[0].strip()
                        if len(row) >= 3:
                            nombre_validado = row[2].strip()
                        break
        except Exception as e:
            print(f"Error: {e}")
        
    mats_existentes = [
        (a["matricula"] if isinstance(a, dict) and "matricula" in a else a.get("identificador", "")).strip().lower()
        for a in sesion_encontrada["alumnos_registrados"]
    ]
    
    if matricula_validada and matricula_validada.lower() in mats_existentes:
        return {
            "ok": True,
            "mensaje": f"La matrícula {matricula_validada} ya tiene asistencia registrada para {sesion_encontrada['materia']}.",
            "materia": sesion_encontrada["materia"],
            "grupo": sesion_encontrada["grupo"]
        }
        
    hora_str = datetime.now().strftime("%H:%M:%S")
    fecha_hoy = datetime.now().strftime("%d-%b-%y").upper()
    
    nuevo_registro = {
        "nombre": nombre_validado,
        "matricula": matricula_validada,
        "identificador": matricula_validada,
        "hora": hora_str
    }
    sesion_encontrada["alumnos_registrados"].append(nuevo_registro)
    
    try:
        file_exists = os.path.exists(ARCHIVO_ASISTENCIA) and os.path.getsize(ARCHIVO_ASISTENCIA) > 0
        with open(ARCHIVO_ASISTENCIA, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(["DOCENTE", "GRUPO", "MATERIA", "ALUMNO", "ESTADO", "ASISTIO", "FECHA"])
            writer.writerow([
                sesion_encontrada["docente"],
                sesion_encontrada["grupo"],
                sesion_encontrada["materia"],
                nombre_validado,
                "PUNTUAL",
                "SI",
                fecha_hoy
            ])
    except Exception as e:
        print(f"Error: {e}")
        
    return {
        "ok": True,
        "mensaje": f"¡Asistencia registrada exitosamente para {sesion_encontrada['materia']}!",
        "materia": sesion_encontrada["materia"],
        "grupo": sesion_encontrada["grupo"]
    }
