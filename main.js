const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const POS_FILE = path.join(__dirname, 'mascot_position.json');

function loadSavedPosition() {
    try {
        if (fs.existsSync(POS_FILE)) {
            const raw = fs.readFileSync(POS_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[Electron] Could not load saved position:', e);
    }
    return null;
}

function savePosition(x, y) {
    try {
        fs.writeFileSync(POS_FILE, JSON.stringify({ x, y }), 'utf8');
    } catch (e) {}
}

function clampPosition(x, y, winWidth, winHeight) {
    const displays = screen.getAllDisplays();
    // Find display containing the point or nearest display
    let targetDisplay = screen.getPrimaryDisplay();
    for (const d of displays) {
        const { x: dx, y: dy, width: dw, height: dh } = d.bounds;
        if (x >= dx - winWidth && x <= dx + dw && y >= dy - winHeight && y <= dy + dh) {
            targetDisplay = d;
            break;
        }
    }

    const { x: ax, y: ay, width: aw, height: ah } = targetDisplay.workArea;
    const clampedX = Math.max(ax, Math.min(x, ax + aw - winWidth));
    const clampedY = Math.max(ay, Math.min(y, ay + ah - winHeight));
    return { x: clampedX, y: clampedY };
}

function createMascotWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const winWidth = 250;
    const winHeight = 330;

    let initX = width - 270;
    let initY = height - 350;

    const saved = loadSavedPosition();
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        const clamped = clampPosition(saved.x, saved.y, winWidth, winHeight);
        initX = clamped.x;
        initY = clamped.y;
    }

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: initX,
        y: initY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: false,
        focusable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('mascot.html');

    // Multi-workspace overlay
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Save position on close
    mainWindow.on('close', () => {
        if (mainWindow) {
            const [x, y] = mainWindow.getPosition();
            savePosition(x, y);
        }
    });
}

// Inter-process communication handler mapping for smooth drag positioning with multi-monitor clamping
ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
    if (!mainWindow) return;
    const [currentX, currentY] = mainWindow.getPosition();
    const [w, h] = mainWindow.getSize();
    const targetX = currentX + deltaX;
    const targetY = currentY + deltaY;
    const clamped = clampPosition(targetX, targetY, w, h);
    mainWindow.setPosition(clamped.x, clamped.y);
    savePosition(clamped.x, clamped.y);
});

// Roaming step micro-movement
ipcMain.on('roam-step', (event, { deltaX, deltaY }) => {
    if (!mainWindow) return;
    const [currentX, currentY] = mainWindow.getPosition();
    const [w, h] = mainWindow.getSize();
    const clamped = clampPosition(currentX + deltaX, currentY + deltaY, w, h);
    mainWindow.setPosition(clamped.x, clamped.y);
});

// Always on top toggle
ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
    if (!mainWindow) return;
    mainWindow.setAlwaysOnTop(Boolean(isAlwaysOnTop));
});

// Reset position to default corner
ipcMain.on('reset-position', () => {
    if (!mainWindow) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const targetX = width - 270;
    const targetY = height - 350;
    mainWindow.setPosition(targetX, targetY);
    savePosition(targetX, targetY);
});

// Dock to Raiden / Hide window
ipcMain.on('dock-mascot', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});

// Set window position
ipcMain.on('set-window-position', (event, { x, y }) => {
    if (!mainWindow) return;
    const [w, h] = mainWindow.getSize();
    const clamped = clampPosition(x, y, w, h);
    mainWindow.setPosition(clamped.x, clamped.y);
    savePosition(clamped.x, clamped.y);
});

// Show / Restore window
ipcMain.on('show-mascot', (event, coords) => {
    if (mainWindow) {
        if (coords && typeof coords.x === 'number' && typeof coords.y === 'number') {
            const [w, h] = mainWindow.getSize();
            const clamped = clampPosition(coords.x, coords.y, w, h);
            mainWindow.setPosition(clamped.x, clamped.y);
            savePosition(clamped.x, clamped.y);
        }
        mainWindow.show();
        mainWindow.focus();
    } else {
        createMascotWindow();
    }
});

app.whenReady().then(() => {
    createMascotWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMascotWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
