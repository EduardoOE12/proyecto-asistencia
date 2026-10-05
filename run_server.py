import os
import sys
import json
import socket
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "network_config.json")

def load_config():
    default_config = {
        "SERVER_IP": "auto",
        "BACKEND_PORT": 8000,
        "FRONTEND_PORT": 5173
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                default_config.update(data)
        except Exception as e:
            print(f"[!] Error leyendo {CONFIG_FILE}: {e}")
    return default_config

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    config = load_config()
    backend_port = int(config.get("BACKEND_PORT", 8000))
    frontend_port = int(config.get("FRONTEND_PORT", 5173))
    
    local_ip = get_local_ip()
    configured_ip = config.get("SERVER_IP", "auto")
    effective_ip = local_ip if configured_ip in ["auto", "", None] else configured_ip

    print("=" * 64)
    print("       SISTEMA DE ASISTENCIA - SERVIDOR DE RED LOCAL")
    print("=" * 64)
    print(f" Configuración leída de : network_config.json")
    print(f" IP Local en esta red  : {effective_ip}")
    print(f" Puerto Backend (API)   : {backend_port}")
    print(f" Puerto Frontend (App)  : {frontend_port}")
    print("-" * 64)
    print(f" Acceso API Backend     : http://{effective_ip}:{backend_port}")
    print(f" Acceso Frontend        : https://{effective_ip}:{frontend_port}")
    print("=" * 64)
    print("Iniciando servicio backend...")

    backend_dir = os.path.join(BASE_DIR, "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    os.chdir(backend_dir)
    uvicorn.run("app.main:app", host="0.0.0.0", port=backend_port, reload=True)
