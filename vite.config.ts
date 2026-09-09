import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Importar .glsl / .vert / .frag como strings, con soporte de #include
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs'],
      warnDuplicatedImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    host: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    // three.js pesa ~680kB min (~175kB gzip) y va en su propio chunk cacheable:
    // el warning de 500kB es esperado, no un problema.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      input: {
        // App principal (React + R3F)
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Sitio anterior (vanilla) preservado
        legacy: fileURLToPath(new URL('./legacy/index.html', import.meta.url)),
      },
      output: {
        // Separar three / R3F en su propio chunk: mejora el cacheo entre deploys
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          postfx: ['postprocessing', '@react-three/postprocessing'],
        },
      },
    },
  },
  // Modelos / HDRIs grandes: que Vite no intente pre-bundlearlos
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.exr'],
});
