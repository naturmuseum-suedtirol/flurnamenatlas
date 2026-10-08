import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pruneClusterEsm: Plugin = {
  name: 'prunecluster-esm',
  transform(code, id) {
    if (id.includes('prunecluster/dist/PruneCluster.js'))
      return `import L from 'leaflet';\n${code}\nexport { PruneCluster, PruneClusterForLeaflet };`;
  },
};

const DAY = 24 * 60 * 60;

export default defineConfig({
  base: './',
  plugins: [
    pruneClusterEsm,
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Flurnamen Südtirols',
        short_name: 'Flurnamen',
        description: "Flurnamen Südtirols – I nomi geografici dell'Alto Adige",
        lang: 'de',
        theme_color: '#aaa217',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,gz}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(geoservices\.buergernetz\.bz\.it|[abc]\.tile\.openstreetmap\.org)\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: { exclude: ['prunecluster'] },
});
