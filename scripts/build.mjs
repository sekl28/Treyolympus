import { mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
// Explicit allowlist: documentation, configuration and working archives are never served.
const publicFiles = ['index.html', 'robots.txt', '404.html'];
try {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const name of publicFiles) {
    await copyFile(path.join(root, name), path.join(out, name));
    console.log(`Built ${name} (${(await stat(path.join(out, name))).size} bytes)`);
  }
  console.log('Build complete: dist/');
} catch (error) {
  console.error(`BUILD FAILED: ${error.message}`);
  process.exitCode = 1;
}
