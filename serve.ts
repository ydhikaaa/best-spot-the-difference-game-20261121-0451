// Tiny static file server for local play-testing: serves the game/ folder
// at http://localhost:8080 so the entry can be played and screenshotted in a
// desktop browser exactly as the judge's environment would load it.
//   node serve.ts [port]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = join(dirname(fileURLToPath(import.meta.url)), 'game');
const port = Number(process.argv[2] ?? 8080);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    const filePath = join(gameDir, rel === '' ? 'index.html' : rel);
    if (!filePath.startsWith(gameDir)) throw new Error('outside game dir');
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(port, () => console.log(`serving game/ at http://localhost:${port}`));
