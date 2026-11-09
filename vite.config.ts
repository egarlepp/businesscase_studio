import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev and preview servers bind to localhost by default.
// Use `npm run dev -- --host` to expose them on your network deliberately.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
