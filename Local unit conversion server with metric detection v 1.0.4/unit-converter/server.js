// server.js — zero-dependency local HTTP server
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { convertFromText, CATEGORIES } = require('./units');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function escapeHtmlAttr(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function serveStatic(req, res, urlPath, queryText) {
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath);

    // For the index page, bake a ?text= query value straight into the input's
    // value attribute server-side. This avoids any client-side race where a
    // browser's own form-restore behavior could overwrite a value set by JS
    // after the page has already painted.
    if (ext === '.html' && filePath === path.join(PUBLIC_DIR, 'index.html') && queryText) {
      let html = data.toString('utf8');
      html = html.replace(
        /id="text-input" name="text" placeholder="e\.g\. 50 feet" value="[^"]*"/,
        `id="text-input" name="text" placeholder="e.g. 50 feet" value="${escapeHtmlAttr(queryText)}"`
      );
      res.writeHead(200, {
        'Content-Type': MIME[ext],
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      return res.end(html);
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API: POST /api/convert  { text: "50 feet" }
  if (url.pathname === '/api/convert' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body || '{}');
        const result = convertFromText(text);
        sendJSON(res, result.ok ? 200 : 400, result);
      } catch (e) {
        sendJSON(res, 400, { ok: false, error: 'Invalid request body.' });
      }
    });
    return;
  }

  // API: GET /api/categories — for reference / debugging
  if (url.pathname === '/api/categories' && req.method === 'GET') {
    const summary = Object.fromEntries(
      Object.entries(CATEGORIES).map(([key, cat]) => [
        key,
        { name: cat.name, units: Object.keys(cat.units) },
      ])
    );
    return sendJSON(res, 200, summary);
  }

  // Static files (the frontend)
  if (req.method === 'GET') {
    return serveStatic(req, res, url.pathname, url.searchParams.get('text'));
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`\n  Unit Converter running → http://localhost:${PORT}\n`);
});
