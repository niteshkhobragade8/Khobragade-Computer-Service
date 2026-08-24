
import { db } from './supabase-app.js';
import { adminCreateUser, adminDeleteUser } from './supabase-auth.js';
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, serverTimestamp, writeBatch
} from './supabase-db.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=v=>{try{return (v?.toDate?v.toDate():new Date(v)).toLocaleString('en-IN')}catch{return'—'}};
const alias=mobile=>`m${String(mobile||'').replace(/\D/g,'')}@login.9637832490.online`;

let initialized=false, unsubs=[];
let users=[], apps=[], payments=[], screenshots=[], services=[], actions=[], rates=[], ledger=[];
let editingUid='';

function activeCommissionUsers(){return users.filter(u=>u.isCommissionUser===true)}
function userName(uid){const u=users.find(x=>x.id===uid);return u?.fullName||u?.mobile||uid||'—'}
function serviceName(id){return services.find(x=>x.id===id)?.name||id||'—'}
function appByDocOrId(id){return apps.find(a=>a.id===id||a.applicationId===id)}
function isCommissionUserId(uid){return activeCommissionUsers().some(u=>u.id===uid)}
function rateId(uid,aid){return `${uid}__${aid}`.replace(/[^a-zA-Z0-9_-]/g,'_')}
function calcFinal(charge,type,value){
  charge=Math.max(0,Number(charge||0)); value=Math.max(0,Number(value||0));
  const commission=type==='percent'?charge*Math.min(value,100)/100:Math.min(value,charge);
  return {commission:Number(commission.toFixed(2)),final:Number(Math.max(0,charge-commission).toFixed(2))}
}
function commissionFor(uid,action){
  const u=users.find(x=>x.id===uid)||{};
  const r=rates.find(x=>x.userId===uid&&x.actionId===action.id&&x.active!==false);
  const type=r?.type||u.defaultCommissionType||'fixed';
  const value=Number(r?.value ?? u.defaultCommissionValue ?? 0);
  return {type,value,...calcFinal(action.serviceCharge,type,value)}
}
function setMsg(id,msg,type='info'){const el=$(id);if(el){el.textContent=msg;el.className=`settings-message ${type}`}}

function switchTab(name){
  document.querySelectorAll('[data-commission-tab]').forEach(b=>b.classList.toggle('active',b.dataset.commissionTab===name));
  document.querySelectorAll('.commission-tab').forEach(x=>x.classList.remove('active'));
  $(`commission${name[0].toUpperCase()+name.slice(1)}Tab`)?.classList.add('active');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-commission-tab]');
  if(b)switchTab(b.dataset.commissionTab);
});

