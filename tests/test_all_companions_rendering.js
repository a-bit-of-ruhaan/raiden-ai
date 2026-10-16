const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    if (level >= 2) console.error('[CONSOLE ERROR]', message, `(${sourceId}:${line})`);
  });

  win.webContents.on('did-finish-load', async () => {
    const companions = ['void', 'pixel', 'nova', 'cipher'];
    const results = {};

    for (const compId of companions) {
      await win.webContents.executeJavaScript(`
        window.mascot.switchCompanion('${compId}', false);
      `);
      // Wait for image load and render cycles
      await new Promise(r => setTimeout(r, 600));

      const stats = await win.webContents.executeJavaScript(`
        (() => {
          const canvas = document.getElementById('mascotCanvas');
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let nonZero = 0;
          for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] > 0) nonZero++;
          }
          return {
            id: window.mascot.activeCompanionId,
            nonZeroAlphaPixels: nonZero,
            heroSrc: window.mascot.poseImages?.hero?.src,
            heroNaturalWidth: window.mascot.poseImages?.hero?.naturalWidth
          };
        })()
      `);
      results[compId] = stats;
    }

    console.log('ALL COMPANIONS TEST RESULTS:', JSON.stringify(results, null, 2));
    app.quit();
  });

  win.loadFile(path.join(__dirname, '..', 'mascot.html'));
});
