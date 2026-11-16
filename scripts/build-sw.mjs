import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = (await readdir("dist", { recursive: true, withFileTypes: true }))
  .filter((f) => f.isFile() && f.name !== "sw.js")
  .map((f) => `${f.parentPath}/${f.name}`.replaceAll("\\", "/"));
const assets = files.map((f) => "/" + f.replace(/^dist\//, ""));
const hash = createHash("sha256");
for (const path of files) hash.update(await readFile(path));
const cache = "flui-shell-" + hash.digest("hex").slice(0, 12);
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('flui-shell-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;
 }
 if(!ASSETS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(cached=>cached||fetch(event.request)));
});
`,
);
console.log(`PWA: ${assets.length} assets; ${cache}.`);
