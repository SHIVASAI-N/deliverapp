const esbuild = require('esbuild');
const path = require('path');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(__dirname, 'dist/main.js'),
    external: [],
    sourcemap: true,
  });
  console.log('[Build] Backend compiled successfully into dist/main.js');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
