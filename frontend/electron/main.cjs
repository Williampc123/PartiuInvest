// Processo Principal do Electron para Partiu Invest
const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Registrar esquema de protocolo 'app' seguro antes de app.whenReady
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

// Garante apenas uma instância do aplicativo em execução
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getDistPath() {
  // Em build empacotado ou em desenvolvimento
  const appPath = app.getAppPath();
  const directDist = path.join(appPath, 'dist');
  if (fs.existsSync(directDist)) {
    return directDist;
  }
  // Fallback para pasta irmã se executado de dentro de electron/
  const siblingDist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(siblingDist)) {
    return siblingDist;
  }
  return directDist;
}

function registerAppProtocol() {
  const distDir = getDistPath();

  protocol.handle('app', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
      }

      // Se caminho vazio, carrega index.html
      if (!pathname) {
        pathname = 'index.html';
      }

      let filePath = path.join(distDir, pathname);

      // SPA Fallback: Se o arquivo requisitado não existir ou for diretório, serve index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      return net.fetch(url.pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('[Protocol Error]', err);
      const fallbackIndex = path.join(distDir, 'index.html');
      return net.fetch(url.pathToFileURL(fallbackIndex).toString());
    }
  });
}

function createWindow() {
  const distDir = getDistPath();
  const iconCandidates = [
    path.join(__dirname, 'icon.png'),
    path.join(distDir, 'icone-partiu-invest.png'),
  ];
  const iconPath = iconCandidates.find((p) => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'Partiu Invest',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Abre links externos (target="_blank") no navegador padrão do sistema operacional
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  // Carrega aplicação através do protocolo app://
  mainWindow.loadURL('app://partiu-invest/index.html').catch((err) => {
    console.error('Falha ao carregar app://, tentando loadFile direto:', err);
    mainWindow.loadFile(path.join(distDir, 'index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerAppProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
