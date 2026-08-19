import {auth,db,storage} from '../../firebase-config.js';
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,updatePassword} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,onSnapshot,query,where,orderBy,serverTimestamp,limit} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {ref,uploadBytes,getDownloadURL} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js';
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const alias=mobile=>`m${String(mobile||'').replace(/\D/g,'')}@login.kcsc.local`;
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const statusClass=s=>String(s||'').toLowerCase().replace(/\s+/g,'-');
const appId=()=>`KCSC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
let currentUser=null,currentProfile=null;
function showMsg(id,text,ok=false){const e=$(id);if(!e)return;e.textContent=text;e.className='msg show '+(ok?'ok':'err')}
async function profile(uid){const s=await getDoc(doc(db,'users',uid));return s.exists()?{id:s.id,...s.data()}:null}
function nav(){const el=$('navAuth');if(!el)return;if(currentUser)el.innerHTML=`<a href="services.html">Services</a><a href="track.html">Track</a><a href="account.html">My Account</a><button onclick="Portal.logout()">Logout</button>`;else el.innerHTML=''}
onAuthStateChanged(auth,async u=>{currentUser=u;currentProfile=u?await profile(u.uid):null;nav();if(u)memberChrome(currentProfile);document.dispatchEvent(new CustomEvent('portal-auth',{detail:{user:u,profile:currentProfile}}))});
async function register(data){const mobile=String(data.mobile||'').replace(/\D/g,'');if(mobile.length!==10)throw new Error('10-digit mobile number required.');if(!data.fullName?.trim())throw new Error('Full Name required.');if((data.password||'').length<6)throw new Error('Password minimum 6 characters.');if(data.password!==data.confirmPassword)throw new Error('Password aur Confirm Password match nahi karte.');const c=await createUserWithEmailAndPassword(auth,alias(mobile),data.password);await setDoc(doc(db,'users',c.user.uid),{fullName:data.fullName.trim(),email:(data.email||'').trim(),mobile,status:'Active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return c.user}
async function login(mobile,password){const m=String(mobile||'').replace(/\D/g,'');if(m.length!==10)throw new Error('10-digit mobile number required.');const c=await signInWithEmailAndPassword(auth,alias(m),password);const p=await profile(c.user.uid);if(p?.status==='Disabled'){await signOut(auth);throw new Error('Account disabled. Contact support.')}return c.user}
async function logout(){await signOut(auth);location.href='index.html'}
async function services(){const s=await getDocs(collection(db,'services'));return s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.status||'Published')==='Published')}
async function actions(serviceId){const s=await getDocs(query(collection(db,'serviceActions'),where('serviceId','==',serviceId)));return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>Number(a.order||0)-Number(b.order||0))}
async function fields(actionId){const s=await getDocs(query(collection(db,'formFields'),where('actionId','==',actionId)));return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>Number(a.order||0)-Number(b.order||0))}
async function uploadFile(file,path){const r=ref(storage,path);await uploadBytes(r,file);return getDownloadURL(r)}
async function createApplication({service,action,formData,files:uploadList}){if(!auth.currentUser)throw new Error('Please login first.');const profileData=await profile(auth.currentUser.uid);const id=appId();const uploaded=[];for(const item of uploadList||[]){if(!item.file)continue;const url=await uploadFile(item.file,`applications/${auth.currentUser.uid}/${id}/${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`);uploaded.push({label:item.label,name:item.file.name,url})}const amount=Number(action.serviceCharge||0);const appRef=doc(db,'applications',id);await setDoc(appRef,{applicationId:id,userId:auth.currentUser.uid,userName:profileData?.fullName||'',mobile:profileData?.mobile||'',email:profileData?.email||'',serviceId:service.id,serviceName:service.name||'',actionId:action.id,actionName:action.name||'',amount,officialFee:Number(action.officialFee||0),paymentStatus:amount>0?'Pending':'Paid',status:amount>0?'Pending Payment':'Pending',formData,documents:uploaded,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});await setDoc(doc(db,'publicApplicationStatus',id),{applicationId:id,mobileLast4:(profileData?.mobile||'').slice(-4),serviceName:service.name||'',actionName:action.name||'',paymentStatus:amount>0?'Pending':'Paid',status:amount>0?'Pending Payment':'Pending',updatedAt:serverTimestamp()});return {docId:id,applicationId:id,amount}}
async function payuSettings(){const s=await getDoc(doc(db,'settings','payu'));return s.exists()?s.data():{}}
async function startPayment(app){if(app.amount<=0)return {free:true};const s=await payuSettings();if(!s.backendUrl)throw new Error('PayU abhi connect nahi hai. Admin se payment settings complete karein.');const token=await auth.currentUser.getIdToken();const r=await fetch(s.backendUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({applicationDocId:app.docId,applicationId:app.applicationId})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||'Payment initialization failed.');if(j.redirectUrl){location.href=j.redirectUrl;return}if(j.action&&j.fields){const f=document.createElement('form');f.method='POST';f.action=j.action;Object.entries(j.fields).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;f.appendChild(i)});document.body.appendChild(f);f.submit();return}throw new Error('Invalid payment response from backend.')}
async function myApplications(){if(!auth.currentUser)return[];const s=await getDocs(query(collection(db,'applications'),where('userId','==',auth.currentUser.uid)));return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))}
async function trackPublic(applicationId,mobile){const s=await getDoc(doc(db,'publicApplicationStatus',applicationId.trim()));if(!s.exists())return null;const x=s.data();if(x.mobileLast4!==String(mobile||'').replace(/\D/g,'').slice(-4))return null;return x}

const memberPages={
 'account.html':{title:'Dashboard',key:'dashboard'},
 'services.html':{title:'All Services',key:'services'},
 'apply.html':{title:'New Application',key:'new'},
 'my-applications.html':{title:'My Applications',key:'applications'},
 'payments.html':{title:'Payments',key:'payments'},
 'track.html':{title:'Track Application',key:'track'},
 'my-documents.html':{title:'My Documents',key:'documents'},
 'downloads.html':{title:'Downloads',key:'downloads'},
 'notifications.html':{title:'Notifications',key:'notifications'},
 'profile.html':{title:'My Profile',key:'profile'},
 'reupload.html':{title:'Upload Documents',key:'applications'}
};
function memberInitials(name='User'){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'U'}
function memberChrome(profileData){
 const file=(location.pathname.split('/').pop()||'index.html').toLowerCase(),meta=memberPages[file];
 if(!meta||!currentUser)return;
 document.body.classList.add('member-dashboard','member-pro-layout');
 document.getElementById('memberProChrome')?.remove();
 const name=profileData?.fullName||'User';
 const navItems=[
  ['dashboard','🏠','Dashboard','account.html'],['services','🧰','All Services','services.html'],['new','➕','New Application','services.html'],['applications','📋','My Applications','my-applications.html'],['payments','💳','Payments','payments.html'],['track','🔎','Track Application','track.html'],['documents','📁','My Documents','my-documents.html'],['downloads','📥','Downloads','downloads.html'],['notifications','🔔','Notifications','notifications.html'],['profile','👤','Profile','profile.html'],['help','💬','Help / Support','../contact.html']
 ];
 const root=document.createElement('div');root.id='memberProChrome';
 root.innerHTML=`<aside class="member-pro-sidebar"><a class="member-pro-brand" href="account.html"><span class="member-pro-logo">K</span><span class="member-pro-brand-copy"><b>Khobragade Computer Service Centre</b><small>SECURE USER PORTAL</small></span></a><div class="member-pro-nav-label">MY ACCOUNT</div><nav class="member-pro-nav">${navItems.map(([key,icon,label,href])=>`<a class="${meta.key===key?'active':''}" href="${href}"><span class="member-pro-nav-icon">${icon}</span><span class="member-pro-nav-text">${label}</span>${key==='notifications'?'<span id="memberNotifCount" class="member-pro-nav-count" hidden>0</span>':''}</a>`).join('')}</nav><div class="member-pro-sidebar-bottom"><div class="member-pro-security"><span>🛡️</span><div><b>Secure Account</b><br>Protected application portal</div></div></div></aside><header class="member-pro-header"><div class="member-pro-header-inner"><button class="member-pro-mobile-toggle" type="button" aria-label="Open menu">☰</button><div class="member-pro-page-meta"><small>USER PORTAL</small><strong>${esc(meta.title)}</strong></div><div class="member-pro-head-actions"><a class="member-pro-icon-btn" href="notifications.html" title="Notifications">🔔<span id="memberHeadNotif" class="member-pro-badge" hidden>0</span></a><div class="member-pro-user"><span class="member-pro-avatar">${esc(memberInitials(name))}</span><span class="member-pro-user-copy"><b>${esc(name)}</b><small>Member Account</small></span></div><button class="member-pro-logout" type="button">↪ Logout</button></div></div></header>`;
 document.body.prepend(root);
 const toggle=root.querySelector('.member-pro-mobile-toggle'),closeMenu=()=>document.body.classList.remove('member-menu-open');
 toggle?.addEventListener('click',()=>document.body.classList.toggle('member-menu-open'));
 root.querySelector('.member-pro-logout')?.addEventListener('click',logout);
 root.querySelectorAll('.member-pro-nav a').forEach(a=>a.addEventListener('click',closeMenu));
 document.body.addEventListener('click',e=>{if(document.body.classList.contains('member-menu-open')&&!root.querySelector('.member-pro-sidebar').contains(e.target)&&!toggle.contains(e.target))closeMenu()});
 myApplications().then(rows=>{const n=rows.filter(x=>['Need Documents','Processing','Completed'].includes(x.status)).length;for(const id of ['memberNotifCount','memberHeadNotif']){const el=document.getElementById(id);if(el&&n){el.textContent=n>99?'99+':String(n);el.hidden=false}}}).catch(()=>{});
}

window.Portal={register,login,logout,services,actions,fields,createApplication,startPayment,myApplications,trackPublic,money,statusClass,esc,memberChrome,get user(){return currentUser},get profile(){return currentProfile}};
