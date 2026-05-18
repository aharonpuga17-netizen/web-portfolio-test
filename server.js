const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.glb': 'model/gltf-binary',
        '.gltf': 'model/gltf+json'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end();
        } else {
            // Configurar cabeceras CORS para permitir la carga
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(8080, () => {
    console.log('Servidor local iniciado en http://localhost:8080/');
    console.log('Abriendo el navegador...');
    
    // Abrir automáticamente la página en el navegador por defecto
    const { exec } = require('child_process');
    const url = 'http://localhost:8080/';
    
    switch (process.platform) {
        case 'darwin':
            exec(`open ${url}`);
            break;
        case 'win32':
            exec(`start ${url}`);
            break;
        default:
            exec(`xdg-open ${url}`);
            break;
    }
});
