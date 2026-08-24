
import {db} from './supabase-app.js';
import {collection,onSnapshot,doc,setDoc,increment,serverTimestamp,writeBatch} from './supabase-db.js';
import {DEFAULT_SERVICES,DEFAULT_SCHEMES,DEFAULT_DIVYANG,DOCUMENT_CHECKLISTS} from './catalog-data.js';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase(), digits=v=>String(v||'').replace(/\D/g,'');
let settings={},services=[],updates=[],docs=[],notifications=[],pages={},youtubeVideos=[],cmsGlobal={},cmsHome={},siteSections=[],editableChecklists=[],dynamicPages=[],extraMenus=[],activeTheme={},websiteImages=[];

let currentLang=localStorage.getItem('kcsLang')||'';
const UI={
 en:{home:'Home',services:'Services',yojana:'Yojana',divyang:'Divyang',documents:'Documents',contact:'Contact',youtube:'YouTube',whatsapp:'WhatsApp',search:'Search PAN, eShram, Maha ID, UDID, Yojana, documents...',apply:'WhatsApp Apply'},
 hi:{home:'होम',services:'सेवाएं',yojana:'योजनाएं',divyang:'दिव्यांग',documents:'दस्तावेज़',contact:'संपर्क',youtube:'YouTube',whatsapp:'WhatsApp',search:'PAN, eShram, Maha ID, UDID, योजना, दस्तावेज़ खोजें...',apply:'WhatsApp से आवेदन'},
 mr:{home:'मुख्यपृष्ठ',services:'सेवा',yojana:'योजना',divyang:'दिव्यांग',documents:'कागदपत्रे',contact:'संपर्क',youtube:'YouTube',whatsapp:'WhatsApp',search:'PAN, eShram, Maha ID, UDID, योजना, कागदपत्रे शोधा...',apply:'WhatsApp अर्ज'}
};
function localized(x,field){if(!x)return'';return x[field+currentLang.toUpperCase()]||x[field]||''}
function applyLanguage(){
 currentLang=currentLang||settings.defaultLanguage||'en';localStorage.setItem('kcsLang',currentLang);
 const t=UI[currentLang]||UI.en, links=[['index.html','home'],['services.html','services'],['maharashtra.html','yojana'],['divyang.html','divyang'],['documents.html','documents'],['contact.html','contact']];
 links.forEach(([href,k])=>{const a=document.querySelector(`.nav-links a[href="${href}"]`);if(a)a.textContent=t[k]});
 const ya=[...document.querySelectorAll('.nav-links a[data-youtube]')][0];if(ya)ya.textContent=t.youtube;
 const waA=document.querySelector('.nav-links .nav-cta');if(waA)waA.textContent=t.whatsapp;
 if($('globalSearch'))$('globalSearch').placeholder=t.search;if($('langSelect'))$('langSelect').value=currentLang;
}
function applyTheme(){
 const primary=settings.themePrimary||'#ec4899',secondary=settings.themeSecondary||'#2563eb',menu=settings.menuColor||'#172554',radius=settings.cardRadius||'20';
 document.documentElement.style.setProperty('--primary',primary);document.documentElement.style.setProperty('--pink',primary);document.documentElement.style.setProperty('--secondary',secondary);document.documentElement.style.setProperty('--blue',secondary);document.documentElement.style.setProperty('--menu-bg',menu);document.documentElement.style.setProperty('--radius',radius+'px');
 let mode=localStorage.getItem('kcsMode')||settings.defaultMode||'light';if(mode==='system')mode=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.body.classList.toggle('dark',mode==='dark');if($('modeToggle'))$('modeToggle').textContent=mode==='dark'?'☀️':'🌙';
 const logo=settings.logoUrl||'';document.querySelectorAll('[data-logo]').forEach(img=>{if(logo){img.src=logo;img.hidden=false}else img.hidden=true});document.querySelectorAll('[data-logo-letter]').forEach(e=>e.hidden=!!logo);
}


