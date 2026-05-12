import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cliente: resolve(__dirname, 'cliente.html'),
        gerente: resolve(__dirname, 'gerente.html'),
        login: resolve(__dirname, 'login.html'),
      }
    }
  }
})
