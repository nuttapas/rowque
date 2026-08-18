import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// Polyfill Web Crypto for environments where it's not available (Node builds)
try {
  // Node 16.9+ exposes webcrypto under the 'crypto' module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto');
  const webcrypto = nodeCrypto.webcrypto;
  if (webcrypto && !(globalThis as any).crypto) {
    (globalThis as any).crypto = {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: webcrypto.subtle
    };
  }
} catch (e) {
  // ignore if not available
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: true
  }
})