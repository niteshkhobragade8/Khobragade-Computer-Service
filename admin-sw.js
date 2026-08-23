const CACHE='kcsc-admin-v31-cachefix';
const ADMIN_NAV=new Set(['/dashboard.html','/login.html','/admin.html']);
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./dashboard.html','./login.html'])).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('kcsc-admin-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;

  // IMPORTANT: this root-scoped Admin SW must NOT intercept public website or /portal/*.
  const path=url.pathname.replace(/\/+$/,'') || '/';
  const isAdminNav=e.request.mode==='navigate' && (
    path.endsWith('/dashboard.html') ||
    path.endsWith('/login.html') ||
    path.endsWith('/admin.html')
  );
  if(!isAdminNav)return;

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
