import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { WebSocketServer } from 'ws';
import { Game } from './game.js';

// Identical to v2-arena/server.js. Same protocol, same wire format.

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

const rooms = new Map();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/api/rooms') {
    const summary = [...rooms.values()].map(r => r.summary());
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(summary));
    return;
  }

  let p = urlPath === '/' ? '/index.html' : urlPath;
  const safe = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safe);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const roomName = (params.get('room') || 'lobby').slice(0, 32);
  const name = params.get('name');
  const color = params.get('color');

  let room = rooms.get(roomName);
  if (!room) {
    room = new Game(roomName);
    rooms.set(roomName, room);
    room.start();
  }

  const player = room.addPlayer(ws, name, color);
  if (!player) {
    try { ws.send(JSON.stringify({ type: 'rejected', reason: 'full' })); } catch (_) {}
    ws.close(4001, 'Room is full');
    return;
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      room.handleMessage(player, msg);
    } catch (_) {}
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
  console.log(`Snake coder listening on http://localhost:${PORT}`);
});
