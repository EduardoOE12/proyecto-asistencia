import os
import json
import time
import uuid
import threading
from typing import Optional, Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SESSIONS_FILE = os.path.join(BASE_DIR, "sesiones_activas.json")

_lock = threading.Lock()

class SessionManager:
    """
    Gestor de sesión única activa.
    Garantiza que un usuario solo pueda tener una sesión válida a la vez.
    Si se inicia sesión desde un nuevo dispositivo o navegador,
    cualquier sesión previa queda inmediatamente invalidada.
    """
    def __init__(self, persistence_file: str = SESSIONS_FILE):
        self.file_path = persistence_file
        # Diccionario de sesiones activas: key -> dict con datos de sesión
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        # Diccionario de tokens invalidados: token -> dict con motivo y fecha
        self.invalidated_sessions: Dict[str, Dict[str, Any]] = {}
        self._load_from_disk()

    def _make_key(self, identificador: str, rol: str = "") -> str:
        id_clean = (identificador or "").strip().lower()
        rol_clean = (rol or "").strip().lower()
        if rol_clean:
            return f"{rol_clean}:{id_clean}"
        return id_clean

    def _load_from_disk(self):
        with _lock:
            if os.path.exists(self.file_path):
                try:
                    with open(self.file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self.active_sessions = data.get("active_sessions", {})
                        self.invalidated_sessions = data.get("invalidated_sessions", {})
                except Exception as e:
                    print(f"[SessionManager] Error al cargar sesiones de disco: {e}")
                    self.active_sessions = {}
                    self.invalidated_sessions = {}

    def _save_to_disk(self):
        try:
            now = time.time()
            # Purgar tokens invalidados con más de 24 horas para no saturar memoria/disco
            self.invalidated_sessions = {
                t: info for t, info in self.invalidated_sessions.items()
                if now - info.get("invalidated_at", 0) < 86400
            }
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({
                    "active_sessions": self.active_sessions,
                    "invalidated_sessions": self.invalidated_sessions
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[SessionManager] Error al guardar sesiones a disco: {e}")

    def create_session(
        self,
        identificador: str,
        rol: str,
        nombre: str = "",
        ip: str = "",
        user_agent: str = ""
    ) -> str:
        with _lock:
            key = self._make_key(identificador, rol)
            now = time.time()

            # 1. Si ya existe una sesión activa para este usuario, la invalidamos
            if key in self.active_sessions:
                old_session = self.active_sessions[key]
                old_token = old_session.get("session_token")
                if old_token:
                    self.invalidated_sessions[old_token] = {
                        "identificador": identificador.strip(),
                        "rol": rol.strip(),
                        "invalidated_at": now,
                        "reason": "NUEVO_DISPOSITIVO",
                        "new_login_ip": ip
                    }

            # También verificar si coincide por identificador (por si se omitió rol)
            for k, s in list(self.active_sessions.items()):
                if s.get("identificador", "").strip().lower() == identificador.strip().lower() and k != key:
                    old_token = s.get("session_token")
                    if old_token:
                        self.invalidated_sessions[old_token] = {
                            "identificador": identificador.strip(),
                            "rol": s.get("rol", rol).strip(),
                            "invalidated_at": now,
                            "reason": "NUEVO_DISPOSITIVO",
                            "new_login_ip": ip
                        }
                    del self.active_sessions[k]

            # 2. Generar un nuevo token único para esta nueva sesión
            new_token = f"sess_{uuid.uuid4().hex}"
            self.active_sessions[key] = {
                "session_token": new_token,
                "identificador": identificador.strip(),
                "rol": rol.strip(),
                "nombre": nombre.strip(),
                "created_at": now,
                "last_active": now,
                "ip": ip,
                "user_agent": user_agent
            }
            self._save_to_disk()
            return new_token

    def validate_session(
        self,
        token: str,
        identificador: Optional[str] = None,
        rol: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Valida si el token proporcionado corresponde a la sesión actualmente activa del usuario.
        Retorna (es_valida, codigo_motivo, info_sesion)
        Códigos de motivo posibles:
          - 'VALID': Sesión vigente y activa.
          - 'INVALIDATED_NEW_DEVICE': Invalidada porque se inició sesión en otro dispositivo.
          - 'NOT_FOUND': No se encontró la sesión (expirada o inexistente).
          - 'MISMATCH': Token pertenece a otro usuario.
          - 'TOKEN_MISSING': No se envió token.
        """
        if not token:
            return False, "TOKEN_MISSING", None

        token_clean = token.strip()
        with _lock:
            # 1. Verificar si este token específico fue explicitamente marcado como invalidado
            if token_clean in self.invalidated_sessions:
                inv_info = self.invalidated_sessions[token_clean]
                return False, "INVALIDATED_NEW_DEVICE", inv_info

            # 2. Buscar si el token está activo
            found_session = None

            if identificador and rol:
                key = self._make_key(identificador, rol)
                if key in self.active_sessions and self.active_sessions[key].get("session_token") == token_clean:
                    found_session = self.active_sessions[key]

            if not found_session:
                # Búsqueda por token en todas las sesiones activas
                for k, s in self.active_sessions.items():
                    if s.get("session_token") == token_clean:
                        found_session = s
                        break

            # 3. Si no se encontró el token activo
            if not found_session:
                # Si el usuario tiene un identificador, checamos si ya tiene OTRA sesión activa
                if identificador:
                    for k, s in self.active_sessions.items():
                        if s.get("identificador", "").strip().lower() == identificador.strip().lower():
                            # El usuario sí está registrado con otra sesión activa: el token viejo fue desplazado
                            return False, "INVALIDATED_NEW_DEVICE", s
                return False, "NOT_FOUND", None

            # 4. Validar consistencia de identificador si fue provisto
            if identificador and found_session.get("identificador", "").strip().lower() != identificador.strip().lower():
                return False, "MISMATCH", None

            # Sesión totalmente válida: actualizar última actividad
            found_session["last_active"] = time.time()
            return True, "VALID", found_session

    def terminate_session(
        self,
        token: Optional[str] = None,
        identificador: Optional[str] = None,
        rol: Optional[str] = None
    ) -> bool:
        """
        Cierra voluntariamente la sesión (logout).
        """
        with _lock:
            key = self._make_key(identificador, rol) if (identificador and rol) else None
            removed = False

            if key and key in self.active_sessions:
                if not token or self.active_sessions[key].get("session_token") == token:
                    del self.active_sessions[key]
                    removed = True

            if not removed and token:
                for k, s in list(self.active_sessions.items()):
                    if s.get("session_token") == token:
                        del self.active_sessions[k]
                        removed = True
                        break

            if removed:
                self._save_to_disk()
            return removed

    def get_session_info(self, identificador: str, rol: str = "") -> Optional[Dict[str, Any]]:
        with _lock:
            key = self._make_key(identificador, rol)
            if key in self.active_sessions:
                return dict(self.active_sessions[key])
            for k, s in self.active_sessions.items():
                if s.get("identificador", "").strip().lower() == identificador.strip().lower():
                    return dict(s)
            return None


session_manager = SessionManager()
