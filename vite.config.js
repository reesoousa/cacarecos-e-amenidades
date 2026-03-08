import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Para GitHub Pages: substitua "nome-do-repositorio" pelo nome real do seu repositório.
  // Se publicar no domínio root (user.github.io), use base: '/'.
  base: '/cacarecos-e-amenidades/'
})
