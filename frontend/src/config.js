const netConfig = (typeof __NETWORK_CONFIG__ !== 'undefined') ? __NETWORK_CONFIG__ : {
  SERVER_IP: 'auto',
  BACKEND_PORT: 8000,
  FRONTEND_PORT: 5173
};

const host = (netConfig.SERVER_IP && netConfig.SERVER_IP !== 'auto')
  ? netConfig.SERVER_IP
  : (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

const port = netConfig.BACKEND_PORT || 8000;

export const API_BASE_URL = `http://${host}:${port}`;
export const NETWORK_CONFIG = netConfig;
