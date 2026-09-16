from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API Asistencia QR",
    version="1.0.0",
    description="Backend para registro y validación de asistencias en tiempo real"
)

# Permitir peticiones desde el frontend local y túneles
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Asistencia QR"}