function getCurrentPageKey(){
 const file=(location.pathname.split('/').pop()||'').toLowerCase();
 const map={'':'home','index.html':'home','services.html':'services','maharashtra.html':'yojana','divyang.html':'divyang','documents.html':'documents','contact.html':'contact'};
 if(Object.prototype.hasOwnProperty.call(map,file))return map[file];
 return document.body.dataset.page||document.body.dataset.catalog||'';
}
function getImageByCategory(category){
 const wanted=norm(category);
 return websiteImages.filter(x=>(x.status||'Published')==='Published'&&norm(x.category)===wanted&&x.url)
   .sort((a,b)=>time(b.updatedAt||b.createdAt)-time(a.updatedAt||a.createdAt))[0]||null;
}
function applyWebsiteImages(){
 const pageKey=getCurrentPageKey();
 const logo=getImageByCategory('Header Logo');
 if(logo?.url){document.querySelectorAll('[data-logo]').forEach(img=>{img.src=logo.url;img.hidden=false});document.querySelectorAll('[data-logo-letter]').forEach(e=>e.hidden=true)}
 const categoryMap={home:'Home Banner',services:'Services Banner',yojana:'Yojana Banner',divyang:'Divyang Banner',documents:'Documents Banner',contact:'Contact Banner'};
 const category=categoryMap[pageKey]; if(!category)return;
 const banner=getImageByCategory(category); if(!banner?.url)return;
 if(pageKey==='home'){
   const hero=document.querySelector('.hero'); if(!hero)return;
   const box=hero.querySelector('.hero-panel')||hero.querySelector('.computer-visual');
   if(box){box.style.backgroundImage=`linear-gradient(rgba(23,37,84,.12),rgba(236,72,153,.08)),url("${String(banner.url).replaceAll('"','%22')}")`;box.style.backgroundSize='cover';box.style.backgroundPosition='center';box.style.backgroundRepeat='no-repeat';box.style.minHeight='300px';box.style.borderRadius='24px';box.style.overflow='hidden';[...box.children].forEach(c=>c.style.display='none');return}
   hero.style.backgroundImage=`linear-gradient(rgba(23,37,84,.35),rgba(236,72,153,.20)),url("${String(banner.url).replaceAll('"','%22')}")`;hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';
   return;
 }
 const pageHero=document.querySelector('.page-hero')||document.querySelector('.hero'); if(!pageHero)return;
 pageHero.style.backgroundImage=`linear-gradient(rgba(23,37,84,.72),rgba(37,99,235,.58)),url("${String(banner.url).replaceAll('"','%22')}")`;
 pageHero.style.backgroundSize='cover';pageHero.style.backgroundPosition='center';pageHero.style.backgroundRepeat='no-repeat';
}

const time=v=>v?.toDate?.().getTime?.()||v?.seconds*1000||new Date(v||0).getTime()||0;
const wa=(name='Digital service')=>{let n=digits(settings.whatsappNumber||settings.contactNumber||'9637832490');if(n.length===10)n='91'+n;return `https://wa.me/${n}?text=${encodeURIComponent('Namaste, mujhe '+name+' ke liye jankari/apply assistance chahiye. Required documents aur process bataiye.')}`};
function mergeUnique(base,live){const m=new Map();base.forEach(x=>m.set(norm(x.name),{...x,status:'Published'}));live.forEach(x=>{let k=norm(x.name);if(!k)return;(x.status||'Published')==='Published'?m.set(k,x):m.delete(k)});return [...m.values()]}