function renderSummary(){
  $('commissionUsersCount').textContent=activeCommissionUsers().length;
  const capps=apps.filter(a=>a.isCommissionApplication||isCommissionUserId(a.userId));
  $('commissionAppsCount').textContent=capps.length;
  $('commissionBenefitTotal').textContent=money(capps.reduce((s,a)=>s+Number(a.commissionAmount||0),0));
  $('commissionPaidCount').textContent=capps.filter(a=>a.paymentStatus==='Paid').length;
}
function renderUserSelects(){
  const active=activeCommissionUsers();
  const opts='<option value="">Select Commission User</option>'+active.map(u=>`<option value="${esc(u.id)}">${esc(u.fullName||u.mobile)} (${esc(u.mobile||'')})</option>`).join('');
  const svc=$('commissionServiceUser');
  if(svc){
    const v=svc.value;
    svc.innerHTML=opts;
    if(active.some(u=>u.id===v))svc.value=v;
  }
}
function renderUsers(){
  const q=($('commissionUserSearch')?.value||'').toLowerCase();
  const rows=activeCommissionUsers().filter(u=>!q||`${u.fullName||''} ${u.mobile||''} ${u.email||''} ${u.commissionCode||''}`.toLowerCase().includes(q));
  $('commissionUsersList').innerHTML=rows.map(u=>`<article class="content-card commission-user-card">
    <span class="status-badge ${(u.commissionStatus||'Active')==='Active'?'published':'draft'}">${esc(u.commissionStatus||'Active')}</span>
    <h3>${esc(u.fullName||'Commission User')}</h3>
    <p>${esc(u.mobile||'')} ${u.email?'· '+esc(u.email):''}</p>
    <small>Code: ${esc(u.commissionCode||'—')} · Default: ${u.defaultCommissionType==='percent'?esc(u.defaultCommissionValue||0)+'%':money(u.defaultCommissionValue||0)}</small>
    <div class="card-actions"><button class="action-btn edit" data-cu-edit="${u.id}">Edit</button><button class="action-btn edit" data-cu-toggle="${u.id}">${(u.commissionStatus||'Active')==='Active'?'Inactive':'Activate'}</button><button class="action-btn delete" data-cu-delete="${u.id}">Delete Commission User</button></div>
  </article>`).join('')||'<div class="empty-state">No commission users.</div>';
}
function renderApps(){
  const q=($('commissionAppSearch')?.value||'').toLowerCase();
  const rows=apps.filter(a=>a.isCommissionApplication||isCommissionUserId(a.userId)).filter(a=>!q||`${a.applicationId||a.id} ${a.userName||''} ${a.serviceName||''}`.toLowerCase().includes(q));
  $('commissionApplicationsTable').innerHTML=rows.map(a=>`<tr><td><b>${esc(a.applicationId||a.id)}</b></td><td>${esc(a.userName||userName(a.userId))}</td><td>${esc(a.serviceName||'')}<br><small>${esc(a.actionName||'')}</small></td><td>${money(a.originalAmount??a.amount)}</td><td>${money(a.commissionAmount||0)}</td><td><b>${money(a.amount||0)}</b></td><td><select data-ca-status="${a.id}"><option ${a.status==='Pending'?'selected':''}>Pending</option><option ${a.status==='Processing'?'selected':''}>Processing</option><option ${a.status==='Need Documents'?'selected':''}>Need Documents</option><option ${a.status==='Completed'?'selected':''}>Completed</option><option ${a.status==='Rejected'?'selected':''}>Rejected</option></select></td><td><select data-ca-payment="${a.id}"><option ${a.paymentStatus==='Pending'?'selected':''}>Pending</option><option ${a.paymentStatus==='Paid'?'selected':''}>Paid</option><option ${a.paymentStatus==='Failed'?'selected':''}>Failed</option></select></td><td><button class="action-btn edit" data-ca-save="${a.id}">Update</button><button class="action-btn delete" data-ca-delete="${a.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="9">No commission applications.</td></tr>';
}
function renderPayments(){
  const rows=payments.filter(p=>{const a=appByDocOrId(p.applicationDocId||p.applicationId);return a&&(a.isCommissionApplication||isCommissionUserId(a.userId))});
  $('commissionPaymentsTable').innerHTML=rows.map(p=>{const a=appByDocOrId(p.applicationDocId||p.applicationId);return `<tr><td>${esc(p.paymentId||p.id)}</td><td>${esc(a?.userName||userName(a?.userId))}</td><td>${esc(p.applicationId||a?.applicationId||'')}</td><td>${money(p.amount||a?.amount||0)}</td><td><select data-cp-status="${p.id}"><option ${p.status==='Pending'?'selected':''}>Pending</option><option ${p.status==='Paid'?'selected':''}>Paid</option><option ${p.status==='Failed'?'selected':''}>Failed</option><option ${p.status==='Review'?'selected':''}>Review</option></select></td><td>${date(p.createdAt||p.updatedAt)}</td><td><button class="action-btn edit" data-cp-save="${p.id}">Update</button><button class="action-btn delete" data-cp-delete="${p.id}">Delete</button></td></tr>`}).join('')||'<tr><td colspan="7">No commission payments.</td></tr>';
}
function renderScreenshots(){
  const rows=screenshots.filter(s=>{const a=appByDocOrId(s.applicationDocId||s.applicationId);return isCommissionUserId(s.userId)||a?.isCommissionApplication||isCommissionUserId(a?.userId)});
  $('commissionScreenshotsList').innerHTML=rows.map(s=>`<article class="content-card"><span class="status-badge ${(s.reviewStatus||s.status)==='Approved'?'published':'draft'}">${esc(s.reviewStatus||s.status||'Pending')}</span><h3>${esc(s.applicationId||'Payment Proof')}</h3><p>${esc(userName(s.userId))} · ${money(s.amount||0)}</p>${s.screenshotUrl?`<a class="action-btn edit" target="_blank" rel="noopener" href="${esc(s.screenshotUrl)}">Preview Screenshot</a>`:''}<div class="card-actions"><select data-cs-status="${s.id}"><option ${s.status==='Pending'?'selected':''}>Pending</option><option ${(s.reviewStatus||s.status)==='Approved'?'selected':''}>Approved</option><option ${s.status==='Rejected'?'selected':''}>Rejected</option></select><button class="action-btn edit" data-cs-save="${s.id}">Update</button><button class="action-btn delete" data-cs-delete="${s.id}">Delete</button></div></article>`).join('')||'<div class="empty-state">No commission payment screenshots.</div>';
}
function renderLedger(){
  $('commissionLedgerTable').innerHTML=ledger.map(x=>`<tr><td>${esc(x.applicationId||x.id)}</td><td>${esc(userName(x.userId))}</td><td>${esc(x.serviceName||'')}<br><small>${esc(x.actionName||'')}</small></td><td>${money(x.originalCharge||0)}</td><td>${money(x.commissionAmount||0)}</td><td>${money(x.finalCharge||0)}</td><td><select data-ledger-status="${x.id}"><option ${x.status==='Pending'?'selected':''}>Pending</option><option ${x.status==='Paid'?'selected':''}>Paid</option><option ${x.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button class="action-btn edit" data-ledger-save="${x.id}">Update</button><button class="action-btn delete" data-ledger-delete="${x.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="8">No commission ledger entries.</td></tr>';
}
function renderServices(){
  const uid=$('commissionServiceUser')?.value||'';
  const q=($('commissionServiceSearch')?.value||'').toLowerCase();
  if(!uid){$('commissionServicesTable').innerHTML='<tr><td colspan="7">Commission user select karein.</td></tr>';setMsg('commissionServiceMessage','Commission user select karein.');return}
  const rows=actions.filter(a=>!q||`${serviceName(a.serviceId)} ${a.name||''}`.toLowerCase().includes(q)).sort((a,b)=>serviceName(a.serviceId).localeCompare(serviceName(b.serviceId)));
  $('commissionServicesTable').innerHTML=rows.map(a=>{const c=commissionFor(uid,a),r=rates.find(x=>x.userId===uid&&x.actionId===a.id);return `<tr data-rate-row="${esc(a.id)}" data-has-rate="${r?'true':'false'}" data-orig-type="${esc(c.type)}" data-orig-value="${Number(c.value||0)}" data-orig-active="${r?.active===false?'false':'true'}"><td><b>${esc(serviceName(a.serviceId))}</b></td><td>${esc(a.name||'Action')}</td><td><b>${money(a.serviceCharge||0)}</b><br><small>Read-only</small></td><td><select class="commission-rate-type" data-rate-type="${esc(a.id)}"><option value="fixed" ${c.type==='fixed'?'selected':''}>₹ Fixed</option><option value="percent" ${c.type==='percent'?'selected':''}>% Percentage</option></select></td><td><input class="commission-rate-input" data-rate-value="${esc(a.id)}" type="number" min="0" step="0.01" value="${Number(c.value||0)}"></td><td class="commission-final" data-rate-final="${esc(a.id)}">${money(c.final)}</td><td><select class="commission-active-select" data-rate-active="${esc(a.id)}"><option value="true" ${r?.active!==false?'selected':''}>Active</option><option value="false" ${r?.active===false?'selected':''}>Inactive</option></select></td><td><button class="action-btn edit" data-rate-save="${esc(a.id)}">${r?'Update':'Set Commission'}</button> <button class="action-btn delete" data-rate-delete="${esc(a.id)}" ${r?'':'disabled'}>Delete</button></td></tr>`}).join('')||'<tr><td colspan="8">No services/actions.</td></tr>';
  setMsg('commissionServiceMessage',`${rows.length} services/actions loaded. User ke liye individual commission set karein.`,'success');
}
function renderAll(){renderSummary();renderUserSelects();renderUsers();renderApps();renderPayments();renderScreenshots();renderLedger();renderServices()}

async function saveCommissionUser(){
  const edit=editingUid||$('commissionEditUid').value;
  const fullName=$('commissionFullName').value.trim(),mobile=$('commissionMobile').value.replace(/\D/g,''),email=$('commissionEmail').value.trim();
  const password=$('commissionPassword').value;
  if(!fullName||mobile.length!==10)return setMsg('commissionUserMessage','Full Name aur valid 10-digit Mobile required.','danger');
  let uid=edit;
  try{
    if(!uid){
      if(password.length<6)return setMsg('commissionUserMessage','New user ke liye minimum 6-character password required.','danger');
      const cred=await adminCreateUser(alias(mobile),password,{fullName,mobile,email,isCommissionUser:true});
      uid=cred.user.uid;
    }
    await setDoc(doc(db,'users',uid),{
      fullName,email,mobile,status:'Active',isCommissionUser:true,
      commissionStatus:$('commissionUserStatus').value||'Active',
      commissionCode:$('commissionCode').value.trim()||('CU'+mobile.slice(-6)),
      defaultCommissionType:$('commissionDefaultType').value||'fixed',
      defaultCommissionValue:Number($('commissionDefaultValue').value||0),
      commissionStartDate:$('commissionStartDate').value||'',
      commissionEndDate:$('commissionEndDate').value||'',
      commissionUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()
    },{merge:true});
    setMsg('commissionUserMessage','✅ Commission user saved / updated.','success');clearUserForm();
  }catch(e){setMsg('commissionUserMessage','❌ '+(e.code==='auth/email-already-in-use'?'Ye mobile/login already registered hai. Commission User ke liye alag mobile use karein.':e.message),'danger')}
}
function clearUserForm(){editingUid='';$('commissionEditUid').value='';['commissionFullName','commissionMobile','commissionEmail','commissionPassword','commissionCode','commissionStartDate','commissionEndDate'].forEach(id=>$(id).value='');$('commissionDefaultType').value='fixed';$('commissionDefaultValue').value='0';$('commissionUserStatus').value='Active';$('commissionSaveUser').textContent='Save Commission User'}
$('commissionSaveUser')?.addEventListener('click',saveCommissionUser);
$('commissionClearUser')?.addEventListener('click',clearUserForm);
$('commissionUserSearch')?.addEventListener('input',renderUsers);
$('commissionAppSearch')?.addEventListener('input',renderApps);
function updateCommissionBulkPending(){
  const uid=$('commissionServiceUser')?.value||'';
  if(!uid){setMsg('commissionServiceMessage','Commission User select karein.','info');return}
  let changed=0;
  document.querySelectorAll('#commissionServicesTable tr[data-rate-row]').forEach(row=>{
    const type=row.querySelector('[data-rate-type]')?.value||'fixed';
    const value=Number(row.querySelector('[data-rate-value]')?.value||0);
    const active=(row.querySelector('[data-rate-active]')?.value||'true')==='true';
    if(type!==row.dataset.origType || Math.abs(value-Number(row.dataset.origValue||0))>0.0001 || String(active)!==row.dataset.origActive) changed++;
  });
  setMsg('commissionServiceMessage',changed?`${changed} service commission changes Save karna baki hai.`:`Sab service commissions up to date hain.` ,changed?'warning':'success');
}

$('commissionServiceSearch')?.addEventListener('input',renderServices);
$('commissionServiceUser')?.addEventListener('change',renderServices);
$('commissionServicesTable')?.addEventListener('input',e=>{const id=e.target.dataset.rateValue;if(!id)return;const row=e.target.closest('tr'),a=actions.find(x=>x.id===id);const type=row.querySelector('[data-rate-type]').value,val=Number(e.target.value||0);row.querySelector('[data-rate-final]').textContent=money(calcFinal(a.serviceCharge,type,val).final);updateCommissionBulkPending()});
$('commissionServicesTable')?.addEventListener('change',e=>{if(e.target.dataset.rateType){const id=e.target.dataset.rateType,row=e.target.closest('tr'),a=actions.find(x=>x.id===id),val=Number(row.querySelector('[data-rate-value]').value||0);row.querySelector('[data-rate-final]').textContent=money(calcFinal(a.serviceCharge,e.target.value,val).final)}if(e.target.dataset.rateType||e.target.dataset.rateActive)updateCommissionBulkPending()});

async function saveSingleCommissionRate(uid, aid){
  const row=document.querySelector(`#commissionServicesTable tr[data-rate-row="${CSS.escape(aid)}"]`);
  const a=actions.find(x=>x.id===aid);
  if(!uid||!row||!a)return;
  const type=row.querySelector('[data-rate-type]')?.value||'fixed';
  const value=Math.max(0,Number(row.querySelector('[data-rate-value]')?.value||0));
  const active=(row.querySelector('[data-rate-active]')?.value||'true')==='true';
  await setDoc(doc(db,'commissionRates',rateId(uid,aid)),{
    userId:uid, actionId:aid, serviceId:a.serviceId, type, value, active, updatedAt:serverTimestamp()
  },{merge:true});
  setMsg('commissionServiceMessage',`✅ ${serviceName(a.serviceId)} / ${a.name||'Action'} commission saved.`,'success');
}

$('commissionSaveRates')?.addEventListener('click',async()=>{
  const uid=$('commissionServiceUser').value;if(!uid)return;
  const batch=writeBatch(db);let count=0;
  document.querySelectorAll('#commissionServicesTable tr[data-rate-row]').forEach(row=>{
    const aid=row.dataset.rateRow,a=actions.find(x=>x.id===aid);if(!a)return;
    const type=row.querySelector('[data-rate-type]').value,value=Number(row.querySelector('[data-rate-value]').value||0),active=row.querySelector('[data-rate-active]').value==='true';
    const changed=type!==row.dataset.origType || Math.abs(value-Number(row.dataset.origValue||0))>0.0001 || String(active)!==row.dataset.origActive;
    if(!changed)return;
    batch.set(doc(db,'commissionRates',rateId(uid,aid)),{userId:uid,actionId:aid,serviceId:a.serviceId,type,value,active,updatedAt:serverTimestamp()},{merge:true});count++;
  });
  if(!count){setMsg('commissionServiceMessage','Koi commission change nahi hua.','info');return}
  try{await batch.commit();setMsg('commissionServiceMessage',`✅ ${count} alag-alag service commissions ek saath save ho gaye. Current Service Charges unchanged.`,'success')}catch(e){setMsg('commissionServiceMessage','❌ '+e.message,'danger')}
});

$('commissionUsersList')?.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const id=b.dataset.cuEdit||b.dataset.cuToggle||b.dataset.cuDelete;const u=users.find(x=>x.id===id);if(!u)return;
  if(b.dataset.cuEdit){editingUid=id;$('commissionEditUid').value=id;$('commissionFullName').value=u.fullName||'';$('commissionMobile').value=u.mobile||'';$('commissionEmail').value=u.email||'';$('commissionCode').value=u.commissionCode||'';$('commissionDefaultType').value=u.defaultCommissionType||'fixed';$('commissionDefaultValue').value=u.defaultCommissionValue||0;$('commissionUserStatus').value=u.commissionStatus||'Active';$('commissionStartDate').value=u.commissionStartDate||'';$('commissionEndDate').value=u.commissionEndDate||'';$('commissionSaveUser').textContent='Update Commission User';return}
  if(b.dataset.cuToggle){await updateDoc(doc(db,'users',id),{commissionStatus:(u.commissionStatus||'Active')==='Active'?'Inactive':'Active',commissionUpdatedAt:serverTimestamp()});return}
  if(b.dataset.cuDelete){
    if(!confirm('Is Commission User ka profile + commission rates + ledger + login permanently delete karein?'))return;
    const batch=writeBatch(db);
    rates.filter(r=>r.userId===id).forEach(r=>batch.delete(doc(db,'commissionRates',r.id)));
    ledger.filter(l=>l.userId===id).forEach(l=>batch.delete(doc(db,'commissionLedger',l.id)));
    batch.delete(doc(db,'users',id));
    await batch.commit();
    await adminDeleteUser(id).catch(e=>console.warn('Auth user delete:',e.message));
    setMsg('commissionUserMessage','✅ Commission User data + login deleted.','success');
  }
});
$('commissionApplicationsTable')?.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.caSave||b.dataset.caDelete;if(!id)return;const a=apps.find(x=>x.id===id);if(!a)return;
  if(b.dataset.caSave){
    const status=document.querySelector(`[data-ca-status="${CSS.escape(id)}"]`)?.value||a.status||'Pending';
    const paymentStatus=document.querySelector(`[data-ca-payment="${CSS.escape(id)}"]`)?.value||a.paymentStatus||'Pending';
    await updateDoc(doc(db,'applications',id),{status,paymentStatus,updatedAt:serverTimestamp()});
    await setDoc(doc(db,'commissionLedger',id),{status:paymentStatus==='Paid'?'Paid':(status==='Rejected'?'Cancelled':'Pending'),paymentStatus,updatedAt:serverTimestamp()},{merge:true});
    return;
  }
  if(!confirm('Application aur uske related payment/proof/ledger records delete karein?'))return;
  const batch=writeBatch(db);
  payments.filter(x=>x.applicationDocId===id||x.applicationId===a.applicationId).forEach(x=>batch.delete(doc(db,'payments',x.id)));
  screenshots.filter(x=>x.applicationDocId===id||x.applicationId===a.applicationId).forEach(x=>batch.delete(doc(db,'paymentScreenshots',x.id)));
  ledger.filter(x=>x.applicationDocId===id||x.applicationId===a.applicationId||x.id===id).forEach(x=>batch.delete(doc(db,'commissionLedger',x.id)));
  batch.delete(doc(db,'publicApplicationStatus',a.applicationId||id));
  batch.delete(doc(db,'applications',id));
  await batch.commit();
});
$('commissionPaymentsTable')?.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const id=b.dataset.cpSave||b.dataset.cpDelete;if(!id)return;
  if(b.dataset.cpDelete){if(confirm('Payment record delete karein?'))await deleteDoc(doc(db,'payments',id));return}
  const status=document.querySelector(`[data-cp-status="${CSS.escape(id)}"]`)?.value||'Pending';
  await updateDoc(doc(db,'payments',id),{status,updatedAt:serverTimestamp()});
});
$('commissionScreenshotsList')?.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const id=b.dataset.csSave||b.dataset.csDelete;if(!id)return;
  if(b.dataset.csDelete){if(confirm('Payment screenshot record delete karein?'))await deleteDoc(doc(db,'paymentScreenshots',id));return}
  const status=document.querySelector(`[data-cs-status="${CSS.escape(id)}"]`)?.value||'Pending';
  await updateDoc(doc(db,'paymentScreenshots',id),{reviewStatus:status,updatedAt:serverTimestamp()});
});
$('commissionServicesTable')?.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  const uid=$('commissionServiceUser').value;
  const aid=b.dataset.rateSave||b.dataset.rateDelete;
  if(!uid||!aid)return;
  try{
    if(b.dataset.rateSave){
      b.disabled=true;
      await saveSingleCommissionRate(uid,aid);
      return;
    }
    if(b.dataset.rateDelete){
      if(!confirm('Is selected Commission User ke liye is service/action ka commission delete karein? Current Service Charge safe rahega.'))return;
      await deleteDoc(doc(db,'commissionRates',rateId(uid,aid)));
      setMsg('commissionServiceMessage','✅ Commission deleted. Current Service Charge me koi change nahi hua.','success');
    }
  }catch(err){
    setMsg('commissionServiceMessage','❌ '+err.message,'danger');
  }finally{
    b.disabled=false;
  }
});
$('commissionLedgerTable')?.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.ledgerSave||b.dataset.ledgerDelete;if(!id)return;if(b.dataset.ledgerDelete){if(confirm('Ledger entry delete karein?'))await deleteDoc(doc(db,'commissionLedger',id));return}const s=document.querySelector(`[data-ledger-status="${CSS.escape(id)}"]`)?.value||'Pending';await updateDoc(doc(db,'commissionLedger',id),{status:s,updatedAt:serverTimestamp()})});

function subscribe(){
  if(initialized)return; initialized=true;
  const listen=(name,setter)=>unsubs.push(onSnapshot(collection(db,name),snap=>{setter(snap.docs.map(d=>({id:d.id,...d.data()})));renderAll()},e=>console.error('Commission '+name,e)));
  listen('users',x=>users=x);listen('applications',x=>apps=x);listen('payments',x=>payments=x);listen('paymentScreenshots',x=>screenshots=x);listen('services',x=>services=x);listen('serviceActions',x=>actions=x);listen('commissionRates',x=>rates=x);listen('commissionLedger',x=>ledger=x);
}
const page=$('commissionpanelPage');
if(page){
  new MutationObserver(()=>{if(page.classList.contains('active'))subscribe()}).observe(page,{attributes:true,attributeFilter:['class']});
  if(page.classList.contains('active'))subscribe();
}
document.querySelector('[data-page="commissionpanel"]')?.addEventListener('click',subscribe);
