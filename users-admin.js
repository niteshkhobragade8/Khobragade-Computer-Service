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

 // Instant Admin UI removal — database cleanup continues immediately in background.
 const oldUsers=[...users],oldApps=[...apps];
 users=users.filter(x=>x.id!==u.id);
 apps=apps.filter(a=>a.userId!==u.id&&a.mobile!==u.mobile);
 render();

 try{
  const [appSnap,paySnap]=await Promise.all([
   getDocs(query(collection(db,'applications'),where('userId','==',u.id))),
   getDocs(query(collection(db,'payments'),where('userId','==',u.id)))
  ]);
  const relatedApps=appSnap.docs;
  const relatedPays=paySnap.docs;

  // publicApplicationStatus document ID is the public applicationId.
  // Delete it directly; do NOT scan the whole status collection.
  const statusRefs=relatedApps
    .map(d=>d.data()?.applicationId)
    .filter(Boolean)
    .map(applicationId=>doc(db,'publicApplicationStatus',String(applicationId)));

  await Promise.all([
    commitDeletes([
      ...relatedPays.map(d=>d.ref),
      ...statusRefs,
      ...relatedApps.map(d=>d.ref),
      doc(db,'users',u.id)
    ]),
    adminDeleteUser(u.id).catch(err=>console.warn('Auth delete:',err.message))
  ]);
 }catch(e){
  console.error('User delete error',e);
  users=oldUsers;apps=oldApps;render();
  alert('Delete failed: '+(e?.message||'Unknown database error'));
 }
}
$('usersTable')?.addEventListener('click',async e=>{
 const del=e.target.closest('[data-delete-user]');if(del){const u=users.find(x=>x.id===del.dataset.deleteUser);if(u)await deleteUserPortalData(u,del);return;}
 const b=e.target.closest('[data-toggle]');if(!b)return;const u=users.find(x=>x.id===b.dataset.toggle);if(!u)return;
 await updateDoc(doc(db,'users',u.id),{status:(u.status||'Active')==='Active'?'Disabled':'Active',updatedAt:serverTimestamp()});
});
