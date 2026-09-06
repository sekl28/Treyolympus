import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const headers = Object.fromEntries(config.headers.flatMap(r => r.headers.map(h => [h.key, h.value])));
const files = new Map([
  ['/', { name: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/index.html', { name: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/robots.txt', { name: 'robots.txt', type: 'text/plain; charset=utf-8' }],
  ['/404.html', { name: '404.html', type: 'text/html; charset=utf-8' }],
]);
try {
  for (const entry of files.values()) entry.body = await readFile(path.join(root, 'dist', entry.name));
} catch {
  console.error('Build output is missing. Run npm run build first.');
  process.exit(1);
}
const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
    return response.end();
  }
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400, headers); return response.end(); }
  const found = files.get(pathname);
  const file = found ?? files.get('/404.html');
  response.writeHead(found ? 200 : 404, {
    ...headers,
    'Content-Type': file.type,
    'Content-Length': file.body.length,
    'Cache-Control': 'no-store',
  });
  response.end(request.method === 'HEAD' ? undefined : file.body);
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`Local preview: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
