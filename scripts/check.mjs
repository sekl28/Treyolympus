import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const fail = message => { throw new Error(message); };
try {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
  const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const filename of ['index.html', 'robots.txt', '404.html']) {
    await access(path.join(root, filename));
  }
  if (!/^<!doctype html>/i.test(html.trim())) fail('Missing HTML doctype');
  if (!/<meta\s+name="viewport"/i.test(html)) fail('Missing viewport');
  if (!html.includes("https://stake.com/?c=NE3yHgEO")) fail('Expected affiliate URL is missing');
  if (!html.includes('noindex,nofollow')) fail('Review-mode robots tag is missing');
  if (!/Disallow:\s*\//.test(robots)) fail('Review-mode robots.txt is missing');
  if (config.framework !== null || config.outputDirectory !== 'dist') fail('Invalid Vercel static build settings');
  const responseHeaders = config.headers?.flatMap(rule => rule.headers) ?? [];
  if (!responseHeaders.some(h => h.key === 'X-Robots-Tag' && h.value === 'noindex, nofollow')) {
    fail('Review-mode response header is missing');
  }
  let scriptCount = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/i.test(match[1])) fail('This bundle should not need external JavaScript');
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(match[1])) {
      JSON.parse(match[2]);
    } else {
      new vm.Script(match[2], { filename: `index-inline-${++scriptCount}.js` });
    }
  }
  if (!scriptCount) fail('No application script found');
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const ref = match[1];
    if (/^(?:#|[a-z][\w+.-]*:|\/\/)/i.test(ref) || ref === '/') continue;
    const rel = decodeURIComponent(ref.split(/[?#]/, 1)[0]).replace(/^\//, '');
    if (!rel) continue;
    const resolved = path.resolve(root, rel);
    if (!resolved.startsWith(root)) fail(`Unsafe local resource path: ${ref}`);
    await access(resolved);
  }
  console.log(`PASS: JSON, HTML, local resources, ${scriptCount} inline JS block, affiliate URL and robots settings`);
} catch (error) {
  console.error(`CHECK FAILED: ${error.message}`);
  process.exitCode = 1;
}
