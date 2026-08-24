import {db} from './supabase-app.js';
import {collection,onSnapshot,doc,updateDoc,deleteDoc,getDocs,serverTimestamp,writeBatch,query,where} from './supabase-db.js';
import {adminDeleteUser} from './supabase-auth.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let users=[],apps=[];
const date=v=>{try{return(v?.toDate?v.toDate():new Date(v)).toLocaleDateString('en-IN')}catch{return'—'}};
function render(){
 const q=($('userSearch')?.value||'').toLowerCase(),tb=$('usersTable');if(!tb)return;
 const rows=users.filter(u=>u.isCommissionUser!==true).filter(u=>!q||[u.fullName,u.mobile,u.email].join(' ').toLowerCase().includes(q));
 tb.innerHTML=rows.length?rows.map(u=>`<tr><td><b>${esc(u.fullName||'—')}</b></td><td>${esc(u.mobile||'—')}</td><td>${esc(u.email||'—')}</td><td>${apps.filter(a=>a.userId===u.id||a.mobile===u.mobile).length}</td><td>${esc(u.status||'Active')}</td><td>${date(u.createdAt)}</td><td><div class="table-actions"><button class="action-btn edit" data-toggle="${u.id}">${(u.status||'Active')==='Active'?'Disable':'Enable'}</button><button class="action-btn danger" data-delete-user="${u.id}">Delete User</button></div></td></tr>`).join(''):'<tr><td colspan="7">No users found.</td></tr>';
}
onSnapshot(collection(db,'users'),s=>{users=s.docs.map(d=>({id:d.id,...d.data()}));render()});
onSnapshot(collection(db,'applications'),s=>{apps=s.docs.map(d=>({id:d.id,...d.data()}));render()});
$('userSearch')?.addEventListener('input',render);
async function commitDeletes(refs){
 for(let i=0;i<refs.length;i+=400){const batch=writeBatch(db);refs.slice(i,i+400).forEach(ref=>batch.delete(ref));await batch.commit();}
}
async function deleteUserPortalData(u,button){
 if(!confirm(`Delete ${u.fullName||u.mobile||'this user'} permanently?\n\nThis will delete the Supabase login, customer profile, related applications, payment records and public status.`))return;
 const original=button.textContent;button.disabled=true;button.textContent='Deleting...';
 try{
  const [appSnap,paySnap,statusSnap]=await Promise.all([
   getDocs(query(collection(db,'applications'),where('userId','==',u.id))),
   getDocs(query(collection(db,'payments'),where('userId','==',u.id))),
   getDocs(collection(db,'publicApplicationStatus'))
  ]);
  const relatedApps=appSnap.docs;
  const appIds=new Set(relatedApps.map(d=>d.id));
  const relatedPays=paySnap.docs;
  const relatedStatuses=statusSnap.docs.filter(d=>appIds.has(d.id)||appIds.has(d.data()?.applicationId));
  await commitDeletes([...relatedPays.map(d=>d.ref),...relatedStatuses.map(d=>d.ref),...relatedApps.map(d=>d.ref),doc(db,'users',u.id)]);
  await adminDeleteUser(u.id).catch(err=>console.warn('Auth delete:',err.message));
  alert('User + login deleted successfully.');
 }catch(e){console.error('User delete error',e);alert('Delete failed: '+(e?.message||'Unknown database error'));button.disabled=false;button.textContent=original;}
}
$('usersTable')?.addEventListener('click',async e=>{
 const del=e.target.closest('[data-delete-user]');if(del){const u=users.find(x=>x.id===del.dataset.deleteUser);if(u)await deleteUserPortalData(u,del);return;}
 const b=e.target.closest('[data-toggle]');if(!b)return;const u=users.find(x=>x.id===b.dataset.toggle);if(!u)return;
 await updateDoc(doc(db,'users',u.id),{status:(u.status||'Active')==='Active'?'Disabled':'Active',updatedAt:serverTimestamp()});
});
