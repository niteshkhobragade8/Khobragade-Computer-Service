
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: [
  'https://9637832490.online','https://www.9637832490.online',
  'http://localhost:3000','http://127.0.0.1:5500'
]}));
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({ extended: true, limit:'15mb' }));

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_MODE = (process.env.PAYU_MODE || 'production').toLowerCase();
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://9637832490.online';
const BACKEND_URL = process.env.BACKEND_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'niteshkhobragade8@gmail.com').toLowerCase();

let sb = null;
function supabase(){
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase backend environment not configured');
  if(!sb) sb=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  return sb;
}
function initFirebaseAdmin(){
  if(admin.apps.length) return;
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT;
  if(!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not configured (kept only for Firebase Authentication)');
  let serviceAccount;
  try{serviceAccount=JSON.parse(raw)}catch(_){throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON')}
  admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
}
async function authContext(req, required=false){
  const h=String(req.headers.authorization||'');
  const m=h.match(/^Bearer\s+(.+)$/i);
  if(!m){ if(required) throw Object.assign(new Error('Login required'),{status:401}); return null; }
  initFirebaseAdmin();
  try{
    const d=await admin.auth().verifyIdToken(m[1],true);
    return {uid:d.uid,email:String(d.email||'').toLowerCase(),admin:String(d.email||'').toLowerCase()===ADMIN_EMAIL};
  }catch(_){throw Object.assign(new Error('Invalid or expired login'),{status:401})}
}
const now=()=>new Date().toISOString();
const table=()=>supabase().from('kcsc_documents');

async function rowGet(collection,id){
  const {data,error}=await table().select('collection,id,data,created_at,updated_at').eq('collection',collection).eq('id',id).maybeSingle();
  if(error) throw error; return data;
}
async function rowsGet(collection){
  const {data,error}=await table().select('collection,id,data,created_at,updated_at').eq('collection',collection);
  if(error) throw error; return data||[];
}
async function rowSet(collection,id,data,merge=false){
  let final={...(data||{})};
  if(merge){
    const old=await rowGet(collection,id);
    final={...(old?.data||{}),...final};
  }
  const stamp=now();
  const {error}=await table().upsert({
    collection,id,data:final,updated_at:stamp,
    ...(merge?{}:{created_at:stamp})
  },{onConflict:'collection,id'});
  if(error) throw error;
  return {id,data:final};
}
async function rowDelete(collection,id){
  const {error}=await table().delete().eq('collection',collection).eq('id',id);
  if(error) throw error;
}
async function rowAdd(collection,data){
  const id=crypto.randomUUID(); await rowSet(collection,id,data,false); return id;
}

const PUBLIC_READ = new Set([
 'services','serviceActions','formFields','settings','categories','updates',
 'notifications','images','documents','documentChecklists','youtube','themes',
 'pageContent','siteSections','dynamicPages','dynamicSections','menuItems',
 'seoSettings','customButtons','publicApplicationStatus'
]);
const ADMIN_ONLY_WRITE = new Set([
 'services','serviceActions','formFields','settings','categories','updates',
 'notifications','images','documents','documentChecklists','youtube','themes',
 'pageContent','siteSections','dynamicPages','dynamicSections','menuItems',
 'recycleBin','seoSettings','customButtons','commissionRates'
]);
const ANALYTICS = new Set(['analytics','visitorDaily','serviceAnalytics']);

function owns(collection,row,ctx,id){
  const d=row?.data||{};
  if(!ctx) return false;
  if(collection==='users') return id===ctx.uid;
  if(['applications','payments','paymentScreenshots','commissionRates','commissionLedger'].includes(collection))
    return d.userId===ctx.uid;
  if(collection==='publicApplicationStatus') return true;
  return false;
}
async function authorizeRead(collection,id,ctx){
  if(ctx?.admin || PUBLIC_READ.has(collection) || ANALYTICS.has(collection)) return true;
  if(!ctx) return false;
  if(id){
    const r=await rowGet(collection,id); return !!r && owns(collection,r,ctx,id);
  }
  return ['users','applications','payments','paymentScreenshots','commissionRates','commissionLedger'].includes(collection);
}
async function filterRowsForUser(collection,rows,ctx){
  if(ctx?.admin || PUBLIC_READ.has(collection) || ANALYTICS.has(collection)) return rows;
  return rows.filter(r=>owns(collection,r,ctx,r.id));
}
async function authorizeWrite(collection,id,data,ctx,op){
  if(ctx?.admin) return true;
  if(ADMIN_ONLY_WRITE.has(collection)) return false;
  if(ANALYTICS.has(collection)) return ['set','update','add'].includes(op);
  if(!ctx) return false;
  if(collection==='users') return id===ctx.uid;
  if(collection==='applications') return (data?.userId===ctx.uid) || owns(collection,await rowGet(collection,id),ctx,id);
  if(collection==='paymentScreenshots') return op==='add'||op==='set'
    ? data?.userId===ctx.uid
    : owns(collection,await rowGet(collection,id),ctx,id);
  if(collection==='commissionLedger') return data?.userId===ctx.uid || owns(collection,await rowGet(collection,id),ctx,id);
  if(collection==='publicApplicationStatus') return true;
  // Payments are created/updated only by secure PayU backend/admin.
  if(collection==='payments') return false;
  return false;
}

// Generic secure document API used by the Firestore-compatible frontend.
app.post('/supabase/query',async(req,res)=>{
  try{
    const {collection,id}=req.body||{};
    if(!collection) return res.status(400).json({error:'Collection required'});
    const ctx=await authContext(req,false);
    if(!(await authorizeRead(collection,id,ctx))) return res.status(403).json({error:'Access denied'});
    if(id){
      const row=await rowGet(collection,String(id));
      if(!row) return res.json({row:null});
      if(!ctx?.admin&&!PUBLIC_READ.has(collection)&&!ANALYTICS.has(collection)&&!owns(collection,row,ctx,String(id)))
        return res.status(403).json({error:'Access denied'});
      return res.json({row:{id:row.id,data:row.data}});
    }
    let rows=await rowsGet(collection);
    rows=await filterRowsForUser(collection,rows,ctx);
    return res.json({rows:rows.map(r=>({id:r.id,data:r.data}))});
  }catch(e){console.error('supabase/query',e);return res.status(e.status||500).json({error:e.message})}
});

app.post('/supabase/write',async(req,res)=>{
  try{
    const {op,collection,id,data,merge}=req.body||{};
    if(!op||!collection||!id) return res.status(400).json({error:'Write details missing'});
    const ctx=await authContext(req,false);
    if(!(await authorizeWrite(collection,String(id),data||{},ctx,op))) return res.status(403).json({error:'Write access denied'});
    if(op==='delete') await rowDelete(collection,String(id));
    else await rowSet(collection,String(id),data||{},op==='update'||!!merge);
    return res.json({ok:true,id});
  }catch(e){console.error('supabase/write',e);return res.status(e.status||500).json({error:e.message})}
});
app.post('/supabase/batch',async(req,res)=>{
  try{
    const ctx=await authContext(req,false);
    const ops=Array.isArray(req.body?.operations)?req.body.operations:[];
    if(ops.length>500) return res.status(400).json({error:'Too many batch operations'});
    for(const x of ops){
      if(!(await authorizeWrite(x.collection,String(x.id),x.data||{},ctx,x.op))) return res.status(403).json({error:'Batch access denied'});
    }
    for(const x of ops){
      if(x.op==='delete') await rowDelete(x.collection,String(x.id));
      else await rowSet(x.collection,String(x.id),x.data||{},x.op==='update'||!!x.merge);
    }
    return res.json({ok:true,count:ops.length});
  }catch(e){console.error('supabase/batch',e);return res.status(e.status||500).json({error:e.message})}
});
app.post('/supabase/import',async(req,res)=>{
  try{
    const ctx=await authContext(req,true);
    if(!ctx.admin) return res.status(403).json({error:'Admin required'});
    const docs=Array.isArray(req.body?.documents)?req.body.documents:[];
    if(docs.length>250) return res.status(400).json({error:'Maximum 250 documents per import batch'});
    for(const x of docs) await rowSet(String(x.collection),String(x.id),x.data||{},false);
    return res.json({ok:true,count:docs.length});
  }catch(e){console.error('supabase/import',e);return res.status(e.status||500).json({error:e.message})}
});

function mobileAlias(mobile){return `m${String(mobile||'').replace(/\D/g,'')}@login.kcsc.local`}

// Password reset flow: Firebase Authentication remains, request data is now Supabase.
app.post('/password-reset-request',async(req,res)=>{
  try{
    const mobile=String(req.body?.mobile||'').replace(/\D/g,'');
    if(mobile.length!==10) return res.status(400).json({error:'Valid 10-digit mobile number required'});
    initFirebaseAdmin();
    let user;
    try{user=await admin.auth().getUserByEmail(mobileAlias(mobile))}
    catch(_){return res.json({ok:true,message:'Agar account registered hai to reset request Admin ko bhej di gayi hai.'})}
    const profile=await rowGet('users',user.uid);
    if(!profile) return res.json({ok:true,message:'Agar account registered hai to reset request Admin ko bhej di gayi hai.'});
    const old=(await rowsGet('passwordResetRequests')).find(r=>r.data?.uid===user.uid&&r.data?.status==='Pending');
    const payload={uid:user.uid,mobile,fullName:profile.data?.fullName||'User',email:profile.data?.email||'',
      accountType:profile.data?.isCommissionUser===true?'Commission':'Normal',status:'Pending',updatedAt:now()};
    if(old) await rowSet('passwordResetRequests',old.id,payload,true);
    else await rowSet('passwordResetRequests',crypto.randomUUID(),{...payload,createdAt:now()},false);
    return res.json({ok:true,message:old?'Reset request already pending hai. Admin temporary password set karega.':'Password reset request Admin Dashboard me bhej di gayi hai.'});
  }catch(e){console.error('password-reset-request',e);return res.status(500).json({error:e.message})}
});
app.get('/admin/password-reset-requests',async(req,res)=>{
  try{
    const ctx=await authContext(req,true); if(!ctx.admin) return res.status(403).json({error:'Admin required'});
    const rows=await rowsGet('passwordResetRequests');
    const requests=rows.map(r=>({id:r.id,...r.data})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    return res.json({ok:true,requests});
  }catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/admin/reset-user-password',async(req,res)=>{
  try{
    const ctx=await authContext(req,true); if(!ctx.admin) return res.status(403).json({error:'Admin required'});
    const requestId=String(req.body?.requestId||''),password=String(req.body?.temporaryPassword||'');
    if(password.length<6) return res.status(400).json({error:'Temporary password minimum 6 characters required'});
    const rr=await rowGet('passwordResetRequests',requestId); if(!rr) return res.status(404).json({error:'Reset request not found'});
    initFirebaseAdmin(); await admin.auth().updateUser(rr.data.uid,{password});
    await rowSet('users',rr.data.uid,{mustChangePassword:true,passwordResetAt:now(),updatedAt:now()},true);
    await rowSet('passwordResetRequests',requestId,{status:'Completed',completedAt:now(),updatedAt:now()},true);
    return res.json({ok:true});
  }catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/admin/delete-password-reset-request',async(req,res)=>{
  try{
    const ctx=await authContext(req,true); if(!ctx.admin) return res.status(403).json({error:'Admin required'});
    await rowDelete('passwordResetRequests',String(req.body?.requestId||'')); return res.json({ok:true});
  }catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/change-own-password',async(req,res)=>{
  try{
    const ctx=await authContext(req,true),password=String(req.body?.newPassword||'');
    if(password.length<6) return res.status(400).json({error:'New password minimum 6 characters required'});
    initFirebaseAdmin(); await admin.auth().updateUser(ctx.uid,{password});
    await rowSet('users',ctx.uid,{mustChangePassword:false,passwordChangedAt:now(),updatedAt:now()},true);
    return res.json({ok:true});
  }catch(e){return res.status(e.status||500).json({error:e.message})}
});

function sha512(s){return crypto.createHash('sha512').update(String(s)).digest('hex')}
function payuEndpoints(){
 return PAYU_MODE==='production'
  ?{payment:'https://secure.payu.in/_payment',verify:'https://info.payu.in/merchant/postservice.php?form=2'}
  :{payment:'https://test.payu.in/_payment',verify:'https://test.payu.in/merchant/postservice.php?form=2'};
}
function commissionActive(p){
 if(!p||p.isCommissionUser!==true||p.commissionStatus==='Inactive') return false;
 const d=new Date().toISOString().slice(0,10);
 if(p.commissionStartDate&&d<p.commissionStartDate)return false;
 if(p.commissionEndDate&&d>p.commissionEndDate)return false;
 return true;
}
function calcCommission(charge,type,value){
 const c=Math.max(0,Number(charge||0)),v=Math.max(0,Number(value||0));
 const amt=type==='percent'?Math.min(c,c*v/100):Math.min(c,v);
 return {commissionAmount:Number(amt.toFixed(2)),finalCharge:Number((c-amt).toFixed(2))};
}
function rateId(uid,aid){return `${uid}__${aid}`.replace(/[^a-zA-Z0-9_-]/g,'_')}

app.get('/',(req,res)=>res.json({ok:true,service:'KCSC PayU + Supabase Backend',version:'3.0.0'}));

app.post('/create-payment',async(req,res)=>{
 try{
  if(!PAYU_KEY||!PAYU_SALT||!BACKEND_URL) return res.status(500).json({error:'PayU/Supabase backend environment not configured'});
  const ctx=await authContext(req,true);
  const appId=String(req.body?.applicationDocId||'');
  const appRow=await rowGet('applications',appId);
  if(!appRow||appRow.data?.userId!==ctx.uid) return res.status(403).json({error:'Invalid application'});
  const a={...appRow.data};
  if(a.paymentStatus==='Paid') return res.status(409).json({error:'Already paid'});
  const action=await rowGet('serviceActions',String(a.actionId||''));
  if(!action) return res.status(400).json({error:'Action not found'});
  const availability=action.data?.availabilityStatus||((action.data?.available!==false)?'Available':'Unavailable');
  if(availability!=='Available') return res.status(400).json({error:'Service action unavailable'});

  const profile=(await rowGet('users',ctx.uid))?.data||{};
  const originalAmount=Number(action.data?.serviceCharge||0);
  let commissionAmount=0, finalAmount=originalAmount, ctype='', cvalue=0;
  if(commissionActive(profile)){
    const rr=await rowGet('commissionRates',rateId(ctx.uid,String(a.actionId||'')));
    const rd=rr?.data;
    ctype=(rd&&rd.active!==false?rd.type:null)||profile.defaultCommissionType||'fixed';
    cvalue=Number((rd&&rd.active!==false?rd.value:null)??profile.defaultCommissionValue??0);
    const c=calcCommission(originalAmount,ctype,cvalue);
    commissionAmount=c.commissionAmount; finalAmount=c.finalCharge;
  }
  await rowSet('applications',appId,{
    originalAmount,commissionAmount,commissionType:ctype,commissionValue:cvalue,amount:finalAmount,
    isCommissionApplication:commissionAmount>0,updatedAt:now()
  },true);
  if(commissionAmount>0){
    await rowSet('commissionLedger',appId,{
      userId:ctx.uid,applicationDocId:appId,applicationId:a.applicationId||appId,
      serviceId:a.serviceId||'',serviceName:a.serviceName||'',actionId:a.actionId||'',actionName:a.actionName||'',
      originalCharge:originalAmount,commissionAmount,finalCharge:finalAmount,status:'Pending',paymentStatus:'Pending',
      updatedAt:now(),createdAt:a.createdAt||now()
    },true);
  }
  if(finalAmount<=0) return res.json({free:true});

  const txnid='KCSC'+Date.now()+Math.floor(Math.random()*1000);
  const firstname=String(req.body?.firstname||a.userName||profile.fullName||'Customer').trim().split(/\s+/)[0]||'Customer';
  const email=String(req.body?.email||a.email||profile.email||'noreply@9637832490.online');
  const phone=String(req.body?.phone||a.mobile||profile.mobile||'').replace(/\D/g,'');
  const pinfo=String(req.body?.productinfo||`${a.serviceName||'KCSC Service'} - ${a.actionName||''}`).slice(0,90);
  const udf1=a.applicationId||appId,udf2=appId,amount=Number(finalAmount).toFixed(2);
  const hash=sha512(`${PAYU_KEY}|${txnid}|${amount}|${pinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${PAYU_SALT}`);

  await rowSet('payments',txnid,{
    paymentId:txnid,applicationId:udf1,applicationDocId:udf2,userId:ctx.uid,
    amount:Number(amount),originalAmount,commissionAmount,status:'Pending',createdAt:now(),updatedAt:now()
  },false);
  await rowSet('applications',appId,{paymentTransactionId:txnid,updatedAt:now()},true);

  return res.json({paymentUrl:payuEndpoints().payment,params:{
    key:PAYU_KEY,txnid,amount,productinfo:pinfo,firstname,email,phone,udf1,udf2,
    surl:`${BACKEND_URL}/payment-success`,furl:`${BACKEND_URL}/payment-failure`,hash
  }});
 }catch(e){console.error('create-payment',e);return res.status(e.status||500).json({error:e.message||'Unable to create payment'})}
});
function verifyResponseHash(data){
 if(!data||!data.hash||!PAYU_SALT)return false;
 const additional=data.additionalCharges||data.additional_charges;
 const reverse=`${PAYU_SALT}|${data.status||''}|||||||||${data.udf2||''}|${data.udf1||''}|${data.email||''}|${data.firstname||''}|${data.productinfo||''}|${data.amount||''}|${data.txnid||''}|${data.key||''}`;
 return sha512(additional?`${additional}|${reverse}`:reverse).toLowerCase()===String(data.hash).toLowerCase();
}
async function verifyWithPayU(txnid){
 const command='verify_payment',hash=sha512(`${PAYU_KEY}|${command}|${txnid}|${PAYU_SALT}`);
 const r=await fetch(payuEndpoints().verify,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:PAYU_KEY,command,var1:txnid,hash})});
 const text=await r.text();let json={};try{json=JSON.parse(text)}catch(_){}
 if(!r.ok)throw new Error(`PayU verify HTTP ${r.status}`);
 return {raw:json,detail:json.transaction_details?.[txnid]||json.result?.[txnid]||null};
}
async function updatePaymentState(data,fallbackStatus){
 const txnid=String(data.txnid||'');if(!txnid)throw new Error('Missing transaction ID');
 const pay=await rowGet('payments',txnid);if(!pay)throw new Error('Unknown transaction');
 const pd=pay.data||{},applicationId=String(pd.applicationId||data.udf1||''),applicationDocId=String(pd.applicationDocId||data.udf2||applicationId);
 const expected=Number(pd.amount||0);let status=String(data.status||fallbackStatus||'').toLowerCase(),amt=Number(data.amount||0),mihpayid=data.mihpayid||'',bankRef=data.bank_ref_num||data.bank_ref_no||'',source='signed-callback';
 try{
  const v=await verifyWithPayU(txnid),d=v.detail||{};
  if(Object.keys(d).length){status=String(d.status||d.transaction_status||d.unmappedstatus||d.unmapped_status||status).toLowerCase();amt=Number(d.amt??d.amount??d.transaction_amount??amt);mihpayid=d.mihpayid||d.mihpayId||mihpayid;bankRef=d.bank_ref_num||d.bank_ref_no||bankRef;source='payu-verify-api'}
 }catch(e){console.error('PayU verify warning',e.message)}
 const success=['success','captured','successful'].includes(status),amountOk=Math.abs(amt-expected)<0.01,paid=success&&amountOk;
 const failed=['failure','failed','bounced','dropped','cancel','cancelled'].includes(status);
 const paymentStatus=paid?'Paid':(failed?'Failed':(success&&!amountOk?'Review':'Pending'));
 const appStatus=paid?'Pending':(paymentStatus==='Failed'?'Payment Failed':(paymentStatus==='Review'?'Payment Review':'Pending Payment'));
 await rowSet('payments',txnid,{status:paymentStatus,payuStatus:String(data.status||''),verifiedStatus:status,verifiedAmount:amt,verificationSource:source,mihpayid,bankRef,updatedAt:now(),verifiedAt:now(),...(paid?{paidAt:now()}:{})},true);
 const ar=await rowGet('applications',applicationDocId);
 if(ar){
  await rowSet('applications',applicationDocId,{paymentStatus,status:appStatus,paymentTransactionId:txnid,transactionReference:txnid,mihpayid,updatedAt:now(),...(paid?{paidAt:now()}:{})},true);
  await rowSet('publicApplicationStatus',applicationId,{applicationId,mobileLast4:String(ar.data?.mobile||'').slice(-4),serviceName:ar.data?.serviceName||'',actionName:ar.data?.actionName||'',paymentStatus,status:appStatus,updatedAt:now()},true);
  if(ar.data?.isCommissionApplication||Number(ar.data?.commissionAmount||0)>0) await rowSet('commissionLedger',applicationDocId,{paymentStatus,status:paid?'Paid':'Pending',updatedAt:now()},true);
 }
 return {paid,paymentStatus,appStatus,txnid,applicationId,applicationDocId};
}
app.post('/reconcile-payment',async(req,res)=>{
 try{
  const txnid=String(req.body?.txnid||'');if(!txnid)return res.status(400).json({error:'Transaction ID required'});
  const pay=await rowGet('payments',txnid);if(!pay)return res.status(404).json({error:'Transaction not found'});
  const v=await verifyWithPayU(txnid),d=v.detail||{};if(!Object.keys(d).length)return res.status(409).json({error:'PayU verification pending',paymentStatus:pay.data?.status||'Pending'});
  const result=await updatePaymentState({txnid,udf1:pay.data?.applicationId||'',udf2:pay.data?.applicationDocId||'',amount:d.amt??d.amount??pay.data?.amount,status:d.status||d.transaction_status||d.unmappedstatus||'',mihpayid:d.mihpayid||'',bank_ref_num:d.bank_ref_num||''},'');
  return res.json({ok:true,...result});
 }catch(e){console.error('reconcile-payment',e);return res.status(500).json({error:'Payment status sync failed: '+e.message})}
});
app.post('/payment-success',async(req,res)=>{
 try{
  if(!verifyResponseHash(req.body||{}))return res.status(400).send('Invalid PayU payment response');
  const r=await updatePaymentState(req.body||{},'success');
  return res.redirect(303,`${WEBSITE_URL}/portal/payment-success.html?${new URLSearchParams({applicationId:r.applicationId,txnid:r.txnid,payment:r.paid?'success':'review'})}`);
 }catch(e){console.error('payment-success',e);return res.status(500).send('Payment received, but status update failed. Please contact support with transaction ID.')}
});
app.post('/payment-failure',async(req,res)=>{
 try{
  const d=req.body||{};let r={applicationId:d.udf1||'',txnid:d.txnid||''};
  try{r=await updatePaymentState(d,'failure')}catch(e){console.error('failure update warning',e.message)}
  return res.redirect(303,`${WEBSITE_URL}/portal/payment-failure.html?${new URLSearchParams({applicationId:r.applicationId||'',txnid:r.txnid||''})}`);
 }catch(_){return res.redirect(303,`${WEBSITE_URL}/portal/payment-failure.html`)}
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`KCSC Supabase Backend v3 running on ${PORT}`));
