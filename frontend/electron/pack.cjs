const packager = require('electron-packager');
const path = require('path');
const fs = require('fs');

async function pack() {
  console.log('Iniciando empacotamento do executável Windows...');
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');

  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('Pasta dist/ não encontrada ou incompleta. Execute npm run build antes.');
  }

  const appPaths = await packager({
    dir: rootDir,
    name: 'Partiu Invest',
    platform: 'win32',
    arch: 'x64',
    out: path.join(rootDir, 'release'),
    overwrite: true,
    icon: path.join(__dirname, 'icon.ico'),
    asar: true,
    prune: true,
    appVersion: '1.0.0',
    appCopyright: 'Copyright © Partiu Invest',
    win32metadata: {
      CompanyName: 'Partiu Invest',
      FileDescription: 'Partiu Invest Desktop',
      OriginalFilename: 'Partiu Invest.exe',
      ProductName: 'Partiu Invest',
      InternalName: 'Partiu Invest',
    },
    ignore: [
      /^\/src($|\/)/,
      /^\/android($|\/)/,
      /^\/public($|\/)/,
      /^\/\.git($|\/)/,
      /^\/\.env($|\/)/,
      /^\/capacitor\.config\.ts/,
      /^\/tsconfig/,
      /^\/vite\.config\.ts/,
      /^\/postcss\.config\.js/,
      /^\/tailwind\.config\.ts/,
      /^\/_test_auto_/,
    ],
  });

  console.log('✅ Executável gerado com sucesso em:');
  appPaths.forEach((p) => console.log(' -> ' + p));
}

pack().catch((err) => {
  console.error('❌ Falha ao empacotar:', err);
  process.exit(1);
});
