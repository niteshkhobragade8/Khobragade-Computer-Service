import {moveToTrash} from './trash.js';

import {db} from './firebase-config.js';
import {doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
const $=id=>document.getElementById(id);
const names={home:'Home',services:'Services',yojana:'Yojana',divyang:'Divyang',documents:'Documents',contact:'Contact'};
const ref=k=>doc(db,'pageContent',k||$('pageKey').value);
function msg(t,c='info'){const e=$('pageManagerMessage');if(e){e.textContent=t;e.className='settings-message '+c}}
async function load(key){
  key=key||$('pageKey')?.value||'home';
  if($('pageKey'))$('pageKey').value=key;
  if($('pageEditorHeading'))$('pageEditorHeading').textContent='Edit '+names[key]+' Page';
  try{
    const s=await getDoc(ref(key)),d=s.exists()?s.data():{};
    $('pageTitle').value=d.title||'';$('pageSubtitle').value=d.subtitle||'';$('pageDescriptionAdmin').value=d.description||'';$('pageStatus').value=d.status||'Published';
    msg(s.exists()?names[key]+' saved content loaded.':names[key]+' default content active.','info');
  }catch(e){msg(e.message,'error')}
}
async function save(){
  const key=$('pageKey').value;
  try{
    await setDoc(ref(key),{title:$('pageTitle').value.trim(),subtitle:$('pageSubtitle').value.trim(),description:$('pageDescriptionAdmin').value.trim(),status:$('pageStatus').value,updatedAt:serverTimestamp()},{merge:true});
    msg(names[key]+' page updated. Public website automatically update hogi.','success');
  }catch(e){msg(e.message,'error')}
}
async function clearPage(key){
  key=key||$('pageKey').value;
  if(!confirm(names[key]+' ka custom page content clear karna hai?'))return;
  try{
    const s=await getDoc(ref(key));
    if(s.exists()) await moveToTrash('pageContent',key,{id:key,...s.data()});
    if($('pageKey').value===key){$('pageTitle').value='';$('pageSubtitle').value='';$('pageDescriptionAdmin').value='';$('pageStatus').value='Published'}
    msg(names[key]+' custom content moved to Recycle Bin. Default content active.','success');
  }catch(e){msg(e.message,'error')}
}
$('pageKey')?.addEventListener('change',()=>load());
$('savePageContent')?.addEventListener('click',save);
$('deletePageContent')?.addEventListener('click',()=>clearPage());
document.querySelectorAll('.edit-public-page').forEach(b=>b.addEventListener('click',()=>{load(b.dataset.key);document.querySelector('#pageEditorHeading')?.scrollIntoView({behavior:'smooth',block:'center'})}));
document.querySelectorAll('.clear-public-page').forEach(b=>b.addEventListener('click',()=>clearPage(b.dataset.key)));
window.addEventListener('DOMContentLoaded',()=>load('home'));
