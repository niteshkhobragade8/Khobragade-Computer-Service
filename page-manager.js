
import {db} from './firebase-config.js';
import {doc,getDoc,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
const $=id=>document.getElementById(id), ref=()=>doc(db,'pageContent',$('pageKey').value);
function msg(t,c='info'){let e=$('pageManagerMessage');if(e){e.textContent=t;e.className='settings-message '+c}}
async function load(){try{let s=await getDoc(ref()),d=s.exists()?s.data():{};$('pageTitle').value=d.title||'';$('pageSubtitle').value=d.subtitle||'';$('pageDescriptionAdmin').value=d.description||'';$('pageStatus').value=d.status||'Published';msg(s.exists()?'Saved page content loaded.':'Default public design is active.','info')}catch(e){msg(e.message,'error')}}
async function save(){try{await setDoc(ref(),{title:$('pageTitle').value.trim(),subtitle:$('pageSubtitle').value.trim(),description:$('pageDescriptionAdmin').value.trim(),status:$('pageStatus').value,updatedAt:serverTimestamp()},{merge:true});msg('Page updated successfully. Public website will update automatically.','success')}catch(e){msg(e.message,'error')}}
async function del(){if(!confirm('Custom page heading/details clear karna hai? Default design wapas dikhega.'))return;try{await deleteDoc(ref());$('pageTitle').value='';$('pageSubtitle').value='';$('pageDescriptionAdmin').value='';msg('Custom page content cleared.','success')}catch(e){msg(e.message,'error')}}
$('pageKey')?.addEventListener('change',load);$('savePageContent')?.addEventListener('click',save);$('deletePageContent')?.addEventListener('click',del);window.addEventListener('DOMContentLoaded',load);
