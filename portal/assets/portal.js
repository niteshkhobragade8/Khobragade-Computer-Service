import {auth,db} from './portal-firebase.js';
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,updatePassword} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,onSnapshot,query,where,orderBy,serverTimestamp,limit} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {MASTER_SERVICES,actionId,fieldsFor} from './master-catalog.js?v=20260821-final24r3';
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const alias=mobile=>`m${String(mobile||'').replace(/\D/g,'')}@login.kcsc.local`;
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const statusClass=s=>String(s||'').toLowerCase().replace(/\s+/g,'-');
const appId=()=>`KCSC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
let currentUser=null,currentProfile=null,currentPortalCms=null;
let adminNotificationUnsub=null;
let resolveAuthReady;
const authReady=new Promise(resolve=>{resolveAuthReady=resolve});
function showMsg(id,text,ok=false){const e=$(id);if(!e)return;e.textContent=text;e.className='msg show '+(ok?'ok':'err')}
async function profile(uid){const s=await getDoc(doc(db,'users',uid));return s.exists()?{id:s.id,...s.data()}:null}
const DEFAULT_PROFILE_FIELDS=[
 {key:'fullName',label:'Full Name',type:'text',required:true,visible:true,order:10},
 {key:'email',label:'Email',type:'email',required:false,visible:true,order:20},
 {key:'mobile',label:'Mobile Number',type:'tel',required:true,visible:true,order:30,locked:true},
 {key:'dob',label:'Date of Birth',type:'date',required:false,visible:true,order:40},
 {key:'gender',label:'Gender',type:'select',options:['Male','Female','Other'],required:false,visible:true,order:50},
 {key:'address',label:'Full Address',type:'textarea',required:false,visible:true,order:60},
 {key:'villageCity',label:'Village / City',type:'text',required:false,visible:true,order:70},
 {key:'taluka',label:'Taluka',type:'text',required:false,visible:true,order:80},
 {key:'district',label:'District',type:'text',required:false,visible:true,order:90},
 {key:'state',label:'State',type:'text',required:false,visible:true,order:100},
 {key:'pinCode',label:'PIN Code',type:'text',required:false,visible:true,order:110}
];
const DEFAULT_MEMBER_MENU=[
 {key:'dashboard',label:'Dashboard',icon:'🏠',href:'account.html',visible:true,order:10},
 {key:'services',label:'Services',icon:'🧰',visible:true,order:20,children:[
  {key:'services',label:'All Services',href:'services.html',order:10},
  {key:'new',label:'New Application',href:'services.html',order:20},
  {key:'applications',label:'My Applications',href:'my-applications.html',order:30},
  {key:'track',label:'Track Application',href:'track.html',order:40}
 ]},
 {key:'payments',label:'Payments',icon:'💳',href:'payments.html',visible:true,order:30},
 {key:'documents',label:'Documents',icon:'📁',visible:true,order:40,children:[
  {key:'documents',label:'My Documents',href:'my-documents.html',order:10},
  {key:'downloads',label:'Downloads',href:'downloads.html',order:20}
 ]},
 {key:'notifications',label:'Notifications',icon:'🔔',href:'notifications.html',visible:true,order:50},
 {key:'profile',label:'Profile',icon:'👤',href:'profile.html',visible:true,order:60},
 {key:'help',label:'Help / Support',icon:'💬',href:'index.html#support',visible:true,order:70}
];
async function portalCms(){if(currentPortalCms)return currentPortalCms;try{const snap=await getDoc(doc(db,'settings','userPortalCms'));currentPortalCms=snap.exists()?snap.data():{};}catch(_){currentPortalCms={};}return currentPortalCms}
function mergedProfileFields(cms={}){const rows=Array.isArray(cms.profileFields)&&cms.profileFields.length?cms.profileFields:DEFAULT_PROFILE_FIELDS;return [...rows].filter(x=>x.visible!==false).sort((a,b)=>Number(a.order||0)-Number(b.order||0))}
function profileValueByKey(p,key){return p?.[key]??p?.extraProfile?.[key]??''}
function inferProfileKey(field){if(field?.profileKey)return field.profileKey;const t=String(field?.label||'').toLowerCase().replace(/[^a-z0-9]+/g,' ');if(/full name|applicant name|name of applicant/.test(t))return'fullName';if(/email/.test(t))return'email';if(/mobile|phone/.test(t))return'mobile';if(/date of birth|dob/.test(t))return'dob';if(/gender|sex/.test(t))return'gender';if(/pin code|pincode|postal/.test(t))return'pinCode';if(/village|city/.test(t))return'villageCity';if(/taluka|tehsil/.test(t))return'taluka';if(/district/.test(t))return'district';if(/state/.test(t))return'state';if(/address/.test(t))return'address';return''}
function profileAutofill(field,p=currentProfile){const key=inferProfileKey(field);return key?profileValueByKey(p,key):''}

function nav(){const el=$('navAuth');if(!el)return;if(currentUser)el.innerHTML=`<a href="services.html">Services</a><a href="track.html">Track</a><a href="account.html">My Account</a><button onclick="Portal.logout()">Logout</button>`;else el.innerHTML=''}
onAuthStateChanged(auth,async u=>{try{currentUser=u;currentProfile=u?await profile(u.uid):null;currentPortalCms=null;nav();if(u){currentPortalCms=await portalCms();memberChrome(currentProfile,currentPortalCms)}bindAdminNotifications();document.dispatchEvent(new CustomEvent('portal-auth',{detail:{user:u,profile:currentProfile,cms:currentPortalCms||{}}}))}finally{resolveAuthReady?.({user:currentUser,profile:currentProfile,cms:currentPortalCms||{}});resolveAuthReady=null}});
async function register(data){const mobile=String(data.mobile||'').replace(/\D/g,'');if(mobile.length!==10)throw new Error('10-digit mobile number required.');if(!data.fullName?.trim())throw new Error('Full Name required.');if((data.password||'').length<6)throw new Error('Password minimum 6 characters.');if(data.password!==data.confirmPassword)throw new Error('Password aur Confirm Password match nahi karte.');const c=await createUserWithEmailAndPassword(auth,alias(mobile),data.password);await setDoc(doc(db,'users',c.user.uid),{fullName:data.fullName.trim(),email:(data.email||'').trim(),mobile,status:'Active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return c.user}
async function login(mobile,password){const m=String(mobile||'').replace(/\D/g,'');if(m.length!==10)throw new Error('10-digit mobile number required.');const c=await signInWithEmailAndPassword(auth,alias(m),password);const p=await profile(c.user.uid);if(p?.status==='Disabled'){await signOut(auth);throw new Error('Account disabled. Contact support.')}return c.user}
async function logout(){await signOut(auth);location.href='index.html'}
const normServiceName=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const serviceMasterMap=new Map();
const actionMasterMap=new Map();
function masterServiceRows(){return MASTER_SERVICES.map(s=>({id:`svc_${s.id}`,name:s.name,category:s.category,icon:s.icon,description:s.description,status:'Published',availabilityStatus:'Available',featured:false,masterServiceId:s.id,_master:s}))}
async function masterInstallState(){try{const snap=await getDoc(doc(db,'settings','masterCatalog'));return snap.exists()?snap.data():{}}catch(_){return {}}}
async function services(){
 let allLive=[],readOk=false;
 try{const snap=await getDocs(collection(db,'services'));allLive=snap.docs.map(d=>({id:d.id,...d.data()}));readOk=true}catch(e){console.warn('Services Firestore read failed; using bundled catalogue.',e)}
 serviceMasterMap.clear();
 const masterByName=new Map(MASTER_SERVICES.map(m=>[normServiceName(m.name),m]));
 for(const x of allLive){const m=masterByName.get(normServiceName(x.name));if(m){x.masterServiceId=x.masterServiceId||m.id;x._master=m;serviceMasterMap.set(x.id,m)}}
 const published=allLive.filter(x=>(x.status||'Published')==='Published');
 const state=await masterInstallState();
 const complete=readOk&&state.installedComplete===true&&Number(state.serviceCount||0)>=MASTER_SERVICES.length;
 if(complete)return published;
 const byName=new Map(allLive.map(x=>[normServiceName(x.name),x]));
 const rows=[...published];
 for(const m of masterServiceRows()){if(!byName.has(normServiceName(m.name))){rows.push(m);serviceMasterMap.set(m.id,m)}}
 return rows;
}
async function actions(serviceId){
 let live=[];try{const snap=await getDocs(query(collection(db,'serviceActions'),where('serviceId','==',serviceId)));live=snap.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('Actions Firestore read failed; using bundled catalogue.',e)}
 let svc=serviceMasterMap.get(serviceId)||MASTER_SERVICES.find(x=>`svc_${x.id}`===serviceId||x.id===serviceId);
 if(!svc&&live.length){const msid=live.find(x=>x.masterServiceId)?.masterServiceId;if(msid)svc=MASTER_SERVICES.find(x=>x.id===msid)}
 if(svc){
   const byName=new Map(live.map(x=>[normServiceName(x.name),x]));
   svc.actions.forEach((a,i)=>{
     const existing=byName.get(normServiceName(a[0]));
     if(existing){existing._masterAction=a;actionMasterMap.set(existing.id,{service:svc,action:a});return}
     const id=actionId(svc.id,a[0]);const row={id,serviceId,name:a[0],serviceCharge:Number(a[1]||0),officialFee:0,description:`${svc.name} - ${a[0]} service/assistance request.`,requiredDocuments:a[3]||[],availabilityStatus:a[2]||'Available',available:(a[2]||'Available')==='Available',order:(i+1)*10,masterServiceId:svc.id,_masterAction:a};live.push(row);actionMasterMap.set(id,{service:svc,action:a})
   })
 }
 return live.sort((a,b)=>Number(a.order||0)-Number(b.order||0))
}
async function fields(actionDocId){
 let live=[];try{const snap=await getDocs(query(collection(db,'formFields'),where('actionId','==',actionDocId)));live=snap.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('Form fields Firestore read failed; using bundled catalogue.',e)}
 if(live.length)return live.sort((a,b)=>Number(a.order||0)-Number(b.order||0));
 const mapped=actionMasterMap.get(actionDocId);if(mapped)return fieldsFor(mapped.action).map((f,i)=>({id:`fld_${actionDocId}_${i+1}`,...f,actionId:actionDocId}));
 for(const svc of MASTER_SERVICES){const a=svc.actions.find(x=>actionId(svc.id,x[0])===actionDocId);if(a)return fieldsFor(a).map((f,i)=>({id:`fld_${actionDocId}_${i+1}`,...f,actionId:actionDocId}))}
 return []
}
async function uploadFile(file,path){
 const cloudName='jkia38fa',preset='khobragade_csc';
 const fd=new FormData();
 fd.append('file',file);
 fd.append('upload_preset',preset);
 const folder='kcsc-portal/'+String(path||'uploads').replace(/\\/g,'/').replace(/\/[^/]+$/,'');
 fd.append('folder',folder);
 const res=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,{method:'POST',body:fd});
 const j=await res.json().catch(()=>({}));
 if(!res.ok||!j.secure_url)throw new Error(j.error?.message||'Document upload failed.');
 return j.secure_url;
}
async function createApplication({service,action,formData,files:uploadList}){if(!auth.currentUser)throw new Error('Please login first.');const profileData=await profile(auth.currentUser.uid);const id=appId();const uploaded=[];for(const item of uploadList||[]){if(item?.url){uploaded.push({label:item.label||'Document',name:item.name||'Profile File',url:item.url,source:item.source||'profile'});continue}if(!item?.file)continue;const url=await uploadFile(item.file,`applications/${auth.currentUser.uid}/${id}/${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`);uploaded.push({label:item.label,name:item.file.name,url,source:'application'})}const amount=Number(action.serviceCharge||0);const appRef=doc(db,'applications',id);await setDoc(appRef,{applicationId:id,userId:auth.currentUser.uid,userName:profileData?.fullName||'',mobile:profileData?.mobile||'',email:profileData?.email||'',serviceId:service.id,serviceName:service.name||'',actionId:action.id,actionName:action.name||'',amount,officialFee:Number(action.officialFee||0),paymentStatus:amount>0?'Pending':'Paid',status:amount>0?'Pending Payment':'Pending',formData,documents:uploaded,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});await setDoc(doc(db,'publicApplicationStatus',id),{applicationId:id,mobileLast4:(profileData?.mobile||'').slice(-4),serviceName:service.name||'',actionName:action.name||'',paymentStatus:amount>0?'Pending':'Paid',status:amount>0?'Pending Payment':'Pending',updatedAt:serverTimestamp()});return {docId:id,applicationId:id,amount}}
async function payuSettings(){const s=await getDoc(doc(db,'settings','payu'));return s.exists()?s.data():{}}
async function startPayment(app){if(app.amount<=0)return {free:true};location.href='payment.html?id='+encodeURIComponent(app.docId||app.applicationId);return {redirected:true}}
async function getApplication(id){if(!auth.currentUser)throw new Error('Please login first.');const d=await getDoc(doc(db,'applications',id));if(!d.exists())throw new Error('Application not found.');const x={id:d.id,...d.data()};if(x.userId!==auth.currentUser.uid)throw new Error('Application access denied.');return x}
async function initiatePayu(applicationId){const app=await getApplication(applicationId);if(Number(app.amount||0)<=0)return {free:true};if(app.paymentStatus==='Paid')return {paid:true};const s=await payuSettings();if(!s.backendUrl)throw new Error('PayU connection pending: Admin Dashboard → Payments / PayU me Secure Backend Payment URL save karein.');const token=await auth.currentUser.getIdToken();const firstname=String(app.userName||currentProfile?.fullName||'Customer').trim()||'Customer';const phone=String(app.mobile||currentProfile?.mobile||'').replace(/\D/g,'');const email=String(app.email||currentProfile?.email||'').trim()||'noreply@9637832490.online';const productinfo=[app.serviceName,app.actionName].filter(Boolean).join(' - ')||'KCSC Service';const payload={applicationDocId:app.id,applicationId:app.applicationId,amount:Number(app.amount||0).toFixed(2),firstname,email,phone,productinfo};const r=await fetch(s.backendUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||j.message||'Payment initialization failed.');if(j.redirectUrl){location.href=j.redirectUrl;return {redirected:true}}if(j.paymentUrl&&j.params){const f=document.createElement('form');f.method='POST';f.action=j.paymentUrl;Object.entries(j.params).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v??'';f.appendChild(i)});document.body.appendChild(f);f.submit();return {submitted:true}}if(j.action&&j.fields){const f=document.createElement('form');f.method='POST';f.action=j.action;Object.entries(j.fields).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;f.appendChild(i)});document.body.appendChild(f);f.submit();return {submitted:true}}throw new Error('Invalid payment response from backend.')}
async function myApplications(){if(!auth.currentUser)return[];const s=await getDocs(query(collection(db,'applications'),where('userId','==',auth.currentUser.uid)));return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))}
async function trackPublic(applicationId,mobile){const s=await getDoc(doc(db,'publicApplicationStatus',applicationId.trim()));if(!s.exists())return null;const x=s.data();if(x.mobileLast4!==String(mobile||'').replace(/\D/g,'').slice(-4))return null;return x}

const memberPages={
 'account.html':{title:'Dashboard',key:'dashboard'},
 'services.html':{title:'All Services',key:'services'},
 'apply.html':{title:'New Application',key:'new'},
 'my-applications.html':{title:'My Applications',key:'applications'},
 'payments.html':{title:'Payments',key:'payments'},
 'payment.html':{title:'Complete Payment',key:'payments'},
 'track.html':{title:'Track Application',key:'track'},
 'my-documents.html':{title:'My Documents',key:'documents'},
 'downloads.html':{title:'Downloads',key:'downloads'},
 'notifications.html':{title:'Notifications',key:'notifications'},
 'profile.html':{title:'My Profile',key:'profile'},
 'reupload.html':{title:'Upload Documents',key:'applications'}
};
function memberInitials(name='User'){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'U'}
function memberChrome(profileData,cms={}){
 const file=(location.pathname.split('/').pop()||'index.html').toLowerCase(),meta=memberPages[file];
 if(!meta||!currentUser)return;
 document.body.classList.add('member-dashboard','member-pro-layout');
 document.getElementById('memberProChrome')?.remove();
 const name=profileData?.fullName||'User',photo=profileData?.photoURL||'';
 const menu=(Array.isArray(cms.memberMenu)&&cms.memberMenu.length?cms.memberMenu:DEFAULT_MEMBER_MENU).map(x=>x.key==='help'?{...x,href:'index.html#support'}:x).filter(x=>x.visible!==false).sort((a,b)=>Number(a.order||0)-Number(b.order||0));
 const navHtml=menu.map(item=>{const kids=Array.isArray(item.children)?item.children.filter(x=>x.visible!==false).sort((a,b)=>Number(a.order||0)-Number(b.order||0)):[];if(kids.length){const active=kids.some(k=>meta.key===k.key);return `<details class="member-pro-group" ${active?'open':''}><summary class="${active?'active':''}"><span class="member-pro-nav-icon">${esc(item.icon||'•')}</span><span class="member-pro-nav-text">${esc(item.label||'Menu')}</span><span class="member-pro-chevron">⌄</span></summary><div class="member-pro-subnav">${kids.map(k=>`<a class="${meta.key===k.key?'active':''}" href="${esc(k.href||'#')}">${esc(k.label||'Link')}</a>`).join('')}</div></details>`}return `<a class="${meta.key===item.key?'active':''}" href="${esc(item.href||'#')}"><span class="member-pro-nav-icon">${esc(item.icon||'•')}</span><span class="member-pro-nav-text">${esc(item.label||'Menu')}</span>${item.key==='notifications'?'<span id="memberNotifCount" class="member-pro-nav-count" hidden>0</span>':''}</a>`}).join('');
 const avatar=photo?`<img class="member-pro-avatar member-pro-avatar-img" src="${esc(photo)}" alt="Profile">`:`<span class="member-pro-avatar">${esc(memberInitials(name))}</span>`;
 const root=document.createElement('div');root.id='memberProChrome';
 root.innerHTML=`<aside class="member-pro-sidebar"><a class="member-pro-brand" href="account.html"><span class="member-pro-logo">K</span><span class="member-pro-brand-copy"><b>Khobragade Computer Service Centre</b><small>SECURE USER PORTAL</small></span></a><div class="member-pro-nav-label">MY ACCOUNT</div><nav class="member-pro-nav">${navHtml}</nav><div class="member-pro-sidebar-bottom"><button class="member-pro-side-logout" type="button">↪ Logout</button><div class="member-pro-security"><span>🛡️</span><div><b>Secure Account</b><br>Protected application portal</div></div></div></aside><header class="member-pro-header"><div class="member-pro-header-inner"><button class="member-pro-mobile-toggle" type="button" aria-label="Open menu">☰</button><div class="member-pro-page-meta"><small>USER PORTAL</small><strong>${esc(meta.title)}</strong></div><div class="member-pro-head-actions"><a class="member-pro-icon-btn" href="notifications.html" title="Notifications">🔔<span id="memberHeadNotif" class="member-pro-badge" hidden>0</span></a><a class="member-pro-user" href="profile.html">${avatar}<span class="member-pro-user-copy"><b>${esc(name)}</b><small>Member Account</small></span></a></div></div></header>`;
 document.body.prepend(root);
 const toggle=root.querySelector('.member-pro-mobile-toggle'),closeMenu=()=>document.body.classList.remove('member-menu-open');
 toggle?.addEventListener('click',()=>document.body.classList.toggle('member-menu-open'));
 root.querySelector('.member-pro-side-logout')?.addEventListener('click',logout);
 root.querySelectorAll('.member-pro-nav a').forEach(a=>a.addEventListener('click',closeMenu));
 document.body.addEventListener('click',e=>{if(document.body.classList.contains('member-menu-open')&&!root.querySelector('.member-pro-sidebar').contains(e.target)&&!toggle.contains(e.target))closeMenu()});
 myApplications().then(rows=>{const n=rows.filter(x=>['Need Documents','Rejected','Processing','Completed','Payment Failed'].includes(x.status)||x.paymentStatus==='Failed').length;for(const id of ['memberNotifCount','memberHeadNotif']){const el=document.getElementById(id);if(el){el.dataset.appCount=String(n);const adminN=Number(el.dataset.adminCount||0),totalN=n+adminN;el.textContent=totalN>99?'99+':String(totalN);el.hidden=totalN===0}}}).catch(()=>{});
}


function liveTime(v){if(!v)return 0;if(typeof v.toDate==='function')return v.toDate().getTime();if(v.seconds)return v.seconds*1000;return new Date(v).getTime()||0}
function youtubeVideoId(url=''){try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return u.pathname.slice(1);if(u.searchParams.get('v'))return u.searchParams.get('v');const m=u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);return m?m[1]:''}catch(_){return''}}
function safeTarget(v,def='_self'){return v==='_blank'?'_blank':def==='_blank'?'_blank':'_self'}
function notificationAudienceOk(x){const a=x.audience||'all';return a==='all'||(a==='members'&&!!currentUser)||(a==='guest'&&!currentUser)}
function notificationAction(x,label='View'){if(!x.link)return'';const t=safeTarget(x.target,'_self');return `<a class="kcsc-notif-action" href="${esc(x.link)}" target="${t}" ${t==='_blank'?'rel="noopener"':''}>${esc(label)}</a>`}
function ensureNotificationHosts(){
 let breaking=document.getElementById('kcscBreakingHost');if(!breaking){breaking=document.createElement('div');breaking.id='kcscBreakingHost';document.body.prepend(breaking)}
 let popup=document.getElementById('kcscPopupHost');if(!popup){popup=document.createElement('div');popup.id='kcscPopupHost';document.body.appendChild(popup)}
 return {breaking,popup};
}
function renderAdminNotifications(rows){
 const published=rows.filter(x=>(x.status||'Published')==='Published'&&notificationAudienceOk(x)).sort((a,b)=>liveTime(b.createdAt||b.updatedAt)-liveTime(a.createdAt||a.updatedAt));
 const {breaking,popup}=ensureNotificationHosts();
 const breaks=published.filter(x=>x.type==='breaking').slice(0,3);
 breaking.innerHTML=breaks.length?`<div class="kcsc-breaking-wrap">${breaks.map(x=>`<div class="kcsc-breaking-item"><b>📢 ${esc(x.title||'Important Update')}</b><span>${esc(x.description||'')}</span>${notificationAction(x,'Open')}</div>`).join('')}</div>`:'';
 const pop=published.find(x=>x.type==='popup');
 if(pop){const key='kcsc_popup_'+pop.id;const already=sessionStorage.getItem(key);if(!already){popup.innerHTML=`<div class="kcsc-popup-backdrop"><article class="kcsc-popup-card">${pop.imageUrl?`<img src="${esc(pop.imageUrl)}" alt="${esc(pop.title||'Notification')}">`:''}<button class="kcsc-popup-close" type="button" aria-label="Close">✕</button><span class="kcsc-popup-kicker">IMPORTANT NOTICE</span><h2>${esc(pop.title||'Notification')}</h2><p>${esc(pop.description||'')}</p><div class="kcsc-popup-actions">${notificationAction(pop,'View Details')}<button class="kcsc-notif-action kcsc-popup-dismiss" type="button">Close</button></div></article></div>`;const close=()=>{sessionStorage.setItem(key,'1');popup.innerHTML=''};popup.querySelector('.kcsc-popup-close')?.addEventListener('click',close);popup.querySelector('.kcsc-popup-dismiss')?.addEventListener('click',close);popup.querySelector('.kcsc-popup-backdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)close()})}}
 else popup.innerHTML='';
 const normals=published.filter(x=>x.type==='normal');
 if(currentUser){const adminN=published.length;for(const id of ['memberNotifCount','memberHeadNotif']){const el=document.getElementById(id);if(el){el.dataset.adminCount=String(adminN);const appN=Number(el.dataset.appCount||0),totalN=appN+adminN;el.textContent=totalN>99?'99+':String(totalN);el.hidden=totalN===0}}}
 document.querySelectorAll('[data-admin-notifications],#adminNotificationsGrid').forEach(box=>{box.innerHTML=normals.length?normals.slice(0,8).map(x=>`<article class="admin-notif-card priority-${esc(String(x.priority||'Medium').toLowerCase())}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'Notification')}">`:''}<div><small>${esc(x.priority||'Medium')} Priority</small><h3>${esc(x.title||'Notification')}</h3><p>${esc(x.description||'')}</p>${notificationAction(x,'View / Open')}</div></article>`).join(''):'<div class="live-empty">No general notifications.</div>'});
}
function bindAdminNotifications(){try{adminNotificationUnsub?.()}catch(_){};adminNotificationUnsub=onSnapshot(collection(db,'notifications'),snap=>renderAdminNotifications(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{})}
function bindLivePanels(){
 const svcBox=$('liveServicesGrid'),updBox=$('liveUpdatesGrid'),ytBox=$('liveYoutubeGrid');
 if(svcBox){onSnapshot(collection(db,'services'),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.status||'Published')==='Published').sort((a,b)=>liveTime(b.createdAt||b.updatedAt)-liveTime(a.createdAt||a.updatedAt)).slice(0,8);svcBox.innerHTML=rows.length?rows.map(x=>{const href=currentUser?'services.html':'index.html?auth=login#homeAuth';const t=safeTarget(x.target,'_self');return `<a class="live-card" href="${href}" target="${t}" ${t==='_blank'?'rel="noopener"':''}><span>${esc(x.icon||'🧰')}</span><div><b>${esc(x.name||'Service')}</b><small>${esc(x.category||'Digital Service')}</small></div><em>New / Updated</em></a>`}).join(''):'<div class="live-empty">Services will appear here.</div>'},()=>{});}
 if(updBox){onSnapshot(collection(db,'updates'),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.status||'Published')==='Published').sort((a,b)=>liveTime(b.createdAt||b.updatedAt)-liveTime(a.createdAt||a.updatedAt)).slice(0,6);updBox.innerHTML=rows.length?rows.map(x=>`<article class="live-update"><span>📢</span><div><b>${esc(x.title||'Latest Update')}</b><p>${esc(x.description||x.details||x.message||'')}</p></div></article>`).join(''):'<div class="live-empty">Latest updates will appear here.</div>'},()=>{});}
 if(ytBox){onSnapshot(collection(db,'youtube'),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.status||'Published')==='Published').sort((a,b)=>liveTime(b.createdAt||b.updatedAt)-liveTime(a.createdAt||a.updatedAt)).slice(0,6);ytBox.innerHTML=rows.length?rows.map(x=>{const id=youtubeVideoId(x.link||'');const thumb=id?`https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:'';const t=safeTarget(x.target,'_blank');return `<a class="live-video" href="${esc(x.link||'#')}" target="${t}" ${t==='_blank'?'rel="noopener"':''}>${thumb?`<img src="${thumb}" alt="${esc(x.title||'YouTube Video')}">`:'<div class="video-fallback">▶</div>'}<div><b>${esc(x.title||'YouTube Video')}</b><small>${esc(x.description||'Watch latest video')}</small></div></a>`}).join(''):'<div class="live-empty">Published YouTube videos will appear here.</div>'},()=>{});}
}
queueMicrotask(bindLivePanels);

window.Portal={ready:()=>authReady,register,login,logout,services,actions,fields,createApplication,startPayment,getApplication,initiatePayu,myApplications,trackPublic,money,statusClass,esc,memberChrome,portalCms,mergedProfileFields,profileAutofill,inferProfileKey,profileValueByKey,uploadFile,bindAdminNotifications,get user(){return currentUser},get profile(){return currentProfile},get cms(){return currentPortalCms||{}}};
