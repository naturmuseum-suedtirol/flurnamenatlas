import { defineConfig, type Plugin } from 'vite';

const pruneClusterEsm: Plugin = {
  name: 'prunecluster-esm',
  transform(code, id) {
    if (id.includes('prunecluster/dist/PruneCluster.js'))
      return `import L from 'leaflet';\n${code}\nexport { PruneCluster, PruneClusterForLeaflet };`;
  },
};

export default defineConfig({
  base: './',
  plugins: [pruneClusterEsm],
  optimizeDeps: { exclude: ['prunecluster'] },
});
