import {getDatabase,collection,onSnapshot,doc,updateDoc,deleteDoc,serverTimestamp} from './supabase-db.js';
const db=getDatabase();
import {adminDeleteUser} from './supabase-auth.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let users=[],apps=[];
const date=v=>{try{return(v?.toDate?v.toDate():new Date(v)).toLocaleDateString('en-IN')}catch{return'—'}};
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
function render(){
 const q=($('userSearch')?.value||'').toLowerCase(),tb=$('usersTable');if(!tb)return;
 const rows=users.filter(u=>!q||[u.fullName,u.mobile,u.email].join(' ').toLowerCase().includes(q));
 tb.innerHTML=rows.length?rows.map(u=>`<tr><td><b>${esc(u.fullName||'—')}</b></td><td>${esc(u.mobile||'—')}</td><td>${esc(u.email||'—')}</td><td>${apps.filter(a=>a.userId===u.id||a.mobile===u.mobile).length}</td><td>${esc(u.status||'Active')}</td><td>${date(u.createdAt)}</td><td><div class="table-actions"><button class="action-btn edit" data-toggle="${u.id}">${(u.status||'Active')==='Active'?'Disable':'Enable'}</button><button class="action-btn danger" data-delete-user="${u.id}">Delete User</button></div></td></tr>`).join(''):'<tr><td colspan="7">No users found.</td></tr>';
}
onSnapshot(collection(db,'users'),s=>{users=s.docs.map(d=>({id:d.id,...d.data()}));render()});
onSnapshot(collection(db,'applications'),s=>{apps=s.docs.map(d=>({id:d.id,...d.data()}));render()});
$('userSearch')?.addEventListener('input',render);
async function deleteUserCompletely(u,button){
 if(!confirm(`Permanently delete ${u.fullName||u.mobile||'this user'}?

This cannot be undone.`))return;
 const original=button.textContent;button.disabled=true;button.textContent='Deleting...';
 try{
  if(isUuid(u.id)) await adminDeleteUser(u.id);
  else await deleteDoc(doc(db,'users',u.id));
  alert('User permanently deleted.');
 }catch(e){console.error(e);alert(e.message||'User delete failed.');button.disabled=false;button.textContent=original;}
}
$('usersTable')?.addEventListener('click',async e=>{
 const del=e.target.closest('[data-delete-user]');if(del){const u=users.find(x=>x.id===del.dataset.deleteUser);if(u)await deleteUserCompletely(u,del);return;}
 const b=e.target.closest('[data-toggle]');if(!b)return;const u=users.find(x=>x.id===b.dataset.toggle);if(!u)return;
 await updateDoc(doc(db,'users',u.id),{status:(u.status||'Active')==='Active'?'Disabled':'Active',updatedAt:serverTimestamp()});
});