function renderUpdates(){const box=$('latestPublicUpdates');if(!box)return;const rows=updates.filter(x=>(x.status||'Published')==='Published').sort((a,b)=>time(b.createdAt||b.updatedAt)-time(a.createdAt||a.updatedAt));box.innerHTML=rows.length?rows.map(x=>`<article class="pro-card"><div class="card-icon">📢</div><h3>${esc(x.title||'Government Update')}</h3><p>${esc(x.description||'')}</p><small>${esc(x.category||'Government Update')}</small></article>`).join(''):'<div class="empty">No updates yet.</div>'}
function renderPopup(){
 const x=notifications.filter(n=>(n.status||'Published')==='Published'&&n.type==='popup').sort((a,b)=>time(b.createdAt||b.updatedAt)-time(a.createdAt||a.updatedAt))[0];
 if(!x||sessionStorage.getItem('popup-'+x.id)==='seen')return;
 sessionStorage.setItem('popup-'+x.id,'seen');
 const o=document.createElement('div');
 o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99999;display:grid;place-items:center;padding:14px';
 const image=x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'Notification')}" style="display:block;max-width:96vw;max-height:84vh;width:auto;height:auto;object-fit:contain;border-radius:18px" loading="eager">`:'';
 const textBlock=`<div style="padding:${x.imageUrl?'14px 18px 18px':'24px'};background:#fff;color:#132238"><h3 style="margin:0 0 8px">${esc(x.title||'Notification')}</h3><p style="margin:0">${esc(x.description||'')}</p></div>`;
 o.innerHTML=`<div style="position:relative;max-width:min(980px,96vw);max-height:94vh;overflow:auto;border-radius:20px;background:#fff;box-shadow:0 25px 70px rgba(0,0,0,.4)"><button data-close-popup type="button" aria-label="Close" style="position:absolute;right:10px;top:10px;z-index:2;border:0;background:rgba(0,0,0,.72);color:#fff;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer">✕</button>${image}${textBlock}</div>`;
 o.querySelector('[data-close-popup]').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)
}
function relevant(kind){if(kind==='yojana')return services.filter(x=>/yojana|scheme|scholarship|farmer|agriculture|pension|women|health|housing|employment|labour|food|maharashtra/i.test(`${x.category||''} ${x.name||''} ${x.description||''}`));if(kind==='divyang')return services.filter(x=>/divyang|udid|disability|handicap/i.test(`${x.category||''} ${x.name||''} ${x.description||''}`));return services}

function base(kind){if(settings.catalogMode==='database')return[];return kind==='yojana'?DEFAULT_SCHEMES:kind==='divyang'?DEFAULT_DIVYANG:DEFAULT_SERVICES}

function renderDynamicMenu(){const h=$('dynamicMenuItems');if(!h)return;const p=dynamicPages.filter(x=>(x.status||'Published')==='Published'&&x.inMenu!==false).map(x=>({name:x.name||'Page',link:'dynamic-page.html?page='+encodeURIComponent(x.slug||''),order:Number(x.order??x.menuOrder??50)}));const m=extraMenus.filter(x=>x.visible!==false).map(x=>({name:x.name||'Menu',link:x.link||'#',order:Number(x.order||80),target:x.target||'_self'}));h.innerHTML=[...p,...m].sort((a,b)=>a.order-b.order).map(x=>`<a class="dynamic-nav-link" href="${esc(x.link)}" target="${esc(x.target||'_self')}">${esc(x.name)}</a>`).join('')}

function applyMainMenuControl(g={}){
 const nav=document.querySelector('.nav-links');if(!nav)return;
 const rows=[['navHome','navHomeVisible','navHomeOrder',10],['navServices','navServicesVisible','navServicesOrder',20],['navYojana','navYojanaVisible','navYojanaOrder',30],['navDivyang','navDivyangVisible','navDivyangOrder',40],['navDocuments','navDocumentsVisible','navDocumentsOrder',50],['navContact','navContactVisible','navContactOrder',60],['navYoutube','navYoutubeVisible','navYoutubeOrder',70],['navWhatsapp','navWhatsappVisible','navWhatsappOrder',80]];
 rows.forEach(([id,vk,ok,d])=>{const e=nav.querySelector('#'+id);if(e){e.style.display=g[vk]===false?'none':'';e.dataset.cmsOrder=String(Number(g[ok]??d));}});
 const anchor=nav.querySelector('#dynamicMenuItems')||nav.querySelector('#langSelect');rows.map(([id])=>nav.querySelector('#'+id)).filter(Boolean).sort((a,b)=>Number(a.dataset.cmsOrder||0)-Number(b.dataset.cmsOrder||0)).forEach(e=>nav.insertBefore(e,anchor));
}

