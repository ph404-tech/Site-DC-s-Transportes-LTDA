const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'icon.png'), // User might need to add an icon
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
    // win.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(() => {
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

// --- Telemetry Integration ---

// Define the precise shared path: Documents/ETS2_Tracker/data.json
function getTelemetryPath() {
    return path.join(app.getPath('documents'), 'ETS2_Tracker', 'data.json');
}

// Helper to find the file
function findTelemetryFile() {
    const p = getTelemetryPath();
    if (fs.existsSync(p)) {
        return p;
    }
    return null;
}

// Helper to read data
function readTelemetryData() {
    try {
        const filePath = findTelemetryFile();
        if (filePath) {
            const raw = fs.readFileSync(filePath, 'utf8');
            // Check if file is empty
            if (!raw || raw.trim() === '') return { connected: false };

            const data = JSON.parse(raw);

            // Add valid flag if we parsed correctly
            // We can also inject timestamp to force UI updates
            return {
                ...data,
                // If the file is old (game closed), might want to mark connected=false?
                // For now relying on the plugin's "connected" field if it exists, or just presence of file
                _path: filePath
            };
        }
    } catch (err) {
        console.error("Error reading telemetry:", err);
    }
    return { connected: false, error: "File not found" };
}

// IPC Handlers
ipcMain.handle('get-telemetry', () => {
    return readTelemetryData();
});
