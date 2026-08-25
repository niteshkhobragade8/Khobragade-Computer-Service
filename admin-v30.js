import {db} from './supabase-app.js';
import {collection,onSnapshot,doc,updateDoc,serverTimestamp} from './supabase-db.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function movePortalManagers(){
 const old=$('portalbuilderPage'); if(!old)return;
 const serviceMount=$('servicesmanagerMount'),actionMount=$('actionsmanagerMount'),formMount=$('formsmanagerMount'),chargeMount=$('servicechargesMount');
 const serviceManager=old.querySelector('.portal-service-manager');
 const az=old.querySelector('.portal-az-manager');
 const action=old.querySelector('.portal-action-manager');
 const charge=old.querySelector('.portal-charge-manager');
 const form=old.querySelector('.portal-form-builder');
 const master=old.querySelector(':scope > .manager-content');
 if(serviceMount){if(master)serviceMount.appendChild(master);if(serviceManager)serviceMount.appendChild(serviceManager);if(az)serviceMount.appendChild(az)}
 if(actionMount&&action)actionMount.appendChild(action);
 if(formMount&&form)formMount.appendChild(form);
 if(chargeMount&&charge)chargeMount.appendChild(charge);
 old.style.display='none';
}
let actions=[];
function serviceName(id){return window.__v30Services?.find(x=>x.id===id)?.name||id}
function renderDocManager(){
 const sel=$('v30DocsAction'); if(!sel)return;
 const current=sel.value;
 sel.innerHTML=actions.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(a=>`<option value="${esc(a.id)}">${esc(serviceName(a.serviceId))} → ${esc(a.name||'Action')}</option>`).join('');
 if(current&&actions.some(a=>a.id===current))sel.value=current;
 loadDocs();
}
function loadDocs(){const a=actions.find(x=>x.id===$('v30DocsAction')?.value);if($('v30DocsText'))$('v30DocsText').value=(a?.requiredDocuments||[]).join('\n');if($('v30DocsPreview'))$('v30DocsPreview').innerHTML=a?(a.requiredDocuments||[]).map(x=>`<article class="content-card"><h3>📎 ${esc(x)}</h3><p>Required upload document</p></article>`).join('')||'<div class="empty-state">No required documents.</div>':'<div class="empty-state">Select an action.</div>'}
$('v30DocsAction')?.addEventListener('change',loadDocs);
$('v30ClearDocs')?.addEventListener('click',()=>{if($('v30DocsText'))$('v30DocsText').value=''});
$('v30SaveDocs')?.addEventListener('click',async()=>{const id=$('v30DocsAction')?.value;if(!id)return alert('Action select karein.');const requiredDocuments=($('v30DocsText')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);await updateDoc(doc(db,'serviceActions',id),{requiredDocuments,updatedAt:serverTimestamp()});if($('v30DocsMessage')){$('v30DocsMessage').textContent='✅ Documents updated.';$('v30DocsMessage').className='settings-message success'}});
onSnapshot(collection(db,'services'),snap=>{window.__v30Services=snap.docs.map(d=>({id:d.id,...d.data()}));renderDocManager()});
onSnapshot(collection(db,'serviceActions'),snap=>{actions=snap.docs.map(d=>({id:d.id,...d.data()}));renderDocManager()});
movePortalManagers();
