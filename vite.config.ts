import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dev and preview servers bind to localhost by default.
// Use `npm run dev -- --host` to expose them on your network deliberately.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    // Engine tests run in Node; UI tests opt into jsdom with a file-level comment.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
