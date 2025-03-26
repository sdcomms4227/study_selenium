require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Store active SSE connections
const clients = new Map();

// Endpoint to run scripts
app.post('/run/:script', (req, res) => {
    const script = req.params.script;
    const scriptPath = path.join(__dirname, 'scripts', script, `${script}.js`);
    
    console.log(`Running script: ${scriptPath}`);
    
    // Create a unique ID for this script execution
    const executionId = Date.now().toString();
    
    // Create the child process
    const child = spawn('node', [scriptPath]);
    
    // Store the client connection
    clients.set(executionId, res);
    
    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Execution-ID': executionId
    });
    
    // Handle script output
    child.stdout.on('data', (data) => {
        const log = data.toString();
        res.write(`data: ${JSON.stringify({ type: 'log', message: log })}\n\n`);
    });
    
    // Handle script errors
    child.stderr.on('data', (data) => {
        const error = data.toString();
        res.write(`data: ${JSON.stringify({ type: 'error', message: error })}\n\n`);
    });
    
    // Handle script completion
    child.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', code })}\n\n`);
        res.end();
        clients.delete(executionId);
    });
    
    // Handle client disconnect
    req.on('close', () => {
        child.kill();
        clients.delete(executionId);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 