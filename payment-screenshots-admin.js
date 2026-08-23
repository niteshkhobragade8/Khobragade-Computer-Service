import { db } from './firebase-config.js';
import { collection, doc, getDocs, onSnapshot, orderBy, query, where, limit, updateDoc, serverTimestamp } from './supabase-firestore.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let proofs=[];
function when(v){try{if(v?.toDate)return v.toDate().toLocaleString();if(v?.seconds)return new Date(v.seconds*1000).toLocaleString();return v?new Date(v).toLocaleString():'—'}catch{return'—'}}
function render(){
 const term=($('paymentProofSearch')?.value||'').toLowerCase().trim();
 const rows=proofs.filter(x=>!term||`${x.applicationId||''} ${x.txnid||''} ${x.userName||''} ${x.mobile||''}`.toLowerCase().includes(term));
 if($('proofTotal'))$('proofTotal').textContent=proofs.length;
 if($('proofPending'))$('proofPending').textContent=proofs.filter(x=>(x.reviewStatus||'Pending')==='Pending').length;
 if($('proofApproved'))$('proofApproved').textContent=proofs.filter(x=>x.reviewStatus==='Approved').length;
 if($('proofRejected'))$('proofRejected').textContent=proofs.filter(x=>x.reviewStatus==='Rejected').length;
 const list=$('paymentProofList'); if(!list)return;
 if(!rows.length){list.innerHTML='<div class="empty-state">No payment screenshots found.</div>';return;}
 list.innerHTML=rows.map(x=>`<article class="content-card"><div class="content-card-head"><div><span class="status-badge ${esc((x.reviewStatus||'Pending').toLowerCase())}">${esc(x.reviewStatus||'Pending')}</span></div><small>${esc(when(x.createdAt))}</small></div>${x.screenshotUrl?`<a href="${esc(x.screenshotUrl)}" target="_blank" rel="noopener"><img src="${esc(x.screenshotUrl)}" alt="Payment proof" style="width:100%;max-height:300px;object-fit:contain;border-radius:14px;background:#f8fafc;margin:10px 0"></a>`:''}<h3>${esc(x.applicationId||'Application')}</h3><p><b>Transaction:</b> ${esc(x.txnid||'—')}<br><b>Amount:</b> ₹${esc(x.amount||'—')}<br><b>Customer:</b> ${esc(x.userName||'—')} ${x.mobile?`(${esc(x.mobile)})`:''}</p><div class="card-actions"><a class="action-btn edit" href="${esc(x.screenshotUrl||'#')}" target="_blank" rel="noopener">🔍 Preview</a><button class="action-btn edit" data-proof-approve="${esc(x.id)}">✅ Approve</button><button class="action-btn delete" data-proof-reject="${esc(x.id)}">❌ Reject</button></div></article>`).join('');
}
$('paymentProofSearch')?.addEventListener('input',render);
const q=query(collection(db,'paymentScreenshots'),orderBy('createdAt','desc'));
onSnapshot(q,s=>{proofs=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>{console.error(e);const list=$('paymentProofList');if(list)list.innerHTML='<div class="empty-state">Payment screenshots load nahi ho pa rahe. Firestore quota/rules check karein.</div>'});

async function findApplication(proof){
 if(proof.applicationDocId){return doc(db,'applications',proof.applicationDocId)}
 if(!proof.applicationId)return null;
 const s=await getDocs(query(collection(db,'applications'),where('applicationId','==',proof.applicationId),limit(1)));
 return s.empty?null:s.docs[0].ref;
}
$('paymentProofList')?.addEventListener('click',async e=>{
 const approve=e.target.closest('[data-proof-approve]'); const reject=e.target.closest('[data-proof-reject]');
 const id=approve?.dataset.proofApprove||reject?.dataset.proofReject; if(!id)return;
 const proof=proofs.find(x=>x.id===id); if(!proof)return;
 const btn=approve||reject; btn.disabled=true;
 try{
  if(reject){await updateDoc(doc(db,'paymentScreenshots',id),{reviewStatus:'Rejected',reviewedAt:serverTimestamp()});return;}
  if(!confirm(`Approve payment proof?\nApplication: ${proof.applicationId||'—'}\nTransaction: ${proof.txnid||'—'}`))return;
  const appRef=await findApplication(proof);
  if(appRef)await updateDoc(appRef,{paymentStatus:'Paid',updatedAt:serverTimestamp()});
  if(proof.txnid){try{await updateDoc(doc(db,'payments',proof.txnid),{status:'Paid',paymentStatus:'Paid',updatedAt:serverTimestamp()})}catch(err){console.warn('Payment record update skipped:',err)}}
  await updateDoc(doc(db,'paymentScreenshots',id),{reviewStatus:'Approved',reviewedAt:serverTimestamp()});
  alert('Payment proof approved. Matching application/payment Paid update kiya gaya.');
 }catch(err){console.error(err);alert('Approve/Reject failed. Firestore quota ya permissions check karein.');}
 finally{btn.disabled=false;}
});
