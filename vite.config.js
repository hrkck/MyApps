import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import basicSsl from '@vitejs/plugin-basic-ssl'

const moduleExclude = match => {
  const m = id => id.indexOf(match) > -1
  return {
    name: `exclude-${match}`,
    resolveId(id) {
      if (m(id)) return id
    },
    load(id) {
      if (m(id)) return `export default {}`
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'gun',
      'gun/gun',
      'gun/sea',
      'gun/sea.js',
      'gun/lib/then',
      'gun/lib/webrtc',
      'gun/lib/radix',
      'gun/lib/radisk',
      'gun/lib/store',
      'gun/lib/rindexed',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor code (e.g., Svelte, GunDB, EditorJS) into a separate chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    moduleExclude('text-encoding'),
    svelte(),
    basicSsl(),
  ],
})
