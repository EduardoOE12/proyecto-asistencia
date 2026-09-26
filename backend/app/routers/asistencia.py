from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
from datetime import datetime

router = APIRouter(prefix="/api/asistencia", tags=["asistencia"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARCHIVO_BD_ALUMNOS = os.path.join(BASE_DIR, "bd_prueba - Hoja 1.csv")
ARCHIVO_ASISTENCIA = os.path.join(BASE_DIR, "registro_asistencias.csv")

class RegistroAsistenciaItem(BaseModel):
    id: int
    nombre: str
    estado: str # "PUNTUAL", "ATRASADO", "FALTA"
    asistio: bool
    fecha: str

class GuardarAsistenciaRequest(BaseModel):
    docente: Optional[str] = "Docente"
    grupo: Optional[str] = "3A IA"
    materia: Optional[str] = "MATEMATICAS"
    registros: List[RegistroAsistenciaItem]

@router.get("/alumnos")
async def obtener_alumnos():
    """Retorna la lista de alumnos registrados en la base de datos para pasar lista"""
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
                    # Ignorar encabezados
                    if row[0].upper().strip() in ["MATRICULA", "MATRICULA "]:
                        continue
                    if len(row) >= 3:
                        nombre_alumno = row[2].strip()
                        alumnos.append({
                            "id": index,
                            "nombre": nombre_alumno,
                            "estado": "PUNTUAL",
                            "asistio": True,
                            "fecha": fecha_hoy
                        })
                        index += 1
        except Exception as e:
            print(f"Error al leer alumnos: {e}")

    # Si por alguna razón la lista quedó vacía, devolver datos predeterminados
    if not alumnos:
        alumnos = [
            { "id": 1, "nombre": "FATIMA", "estado": "ATRASADO", "asistio": True, "fecha": fecha_hoy },
            { "id": 2, "nombre": "CLAUDIA", "estado": "PUNTUAL", "asistio": True, "fecha": fecha_hoy },
            { "id": 3, "nombre": "REINA", "estado": "PUNTUAL", "asistio": True, "fecha": fecha_hoy }
        ]

    return {"alumnos": alumnos, "grupo": "3A IA", "materia": "MATEMATICAS", "horario": "7:00 am - 9:00am"}

@router.post("/guardar")
async def guardar_asistencia(datos: GuardarAsistenciaRequest):
    """Guarda la lista de asistencia en el archivo CSV de registros de asistencia"""
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
