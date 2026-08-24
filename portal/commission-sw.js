const CACHE='kcsc-commission-partner-v4-supabasefinal';
const ASSETS=[
 './commission-dashboard.html',
 './assets/portal.css?v=20260824-supabasefinal1',
 './assets/commission-dashboard.css?v=20260824-supabasefinal1'
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('kcsc-commission-partner-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  const critical=
    url.pathname.endsWith('/portal/commission-dashboard.html') ||
    url.pathname.endsWith('/portal/commission.html') ||
    url.pathname.endsWith('/portal/assets/portal.js') ||
    url.pathname.endsWith('/portal/assets/portal.css') ||
    url.pathname.endsWith('/portal/assets/commission-dashboard.css');
  if(!critical)return;

  e.respondWith(
    fetch(new Request(e.request,{cache:'no-store'}))
      .then(r=>{
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
        return r;
      })
      .catch(()=>caches.match(e.request))
  );
});