function applyFullCms(){const g=cmsGlobal||{},h=cmsHome||{},t=(id,v)=>{const e=$(id);if(e&&v!==undefined&&v!==null&&v!=='')e.textContent=v};t('cmsTopLeftPublic',g.topLeft);t('navHome',g.navHome);t('navServices',g.navServices);t('navYojana',g.navYojana);t('navDivyang',g.navDivyang);t('navDocuments',g.navDocuments);t('navContact',g.navContact);t('navYoutube',g.navYoutube);t('navWhatsapp',g.navWhatsapp);if($('globalSearch')&&g.searchPlaceholder)$('globalSearch').placeholder=g.searchPlaceholder;t('globalSearchButton',g.searchButton);if($('globalSearchSection'))$('globalSearchSection').style.display=g.searchVisible===false?'none':'';t('footerQuickTitle',g.footerQuickTitle);t('footerSupportTitle',g.footerSupportTitle);if($('footerText')&&g.copyright)$('footerText').textContent=g.copyright;if(g.menuBg&&!activeTheme.menuBg)document.documentElement.style.setProperty('--menu-bg',g.menuBg);if(g.menuText&&!activeTheme.menuText)document.documentElement.style.setProperty('--menu-text',g.menuText);if(g.menuActive&&!activeTheme.menuActive)document.documentElement.style.setProperty('--menu-active',g.menuActive);if($('siteFooter')&&g.footerBg&&!activeTheme.footer)$('siteFooter').style.background=g.footerBg;applyMainMenuControl(g);if(document.body.dataset.page==='home'){t('homeHeroEyebrow',h.heroEyebrow);if($('heroTitle')&&h.heroTitle)$('heroTitle').textContent=h.heroTitle;if($('heroSubtitle')&&h.heroText)$('heroSubtitle').textContent=h.heroText;t('homeHeroBtn1',h.heroBtn1);t('homeHeroBtn2',h.heroBtn2);if($('homeHeroSection')){$('homeHeroSection').style.display=h.heroVisible===false?'none':'';if(h.heroColor1&&h.heroColor2)$('homeHeroSection').style.background=`linear-gradient(135deg,${h.heroColor1},${h.heroColor2})`}t('homeYoutubeTitle',h.youtubeTitle);t('homeYoutubeText',h.youtubeText);if($('youtubeHomeSection'))$('youtubeHomeSection').style.display=h.youtubeVisible===false?'none':'';t('homeQuickTitle',h.quickTitle);t('homeQuickText',h.quickText);t('homeQuickButton',h.quickButton);if($('homeQuickSection'))$('homeQuickSection').style.display=h.quickVisible===false?'none':'';t('homeAboutKicker',h.aboutKicker);if($('homeAboutTitle')&&h.aboutTitle)$('homeAboutTitle').textContent=h.aboutTitle;if($('homeAboutText')&&h.aboutText)$('homeAboutText').textContent=h.aboutText;if($('homeAboutSection'))$('homeAboutSection').style.display=h.aboutVisible===false?'none':''}renderCustomSections()}
function safeLink(v){const s=String(v||'').trim();return(/^https?:\/\//i.test(s)||/^[a-z0-9_-]+\.html/i.test(s)||s.startsWith('#'))?s:'#'}
function customSectionHtml(x){return `<section class="section cms-custom-section" data-cms-generated="1" style="background:${esc(x.bgColor||'#fff')};color:${esc(x.textColor||'#132238')}"><div class="section-inner"><div class="cms-custom-grid">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'Section image')}" loading="lazy">`:''}<div><span class="kicker" style="color:${esc(x.accentColor||'#ec4899')}">CUSTOM</span><h2>${esc(x.title||'')}</h2><p>${esc(x.description||'')}</p>${x.buttonText&&x.buttonLink?`<a class="btn btn-blue" href="${esc(safeLink(x.buttonLink))}" ${/^https?:/i.test(x.buttonLink)?'target="_blank" rel="noopener"':''}>${esc(x.buttonText)}</a>`:''}</div></div></div></section>`}
function renderCustomSections(){
 document.querySelectorAll('.cms-custom-section[data-cms-generated="1"]').forEach(e=>e.remove());
 const page=document.body.dataset.page||'home',rows=siteSections.filter(x=>x.page===page&&x.visible!==false).sort((a,b)=>Number(a.order||50)-Number(b.order||50));
 if(page!=='home'){const host=$('customSectionsHost');if(host)host.innerHTML=rows.map(customSectionHtml).join('');return}
 const builtins=[[$('homeHeroSection'),10],[$('homeUpdatesSection'),20],[$('youtubeHomeSection'),30],[$('homeQuickSection'),40],[$('homeAboutSection'),50]].filter(x=>x[0]);
 rows.forEach(x=>{const wrap=document.createElement('div');wrap.innerHTML=customSectionHtml(x);const node=wrap.firstElementChild,ord=Number(x.order||50);const target=builtins.find(([,o])=>o>ord)?.[0];if(target)target.parentNode.insertBefore(node,target);else{const footer=$('siteFooter');footer?.parentNode.insertBefore(node,footer);}});
}
function applySettings(){let name=settings.siteName||'Khobragade Computer Service Centre';document.querySelectorAll('[data-site-name]').forEach(e=>e.textContent=name);document.querySelectorAll('[data-tagline]').forEach(e=>e.textContent=settings.tagline||'Digital Seva & Government Service Assistance');document.querySelectorAll('[data-address]').forEach(e=>e.textContent=settings.address||'Nagpur, Maharashtra, India');document.querySelectorAll('[data-phone]').forEach(e=>e.textContent=settings.contactNumber||'9637832490');document.querySelectorAll('[data-wa]').forEach(e=>e.href=wa(e.dataset.message||'Digital service'));document.querySelectorAll('[data-call]').forEach(e=>{let n=digits(settings.contactNumber||'9637832490');e.href='tel:'+(n.length===10?'+91':'')+n});document.querySelectorAll('[data-youtube]').forEach(e=>e.href=settings.youtubeChannel||'https://youtube.com/@niteshkhobragade8');if($('heroTitle'))$('heroTitle').textContent=settings.heroTitle||name;if($('heroSubtitle'))$('heroSubtitle').textContent=settings.heroSubtitle||'Online citizen services, government schemes and document assistance at one place.';if($('homeAboutTitle'))$('homeAboutTitle').textContent=settings.homeAboutTitle||name;if($('homeAboutText'))$('homeAboutText').textContent=settings.homeAboutText||'Digital applications, government schemes, citizen services and document guidance ke liye professional assistance.';if($('footerText'))$('footerText').textContent=settings.footerText||'© 2026 All Rights Reserved'}
function applyPage(){let key=document.body.dataset.page||document.body.dataset.catalog||'home',p=pages[key];if(!p||p.status==='Draft')return;if($('pageHeroTitle')&&p.title)$('pageHeroTitle').textContent=p.title;if($('pageHeroSubtitle')&&p.subtitle)$('pageHeroSubtitle').textContent=p.subtitle;if($('pageDescription')&&p.description)$('pageDescription').textContent=p.description}
function card(x){let name=localized(x,'name')||x.name,desc=localized(x,'description')||x.description,id='item-'+norm(x.name).replace(/[^a-z0-9]+/g,'-'),t=UI[currentLang]||UI.en;return `<article class="pro-card" id="${id}"><div class="card-icon">${esc(x.icon||'📄')}</div><span class="tag">${esc(x.category||'Digital Service')}</span><h3>${esc(name)}</h3><p>${esc(desc||'Online application aur document guidance assistance available.')}</p><div class="card-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="${wa(name)}">${t.apply}</a></div></article>`}
function renderServices(){let c=$('serviceGrid');if(!c)return;let kind=document.body.dataset.catalog||'services',q=norm($('serviceSearch')?.value||new URLSearchParams(location.search).get('q'));let rows=mergeUnique(base(kind),relevant(kind));if(q)rows=rows.filter(x=>norm(`${x.name} ${x.category} ${x.description}`).includes(q));rows.sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||String(a.name).localeCompare(String(b.name)));c.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">No matching result found.</div>'}
function renderFeatured(){let c=$('featuredServiceGrid');if(!c)return;let preferred=['eShram Card','PAN Card','Voter ID','ABHA Card','Ayushman Card','Maha ID','Income Certificate','UDID Card'];let all=mergeUnique(DEFAULT_SERVICES,services);let rows=preferred.map(n=>all.find(x=>norm(x.name).includes(norm(n)))).filter(Boolean);if(rows.length<8)rows=[...rows,...all.filter(x=>!rows.includes(x)).slice(0,8-rows.length)];c.innerHTML=rows.slice(0,8).map(x=>`<a class="pro-card service-link" href="services.html?q=${encodeURIComponent(x.name)}"><div class="card-icon">${esc(x.icon||'📄')}</div><span class="tag">${esc(x.category||'Service')}</span><h3>${esc(x.name)}</h3><p>${esc(x.description||'Digital service assistance')}</p><div class="arrow">View service →</div></a>`).join('')}
function renderDocs(){let c=$('documentGrid');if(!c)return;let q=norm($('documentSearchPublic')?.value||new URLSearchParams(location.search).get('q'));let source=settings.documentsMode==='database'?editableChecklists.filter(x=>(x.status||'Published')==='Published'):DOCUMENT_CHECKLISTS;let a=source.filter(x=>!q||norm(`${x.title} ${x.category} ${(x.items||[]).join(' ')}`).includes(q)).map(x=>`<article class="pro-card"><div class="card-icon">📋</div><span class="tag">${esc(x.category||'Documents')}</span><h3>${esc(x.title)}</h3><ol>${(x.items||[]).map(i=>`<li>${esc(i)}</li>`).join('')}</ol><div class="card-actions"><a class="btn btn-wa" target="_blank" href="${wa(x.title)}">WhatsApp Confirm</a></div></article>`);let b=docs.filter(x=>(x.status||'Published')==='Published'&&(!q||norm(`${x.title} ${x.category}`).includes(q))).map(x=>`<article class="pro-card"><div class="card-icon">📄</div><h3>${esc(x.title)}</h3>${x.url?`<a class="btn btn-blue" target="_blank" href="${esc(x.url)}">Open Document</a>`:''}</article>`);c.innerHTML=[...a,...b].join('')||'<div class="empty">No matching documents found.</div>'}
function youtubeId(url){
  try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.split('/')[1]||'';if(u.pathname.startsWith('/shorts/'))return u.pathname.split('/')[2]||'';return u.searchParams.get('v')||''}catch(_){return''}
}
function renderYoutube(){
  const c=$('homeYoutubeGrid');if(!c)return;
  const rows=youtubeVideos.filter(x=>(x.status||'Published')==='Published').sort((a,b)=>time(b.createdAt||b.updatedAt)-time(a.createdAt||a.updatedAt)).slice(0,6);
  c.innerHTML=rows.length?rows.map(x=>{const id=youtubeId(x.link||'');const thumb=id?`https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:'';return `<article class="youtube-public-card">${thumb?`<img class="youtube-thumb" src="${thumb}" alt="${esc(x.title||'YouTube video')}" loading="lazy">`:`<div class="youtube-thumb" style="display:grid;place-items:center;color:#fff;font-size:50px">▶</div>`}<div class="youtube-public-body"><h3>${esc(x.title||'YouTube Video')}</h3><p>${esc(x.description||'Watch latest video from our YouTube channel.')}</p><a class="btn btn-blue" href="${esc(x.link||settings.youtubeChannel||'#')}" target="_blank" rel="noopener">▶ Watch Video</a></div></article>`}).join(''):'<div class="empty">Admin Dashboard → YouTube me Published video add karein.</div>';
}
function renderNotice(){
 let n=notifications.filter(x=>(x.status||'Published')==='Published'&&x.type!=='popup').sort((a,b)=>time(b.createdAt||b.updatedAt)-time(a.createdAt||a.updatedAt))[0],box=$('homeNotification'),bar=$('breakingBar');
 if(n&&box)box.innerHTML=`${n.imageUrl?`<img src="${esc(n.imageUrl)}" alt="${esc(n.title||'Notification')}" style="width:100%;max-height:420px;object-fit:contain;border-radius:16px;margin-bottom:12px" loading="lazy">`:''}<strong>📢 ${esc(n.title)}</strong><p>${esc(n.description||'')}</p>`;
 let breaking=notifications.filter(x=>(x.status||'Published')==='Published'&&x.type==='breaking').sort((a,b)=>time(b.createdAt)-time(a.createdAt))[0];
 if(breaking&&bar){$('breakingText').innerHTML=`${breaking.imageUrl?`<img src="${esc(breaking.imageUrl)}" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:7px;vertical-align:middle;margin-right:8px">`:''}${esc(breaking.title+(breaking.description?' — '+breaking.description:''))}`;bar.style.display='block'}else if(bar)bar.style.display='none'
}
function searchIndex(){let out=[];mergeUnique(DEFAULT_SERVICES,services).forEach(x=>out.push({name:x.name,meta:x.category||'Service',url:'services.html?q='+encodeURIComponent(x.name),text:`${x.name} ${x.category} ${x.description}`}));mergeUnique(DEFAULT_SCHEMES,relevant('yojana')).forEach(x=>out.push({name:x.name,meta:'Government Yojana',url:'maharashtra.html?q='+encodeURIComponent(x.name),text:`${x.name} ${x.category} ${x.description}`}));mergeUnique(DEFAULT_DIVYANG,relevant('divyang')).forEach(x=>out.push({name:x.name,meta:'Divyang',url:'divyang.html?q='+encodeURIComponent(x.name),text:`${x.name} ${x.category} ${x.description}`}));(settings.documentsMode==='database'?editableChecklists.filter(x=>(x.status||'Published')==='Published'):DOCUMENT_CHECKLISTS).forEach(x=>out.push({name:x.title+' Documents',meta:'Documents',url:'documents.html?q='+encodeURIComponent(x.title),text:`${x.title} ${x.category} ${(x.items||[]).join(' ')}`}));return out}
function globalSearch(){let q=norm($('globalSearch')?.value),box=$('globalSearchResults');if(!box)return;if(q.length<2){box.style.display='none';return}let rows=searchIndex().filter(x=>norm(x.text).includes(q)).slice(0,12);box.innerHTML=rows.length?rows.map(x=>`<a class="search-result" href="${x.url}"><strong>${esc(x.name)}</strong><small>${esc(x.meta)} · Open page →</small></a>`).join(''):'<div class="search-result"><strong>No matching result found</strong><small>Try another keyword.</small></div>';box.style.display='block'}
document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===location.pathname.split('/').pop()||(!location.pathname.split('/').pop()&&a.getAttribute('href')==='index.html'))a.classList.add('active')});
$('globalSearch')?.addEventListener('input',globalSearch);document.querySelector('.global-search-box button')?.addEventListener('click',globalSearch);document.addEventListener('click',e=>{if(!e.target.closest('.global-search-inner')&&$('globalSearchResults'))$('globalSearchResults').style.display='none'});
$('serviceSearch')?.addEventListener('input',renderServices);$('documentSearchPublic')?.addEventListener('input',renderDocs);
applySettings();applyTheme();applyLanguage();applyFullCms();renderServices();renderFeatured();renderDocs();renderYoutube();applyPage();applyWebsiteImages();
onSnapshot(doc(db,'settings','website'),s=>{settings=s.exists()?s.data():{};if(!currentLang)currentLang=settings.defaultLanguage||'en';applySettings();applyTheme();applyLanguage();applyFullCms();renderServices();renderFeatured();renderDocs();renderYoutube();applyWebsiteImages()});
onSnapshot(collection(db,'services'),s=>{services=s.docs.map(d=>({id:d.id,...d.data()}));renderServices();renderFeatured()});
onSnapshot(collection(db,'documents'),s=>{docs=s.docs.map(d=>({id:d.id,...d.data()}));renderDocs()});
onSnapshot(collection(db,'notifications'),s=>{notifications=s.docs.map(d=>({id:d.id,...d.data()}));renderNotice();renderPopup()});
onSnapshot(collection(db,'updates'),s=>{updates=s.docs.map(d=>({id:d.id,...d.data()}));renderUpdates()});
onSnapshot(collection(db,'pageContent'),s=>{pages={};s.docs.forEach(d=>pages[d.id]=d.data());applyPage()});
if(!sessionStorage.getItem('khobragadeVisitorCounted')){let today=new Date(Date.now()+330*60*1000).toISOString().slice(0,10);const visitorBatch=writeBatch(db);visitorBatch.set(doc(db,'analytics','site'),{totalVisitors:increment(1),updatedAt:serverTimestamp()},{merge:true});visitorBatch.set(doc(db,'visitorDaily',today),{date:today,count:increment(1),updatedAt:serverTimestamp()},{merge:true});visitorBatch.commit().then(()=>sessionStorage.setItem('khobragadeVisitorCounted','yes')).catch(()=>{})}

onSnapshot(collection(db,'youtube'),s=>{youtubeVideos=s.docs.map(d=>({id:d.id,...d.data()}));renderYoutube()});

$('langSelect')?.addEventListener('change',e=>{currentLang=e.target.value;applyLanguage();renderServices();renderFeatured();renderDocs();renderYoutube()});
$('modeToggle')?.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);localStorage.setItem('kcsMode',dark?'dark':'light');$('modeToggle').textContent=dark?'☀️':'🌙'});

onSnapshot(doc(db,'settings','cmsGlobal'),s=>{cmsGlobal=s.exists()?s.data():{};applyFullCms()});
onSnapshot(doc(db,'settings','cmsHome'),s=>{cmsHome=s.exists()?s.data():{};applyFullCms()});
onSnapshot(collection(db,'siteSections'),s=>{siteSections=s.docs.map(d=>({id:d.id,...d.data()}));renderCustomSections()});
onSnapshot(collection(db,'documentChecklists'),s=>{editableChecklists=s.docs.map(d=>({id:d.id,...d.data()}));renderDocs()});

onSnapshot(collection(db,'dynamicPages'),s=>{dynamicPages=s.docs.map(d=>({id:d.id,...d.data()}));renderDynamicMenu()});
onSnapshot(collection(db,'menuItems'),s=>{extraMenus=s.docs.map(d=>({id:d.id,...d.data()}));renderDynamicMenu()});

onSnapshot(doc(db,'settings','activeTheme'),s=>{activeTheme=s.exists()?s.data():{};applyTheme()});


onSnapshot(collection(db,'images'),s=>{websiteImages=s.docs.map(d=>({id:d.id,...d.data()}));applyWebsiteImages()},e=>console.error('Website Images error:',e));
