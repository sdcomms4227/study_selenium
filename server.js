const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static('./'));

// Endpoint to run scripts
app.get('/run/:scriptName', (req, res) => {
    const scriptName = req.params.scriptName;
    const scriptPath = path.join(__dirname, 'src', 'scripts', `${scriptName}.js`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const script = spawn('node', [scriptPath]);

    script.stdout.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: data.toString() })}\n\n`);
    });

    script.stderr.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: data.toString() })}\n\n`);
    });

    script.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', code: code })}\n\n`);
        res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
        script.kill();
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 