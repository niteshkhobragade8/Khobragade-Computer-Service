import {db} from './supabase-app.js';
import {collection,onSnapshot,doc,deleteDoc} from './supabase-db.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const date=v=>{
 try{
  if(!v)return'—';
  let d;
  if(v?.toDate)d=v.toDate();
  else if(typeof v==='string'||typeof v==='number')d=new Date(v);
  else if(typeof v==='object'){
   const sec=Number(v.seconds??v._seconds??v.sec??NaN);
   const nano=Number(v.nanoseconds??v._nanoseconds??0);
   if(Number.isFinite(sec))d=new Date(sec*1000+Math.floor(nano/1e6));
   else if(v.iso)d=new Date(v.iso);
   else if(v.date)d=new Date(v.date);
   else if(v.value)d=new Date(v.value);
  }
  if(!d||Number.isNaN(d.getTime()))return'—';
  return d.toLocaleString('en-IN');
 }catch{return'—'}
};
let rows=[];
function render(data=rows){const tb=$('paymentsTable');if(!tb)return;rows=[...data];const timeValue=v=>{
 if(!v)return 0;
 if(v?.toDate)return v.toDate().getTime();
 if(typeof v==='object'){
  const sec=Number(v.seconds??v._seconds??NaN);
  if(Number.isFinite(sec))return sec*1000;
 }
 const d=new Date(v);
 return Number.isNaN(d.getTime())?0:d.getTime();
};
const sorted=[...rows].sort((a,b)=>timeValue(b.createdAt||b.paymentDate)-timeValue(a.createdAt||a.paymentDate));tb.innerHTML=sorted.length?sorted.map(x=>`<tr><td>${esc(x.paymentId||x.id)}</td><td>${esc(x.applicationId||'—')}</td><td>₹${Number(x.amount||0).toLocaleString('en-IN')}</td><td><span class="status-pill ${String(x.status||'pending').toLowerCase()}">${esc(x.status||'Pending')}</span></td><td>${esc(x.transactionReference||x.reference||'—')}</td><td>${date(x.createdAt||x.paymentDate)}</td><td><button class="action-btn danger" data-delete-payment="${esc(x.id)}">Delete</button></td></tr>`).join(''):'<tr><td colspan="7">No payment records.</td></tr>';const paid=rows.filter(x=>x.status==='Paid'||x.status==='Success');$('paymentTotalCollection')&&($('paymentTotalCollection').textContent='₹'+paid.reduce((s,x)=>s+Number(x.amount||0),0).toLocaleString('en-IN'));$('paymentSuccessCount')&&($('paymentSuccessCount').textContent=paid.length);$('paymentPendingCount')&&($('paymentPendingCount').textContent=rows.filter(x=>x.status==='Pending').length);$('paymentFailedCount')&&($('paymentFailedCount').textContent=rows.filter(x=>x.status==='Failed').length)}
onSnapshot(collection(db,'payments'),s=>render(s.docs.map(d=>({id:d.id,...d.data()}))));
$('paymentsTable')?.addEventListener('click',async e=>{const b=e.target.closest('[data-delete-payment]');if(!b)return;const item=rows.find(x=>x.id===b.dataset.deletePayment);if(!item)return;const ref=item.paymentId||item.transactionReference||item.id;if(!confirm(`Delete transaction ${ref}?\n\nThis will permanently remove this transaction record from Admin > Payments / PayU.`))return;
const oldRows=[...rows];rows=rows.filter(x=>x.id!==item.id);render(rows);
try{await deleteDoc(doc(db,'payments',item.id))}
catch(err){console.error(err);rows=oldRows;render(rows);alert('Transaction delete failed. Please check admin access and try again.')}});
