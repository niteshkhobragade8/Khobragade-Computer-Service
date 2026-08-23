const CACHE='kcsc-commission-partner-v1';
const ASSETS=[
 './commission-dashboard.html',
 './assets/portal.css?v=20260821-final24r3',
 './assets/commission-dashboard.css?v=20260823-cdash1'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kcsc-commission-partner-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==location.origin)return;
 if(url.pathname.includes('/portal/commission-dashboard.html')||url.pathname.includes('/portal/assets/commission-dashboard.css')){
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
 }
});
