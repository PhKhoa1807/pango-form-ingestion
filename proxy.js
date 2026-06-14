// ============================================================
//  Proxy nho cho app nhap don -> Pango Ingest.
//  - Phuc vu index.html tai http://localhost:8787
//  - Chuyen tiep request toi Pango o phia server => KHONG dinh CORS.
//  Chay: node proxy.js   (hoac double-click start-proxy.bat)
// ============================================================
const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 8787;
const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.bat': 'text/plain', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  // Cho phep moi origin (de mo bang Live Server hay file:// deu duoc)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const u = new URL(req.url, 'http://localhost');

  // ---- Endpoint chuyen tiep ----
  if (u.pathname === '/forward') {
    const target = req.headers['x-target-url'];
    if (!target) { res.writeHead(400); res.end('missing x-target-url'); return; }

    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      let tu;
      try { tu = new URL(target); } catch { res.writeHead(400); res.end('bad x-target-url'); return; }
      const lib = tu.protocol === 'https:' ? https : http;

      const headers = { ...req.headers };
      delete headers.host;
      delete headers['x-target-url'];
      delete headers['content-length'];
      delete headers.origin;
      delete headers.referer;

      const preq = lib.request(tu, { method: req.method, headers }, pres => {
        const ct = pres.headers['content-type'] || 'application/json';
        res.writeHead(pres.statusCode || 502, {
          'Content-Type': ct,
          'Access-Control-Allow-Origin': '*'
        });
        pres.pipe(res);
      });
      preq.on('error', e => {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ proxyError: e.message }));
      });
      if (body.length) preq.write(body);
      preq.end();
    });
    return;
  }

  // ---- Phuc vu file tinh ----
  const rel = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname);
  const fp = path.join(ROOT, rel);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('================================================');
  console.log('  App + Proxy chay tai:  http://localhost:' + PORT);
  console.log('  Mo trinh duyet va vao dia chi tren.');
  console.log('  Nhan Ctrl+C de dung.');
  console.log('================================================');
});
