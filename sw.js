/* Ruta PROSEMBRA: funciona sin señal (la página y el mapa ya vistos quedan guardados en el celular) */
const V = 'ruta-prosembra-v1', TILES = 'ruta-prosembra-mapa';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u, u.startsWith('http') ? {mode:'no-cors'} : {})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V && k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function trimTiles(){ const c = await caches.open(TILES), ks = await c.keys(); if(ks.length > 700) for(const k of ks.slice(0, ks.length-700)) await c.delete(k); }
self.addEventListener('fetch', e=>{
  const r = e.request, u = new URL(r.url);
  if(r.method!=='GET') return;
  if(/firebaseio\.com|firebasedatabase\.app|router\.project-osrm\.org/.test(u.host)) return;   // datos en vivo: siempre por internet
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{ const cp = res.clone(); caches.open(V).then(c=>c.put('./index.html', cp)); return res; }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(/arcgisonline\.com|tile\.openstreetmap/.test(u.host)){
    e.respondWith(caches.open(TILES).then(c=>c.match(r).then(hit=>hit || fetch(r).then(res=>{ if(res.ok || res.type==='opaque'){ c.put(r, res.clone()); trimTiles(); } return res; }).catch(()=>hit))));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit || fetch(r).then(res=>{ if(u.origin===location.origin || /cdnjs/.test(u.host)){ const cp = res.clone(); caches.open(V).then(c=>c.put(r, cp)); } return res; })));
});
