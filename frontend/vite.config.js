import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const configPath = path.resolve(import.meta.dirname, '../network_config.json')
let networkConfig = {
  SERVER_IP: 'auto',
  BACKEND_PORT: 8000,
  FRONTEND_PORT: 5173
}

if (fs.existsSync(configPath)) {
  try {
    networkConfig = { ...networkConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
  } catch (e) {
    console.warn('No se pudo leer network_config.json, usando valores por defecto.')
  }
}

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    {
      name: 'watch-network-config',
      configureServer(server) {
        server.watcher.add(configPath)
      }
    }
  ],
  server: {
    host: true,
    port: Number(networkConfig.FRONTEND_PORT) || 5173
  },
  define: {
    __NETWORK_CONFIG__: JSON.stringify(networkConfig)
  }
})
