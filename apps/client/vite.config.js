import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://jan-systems-cafe.onrender.com')
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Jan Systems Hospitality',
          short_name: 'Jan Systems',
          description: 'Smarter Hospitality Platform',
          theme_color: '#1C1209',
          background_color: '#FAF7F2',
          icons: [
            {
              src: 'https://via.placeholder.com/192x192.png?text=JS',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://via.placeholder.com/512x512.png?text=JS',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss('./tailwind.config.cjs'),
          autoprefixer(),
        ],
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': 'http://192.168.0.178:3002',
        '/socket.io': {
          target: 'ws://192.168.0.178:3002',
          ws: true
        }
      }
    }
  };
});
