require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;
let server = null;

// Store active scripts and current script
const activeScripts = new Map();
let currentScript = null;

// Serve static files from the root directory
app.use(express.static('./'));

// Endpoint to run scripts
app.get('/run/:scriptName/:mode', (req, res) => {
    const { scriptName, mode } = req.params;
    const { keyword, filters } = req.query;
    const scriptPath = path.join(__dirname, 'scripts', scriptName, `${scriptName}.js`);

    // 이미 실행 중인 스크립트가 있는지 확인
    if (activeScripts.has(scriptName)) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: '이미 실행 중인 스크립트입니다.' })}\n\n`);
        res.end();
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 스크립트 실행 인자 구성
    const args = [scriptPath];
    if (scriptName === 'search') {
        if (keyword) {
            args.push(`keyword=${keyword}`);
        }
        if (filters) {
            args.push(`filters=${filters}`);
        }
    }

    console.log('스크립트 실행 인자:', args);
    const script = spawn('node', args);
    activeScripts.set(scriptName, script);
    currentScript = scriptName;

    script.stdout.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: data.toString() })}\n\n`);
    });

    script.stderr.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: data.toString() })}\n\n`);
    });

    script.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', code: code })}\n\n`);
        activeScripts.delete(scriptName);
        if (currentScript === scriptName) {
            currentScript = null;
        }
        res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
        if (activeScripts.has(scriptName)) {
            const script = activeScripts.get(scriptName);
            script.kill();
            activeScripts.delete(scriptName);
            if (currentScript === scriptName) {
                currentScript = null;
            }
        }
    });
});

// Endpoint to stop specific script
app.get('/stop/:scriptName', (req, res) => {
    const { scriptName } = req.params;
    
    if (activeScripts.has(scriptName)) {
        const script = activeScripts.get(scriptName);
        script.kill();
        activeScripts.delete(scriptName);
        if (currentScript === scriptName) {
            currentScript = null;
        }
        res.json({ success: true, message: `${scriptName} 스크립트가 중지되었습니다.` });
    } else {
        res.json({ success: false, error: '실행 중인 스크립트가 없습니다.' });
    }
});

// Endpoint to check script status
app.get('/status/:scriptName', (req, res) => {
    const { scriptName } = req.params;
    res.json({ 
        status: activeScripts.has(scriptName) ? 'running' : 'stopped',
        script: scriptName
    });
});

// 상태 확인 엔드포인트
app.get('/status', (req, res) => {
    res.json({
        isRunning: currentScript !== null,
        currentScript: currentScript
    });
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '..')));

// 404 처리
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
function startServer() {
    if (server) {
        console.log('Server is already running');
        return;
    }

    server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Start the server
startServer(); 