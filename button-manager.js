import { db } from './firebase-config.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
let buttons=[], editId=null, dynamicPages=[], adminEditor={customPages:[]};
const isAdmin=!!document.getElementById('sidebarMenu');

function publicPageKey(){
  const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const map={'index.html':'home','services.html':'services','maharashtra.html':'yojana','divyang.html':'divyang','documents.html':'documents','contact.html':'contact'};
  if(f==='dynamic-page.html') return 'dynamic:'+new URLSearchParams(location.search).get('page');
  return map[f]||document.body.dataset.page||'home';
}
function adminPageKey(){return document.querySelector('.page.active')?.id?.replace(/Page$/,'')||localStorage.getItem('activePage')||'dashboard'}
function makeButton(x){
  const a=document.createElement('a');a.className='managed-custom-button';a.href=x.url||'#';a.target=x.target||'_self';if(a.target==='_blank')a.rel='noopener';
  a.innerHTML=`${x.icon?`<i class="${esc(x.icon)}"></i> `:''}${esc(x.text||'Button')}`;
  a.style.setProperty('--bm-bg',x.bgColor||'#2979ff');a.style.setProperty('--bm-text',x.textColor||'#ffffff');a.style.setProperty('--bm-radius',(Number(x.radius)||12)+'px');a.style.setProperty('--bm-size',(Number(x.fontSize)||15)+'px');
  return a;
}
function host(cls,where){let h=document.querySelector('.'+cls);if(h)return h;h=document.createElement('div');h.className='button-manager-host '+cls;if(where?.parent&&where.before)where.parent.insertBefore(h,where.before);else if(where?.parent)where.parent.appendChild(h);return h}
function clearRendered(){document.querySelectorAll('.button-manager-host,.managed-custom-button[data-bm-floating]').forEach(e=>e.remove())}
function renderButtons(){
  clearRendered();const key=isAdmin?adminPageKey():publicPageKey();
  buttons.filter(x=>x.visible!==false&&x.area===(isAdmin?'admin':'public')&&(x.page==='all'||x.page===key)).sort((a,b)=>Number(a.order||50)-Number(b.order||50)).forEach(x=>{
    const a=makeButton(x),pos=x.position||'page-top-right';
    if(pos==='floating-right'){a.dataset.bmFloating='1';a.classList.add('bm-floating');document.body.appendChild(a);return}
    let h;
    if(isAdmin){
      const page=document.querySelector('.page.active');if(!page)return;
      if(pos==='topbar-right')h=host('bm-admin-topbar',{parent:document.querySelector('.top-right')});
      else if(pos==='page-bottom')h=host('bm-admin-bottom',{parent:page});
      else {const intro=page.querySelector('.page-intro');h=host('bm-admin-page-top',{parent:page,before:intro?.nextSibling||page.firstChild});h.classList.toggle('bm-left',pos==='page-top-left');}
    } else {
      const footer=document.getElementById('siteFooter');const hero=document.querySelector('.hero');
      if(pos==='header-right')h=host('bm-public-header',{parent:document.querySelector('.nav-links')||document.querySelector('header')||document.body});
      else if(pos==='after-hero')h=host('bm-public-after-hero',{parent:hero?.parentNode||document.body,before:hero?.nextSibling||null});
      else if(pos==='page-bottom')h=host('bm-public-bottom',{parent:footer?.parentNode||document.body,before:footer||null});
      else h=host('bm-public-top',{parent:(hero||document.querySelector('.global-search')||footer)?.parentNode||document.body,before:hero||document.querySelector('.global-search')||footer||null});
    }
    h?.appendChild(a);
  });
}
function adminTargets(){
  const fixed=[['dashboard','Dashboard'],['admineditor','Admin Editor'],['updates','Government Updates'],['services','Services'],['categories','Categories'],['images','Images'],['documents','Documents'],['youtube','YouTube'],['notifications','Notifications'],['analytics','Analytics'],['seo','SEO Manager'],['pages','Website Pages'],['sitebuilder','Full Website CMS'],['dynamicpages','Page & Menu Builder'],['recyclebin','Recycle Bin'],['themes','Theme Manager'],['settings','Settings']];
  return [['all','All Admin Pages'],...fixed,...(adminEditor.customPages||[]).map(x=>['custom_'+x.id,x.name||'Custom Admin Page'])];
}
function publicTargets(){return [['all','All Website Pages'],['home','Home'],['services','Services'],['yojana','Yojana'],['divyang','Divyang'],['documents','Documents'],['contact','Contact'],...dynamicPages.map(x=>['dynamic:'+(x.slug||''),x.name||x.title||x.slug||'Dynamic Page'])]}
function fillPageOptions(){const s=$('bmPage');if(!s)return;const rows=$('bmArea')?.value==='admin'?adminTargets():publicTargets();const old=s.value;s.innerHTML=rows.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join('');if(rows.some(x=>x[0]===old))s.value=old;fillPositionOptions()}
function fillPositionOptions(){const s=$('bmPosition');if(!s)return;const admin=$('bmArea')?.value==='admin';const rows=admin?[['topbar-right','Top Bar Right'],['page-top-right','Page Top Right'],['page-top-left','Page Top Left'],['page-bottom','Page Bottom'],['floating-right','Floating Right']]:[['header-right','Header / Menu Right'],['page-top-right','Page Top'],['after-hero','After Hero / Banner'],['page-bottom','Before Footer'],['floating-right','Floating Right']];const old=s.value;s.innerHTML=rows.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');if(rows.some(x=>x[0]===old))s.value=old}
function resetForm(){editId=null;['bmText','bmUrl'].forEach(id=>{if($(id))$(id).value=''});if($('bmIcon'))$('bmIcon').value='fa-solid fa-link';if($('bmOrder'))$('bmOrder').value='50';if($('bmVisible'))$('bmVisible').value='true';if($('bmTarget'))$('bmTarget').value='_blank';if($('bmBg'))$('bmBg').value='#2979ff';if($('bmTextColor'))$('bmTextColor').value='#ffffff';if($('bmRadius'))$('bmRadius').value='12';if($('bmFontSize'))$('bmFontSize').value='15';if($('bmSave'))$('bmSave').textContent='Add Button'}
function formData(){return {text:$('bmText').value.trim(),icon:$('bmIcon').value.trim(),url:$('bmUrl').value.trim(),area:$('bmArea').value,page:$('bmPage').value,position:$('bmPosition').value,target:$('bmTarget').value,order:Number($('bmOrder').value||50),visible:$('bmVisible').value!=='false',bgColor:$('bmBg').value,textColor:$('bmTextColor').value,radius:Number($('bmRadius').value||12),fontSize:Number($('bmFontSize').value||15),updatedAt:serverTimestamp()}}
function renderList(){const b=$('bmList');if(!b)return;b.innerHTML=buttons.length?buttons.sort((a,b)=>Number(a.order||50)-Number(b.order||50)).map(x=>`<article class="content-card"><div class="box-heading"><div><span class="box-kicker">${esc((x.area||'public').toUpperCase())}</span><h3>${esc(x.text||'Button')}</h3></div><span>${x.visible===false?'Hidden':'Visible'}</span></div><p>${esc(x.page||'all')} · ${esc(x.position||'')} · ${esc(x.target||'_self')}</p><p class="field-help">${esc(x.url||'#')}</p><div class="card-actions"><button class="action-btn edit" data-bm-edit="${x.id}">✏ Edit</button><button class="action-btn delete" data-bm-delete="${x.id}">🗑 Delete</button></div></article>`).join(''):'<div class="empty-state">No custom buttons yet.</div>'}

$('bmArea')?.addEventListener('change',fillPageOptions);
$('bmClear')?.addEventListener('click',resetForm);
$('bmSave')?.addEventListener('click',async()=>{const d=formData();if(!d.text)return alert('Button Text required.');if(!d.url)return alert('Button Link / URL required.');try{if(editId)await updateDoc(doc(db,'customButtons',editId),d);else await addDoc(collection(db,'customButtons'),{...d,createdAt:serverTimestamp()});resetForm();$('bmMessage').textContent='Button saved / updated successfully.'}catch(e){console.error(e);alert('Button save error: '+e.message)}});
$('bmList')?.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.bmEdit){const x=buttons.find(v=>v.id===b.dataset.bmEdit);if(!x)return;editId=x.id;$('bmText').value=x.text||'';$('bmIcon').value=x.icon||'';$('bmUrl').value=x.url||'';$('bmArea').value=x.area||'public';fillPageOptions();$('bmPage').value=x.page||'all';fillPositionOptions();$('bmPosition').value=x.position||$('bmPosition').value;$('bmTarget').value=x.target||'_self';$('bmOrder').value=x.order??50;$('bmVisible').value=String(x.visible!==false);$('bmBg').value=x.bgColor||'#2979ff';$('bmTextColor').value=x.textColor||'#ffffff';$('bmRadius').value=x.radius??12;$('bmFontSize').value=x.fontSize??15;$('bmSave').textContent='Update Button';document.getElementById('bmPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}else if(b.dataset.bmDelete){if(!confirm('Button delete karna hai?'))return;try{await deleteDoc(doc(db,'customButtons',b.dataset.bmDelete))}catch(err){alert('Delete error: '+err.message)}}});

onSnapshot(collection(db,'customButtons'),s=>{buttons=s.docs.map(d=>({id:d.id,...d.data()}));renderList();renderButtons()},e=>console.error('Button Manager error:',e));
if(isAdmin){onSnapshot(collection(db,'dynamicPages'),s=>{dynamicPages=s.docs.map(d=>({id:d.id,...d.data()}));fillPageOptions()});onSnapshot(doc(db,'settings','adminEditor'),s=>{adminEditor=s.exists()?s.data():{customPages:[]};fillPageOptions();setTimeout(renderButtons,0)});new MutationObserver(()=>renderButtons()).observe(document.querySelector('.main-content')||document.body,{attributes:true,subtree:true,attributeFilter:['class']});fillPageOptions()}
