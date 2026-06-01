import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { WebSocketServer } from 'ws';
import { Game } from './game.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// --- Static file serving ---
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Strip leading slash, prevent path traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// --- WebSocket: one Game per room name ---
const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const roomName = (params.get('room') || 'lobby').slice(0, 32);

  let room = rooms.get(roomName);
  if (!room) {
    room = new Game(roomName);
    rooms.set(roomName, room);
    room.start();
  }

  const player = room.addPlayer(ws);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      room.handleMessage(player, msg);
    } catch (e) {
      // ignore bad json
    }
  });

  ws.on('close', () => {
    room.removePlayer(player.id);
    if (room.isEmpty()) {
      room.stop();
      rooms.delete(roomName);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Snake arena listening on http://localhost:${PORT}`);
});
