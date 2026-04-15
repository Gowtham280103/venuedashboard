import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

// Keep track of SSE clients
const clients = new Set();

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStadiumData() {
  return {
    zones: [
      { id: 'gate-a',    name: 'Gate A',      density: rand(20,95),  capacity: 500,  x:10, y:15, w:18, h:22 },
      { id: 'gate-b',    name: 'Gate B',      density: rand(20,95),  capacity: 500,  x:72, y:15, w:18, h:22 },
      { id: 'gate-c',    name: 'Gate C',      density: rand(20,95),  capacity: 400,  x:10, y:63, w:18, h:22 },
      { id: 'gate-d',    name: 'Gate D',      density: rand(20,95),  capacity: 400,  x:72, y:63, w:18, h:22 },
      { id: 'food-court',name: 'Food Court',  density: rand(30,90),  capacity: 800,  x:30, y:10, w:40, h:18 },
      { id: 'seating-n', name: 'North Stand', density: rand(40,100), capacity: 2000, x:28, y:30, w:44, h:14 },
      { id: 'seating-s', name: 'South Stand', density: rand(40,100), capacity: 2000, x:28, y:56, w:44, h:14 },
      { id: 'pitch',     name: 'Pitch',       density: 0,            capacity: 0,    x:28, y:44, w:44, h:12 },
      { id: 'restroom-w',name: 'Restrooms W', density: rand(10,80),  capacity: 200,  x:10, y:40, w:16, h:20 },
      { id: 'restroom-e',name: 'Restrooms E', density: rand(10,80),  capacity: 200,  x:74, y:40, w:16, h:20 },
    ],
    waitingTimes: {
      gates: [
        { id:'gate-a', name:'Gate A', wait:rand(2,25), trend:rand(-3,3) },
        { id:'gate-b', name:'Gate B', wait:rand(2,25), trend:rand(-3,3) },
        { id:'gate-c', name:'Gate C', wait:rand(2,25), trend:rand(-3,3) },
        { id:'gate-d', name:'Gate D', wait:rand(2,25), trend:rand(-3,3) },
      ],
      food: [
        { id:'food-1', name:'Stand 1', wait:rand(3,20), trend:rand(-3,3) },
        { id:'food-2', name:'Stand 2', wait:rand(3,20), trend:rand(-3,3) },
        { id:'food-3', name:'Stand 3', wait:rand(3,20), trend:rand(-3,3) },
      ],
      restrooms: [
        { id:'rest-w', name:'West Wing', wait:rand(1,12), trend:rand(-2,2) },
        { id:'rest-e', name:'East Wing', wait:rand(1,12), trend:rand(-2,2) },
        { id:'rest-n', name:'North End', wait:rand(1,12), trend:rand(-2,2) },
      ],
    },
    staff: [
      { zone:'Gate A',      assigned:rand(4,12),  required:10 },
      { zone:'Gate B',      assigned:rand(4,12),  required:10 },
      { zone:'Food Court',  assigned:rand(6,18),  required:15 },
      { zone:'North Stand', assigned:rand(8,20),  required:18 },
      { zone:'South Stand', assigned:rand(8,20),  required:18 },
      { zone:'Restrooms',   assigned:rand(3,8),   required:6  },
    ],
    alerts: [
      { id:1, priority:'high',   message:'Gate A overcrowded — density at 92%',       time:'2m ago',  icon:'🚨' },
      { id:2, priority:'high',   message:'Medical team needed at Section C4',          time:'4m ago',  icon:'🏥' },
      { id:3, priority:'medium', message:'Food Court Stand 2 queue exceeding 18 min',  time:'6m ago',  icon:'⚠️' },
      { id:4, priority:'medium', message:'Staff shortage detected at South Stand',     time:'9m ago',  icon:'👥' },
      { id:5, priority:'low',    message:'West restrooms at 75% capacity',             time:'12m ago', icon:'ℹ️' },
      { id:6, priority:'high',   message:'Security alert near Gate D entrance',        time:'1m ago',  icon:'🔒' },
      { id:7, priority:'medium', message:'Crowd surge detected — North Stand',         time:'3m ago',  icon:'⚠️' },
    ].sort(() => Math.random() - 0.5).slice(0, rand(3, 5)),
    crowdTrend: Array.from({ length: 12 }, (_, i) => ({
      label: `${i * 5}m`,
      value: rand(3000, 9500),
    })),
    totalAttendance: rand(18000, 28000),
    maxCapacity: 30000,
    aiSuggestions: [
      'Redirect crowd from Gate A to Gate C — Gate A at 92% capacity',
      'Open additional food stand to reduce 18-min wait time',
      'Deploy 3 more staff to South Stand — below required allocation',
      'Activate overflow parking Lot D — Lot B nearing capacity',
      'Pre-position medical team near Section B — high density area',
      'Suggest PA announcement to disperse North Stand concourse crowd',
    ].sort(() => Math.random() - 0.5).slice(0, rand(2, 4)),
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // SSE endpoint — real-time updates
  if (req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial data immediately
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    send(generateStadiumData());

    // Send updates every 5 seconds
    const interval = setInterval(() => send(generateStadiumData()), 5000);
    clients.add(res);

    req.on('close', () => {
      clearInterval(interval);
      clients.delete(res);
    });
    return;
  }

  // REST snapshot
  if (req.url === '/api/initial') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(generateStadiumData()));
    return;
  }

  // Serve static files from dist/
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html');

  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    res.setHeader('Content-Type', mime);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`StadiumOS running on port ${PORT}`);
});
