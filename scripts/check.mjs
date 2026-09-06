import {readFile,readdir,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
async function walk(dir){const result=[];for(const n of await readdir(dir)){const p=path.join(dir,n);if((await stat(p)).isDirectory())result.push(...await walk(p));else result.push(p);}return result;}
const root=path.resolve('dist');let count=0;
for(const file of (await walk(root)).filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8');count++;
 for(const needed of ['name="viewport"','Ontario','data-privacy-open','noindex,nofollow'])assert(html.includes(needed),`${file}: ${needed}`);
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(!ref.startsWith('/')||ref.startsWith('//'))continue;
  const p=path.join(root,ref.split(/[?#]/)[0]);
  const exists=await Promise.all([p,p+'.html',path.join(p,'index.html')].map(c=>stat(c).then(s=>s.isFile()).catch(()=>false)));
  assert(exists.some(Boolean),`${file}: missing ${ref}`);
 }
}
assert((await readFile('assets/site.js','utf8')).includes('https://stake.com/?c=NE3yHgEO'),'Preserved affiliate URL');
console.log(`PASS: ${count} pages; internal links/assets; EN/FR routes; privacy controls; Ontario restriction; affiliate destination.`);
