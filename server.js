
const http = require('http');
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: [
  'https://9637832490.online','https://www.9637832490.online',
  'http://localhost:3000','http://127.0.0.1:5500'
]}));
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({ extended: true, limit:'15mb' }));
// PAYU DIAGNOSTIC LOGGER v4.6
// Logs exact method/host/path for every request without exposing secrets.
app.use((req,res,next)=>{
  const body=req.body||{};
  const txnid=String(body.txnid||req.query?.txnid||body.txnId||body.transactionId||'');
  console.log('HTTP-IN', {
    method:req.method,
    host:req.get('host')||'',
    path:req.originalUrl||req.url||'',
    txnid:txnid||'',
    hasPayUFields:!!(body.status||body.mihpayid||body.hash||body.udf1||body.udf2)
  });
  next();
});

// Normalize duplicate slashes in callback paths.
app.use((req,res,next)=>{
  if(req.url && req.url.startsWith('//')) req.url=req.url.replace(/^\/+/,'/');
  next();
});


const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_MODE = (process.env.PAYU_MODE || 'production').toLowerCase();
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://9637832490.online';
const BACKEND_URL = process.env.BACKEND_URL || '';
const BACKEND_BASE = String(BACKEND_URL || '').trim().replace(/\/+$/,'');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'niteshkhobragade8@gmail.com').toLowerCase();

let sb = null;
function supabase(){
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase backend environment not configured');
  if(!sb) sb=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  return sb;
}
async function authContext(req, required=false){
  const h=String(req.headers.authorization||'');
  const m=h.match(/^Bearer\s+(.+)$/i);
  if(!m){if(required)throw Object.assign(new Error('Login required'),{status:401});return null}
  const {data,error}=await supabase().auth.getUser(m[1]);
  if(error||!data?.user)throw Object.assign(new Error('Invalid or expired login'),{status:401});
  const user=data.user;
  return {uid:user.id,email:String(user.email||'').toLowerCase(),admin:String(user.email||'').toLowerCase()===ADMIN_EMAIL,user};
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

// Generic secure document API used by the document compatibility frontend.
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

function mobileAlias(mobile){return `m${String(mobile||'').replace(/\D/g,'')}@login.9637832490.online`}

app.post('/auth/register',async(req,res)=>{
  try{
    const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');
    if(!/^m\d{10}@login\.9637832490\.online$/.test(email)||password.length<6)return res.status(400).json({error:'Valid mobile login and minimum 6-character password required'});
    if(email===ADMIN_EMAIL)return res.status(403).json({error:'Admin account cannot be created here'});
    const client=supabase();
    const {data,error}=await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:req.body?.metadata||{}});
    if(error){
      const msg=String(error.message||'').toLowerCase();
      if(msg.includes('already registered')||msg.includes('already exists')){
        const existing=await findAuthUserByEmail(email);
        if(existing){
          const profile=await rowGet('users',existing.id);
          if(!profile){
            const {data:updated,error:updateError}=await client.auth.admin.updateUserById(existing.id,{password,email_confirm:true,user_metadata:req.body?.metadata||{}});
            if(updateError)throw updateError;
            return res.json({ok:true,recovered:true,user:{id:updated.user.id,email:updated.user.email||email}});
          }
        }
      }
      throw error;
    }
    return res.json({ok:true,user:{id:data.user.id,email:data.user.email}});
  }catch(e){console.error('auth/register',e);return res.status(400).json({error:e.message})}
});
app.post('/auth/admin-create-user',async(req,res)=>{
  try{
    const ctx=await authContext(req,true);if(!ctx.admin)return res.status(403).json({error:'Admin required'});
    const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');
    if(!/^m\d{10}@login\.9637832490\.online$/.test(email)||password.length<6)return res.status(400).json({error:'Valid commission mobile login and password required'});
    const {data,error}=await supabase().auth.admin.createUser({email,password,email_confirm:true,user_metadata:req.body?.metadata||{}});
    if(error)throw error;
    return res.json({ok:true,user:{id:data.user.id,email:data.user.email}});
  }catch(e){console.error('auth/admin-create-user',e);return res.status(e.status||400).json({error:e.message})}
});
app.post('/auth/admin-delete-user',async(req,res)=>{
  try{
    const ctx=await authContext(req,true);if(!ctx.admin)return res.status(403).json({error:'Admin required'});
    const uid=String(req.body?.uid||'');if(!uid)return res.status(400).json({error:'User ID required'});
    const {error}=await supabase().auth.admin.deleteUser(uid);if(error)throw error;
    return res.json({ok:true});
  }catch(e){console.error('auth/admin-delete-user',e);return res.status(e.status||500).json({error:e.message})}
});

// Password reset flow: Supabase Auth + Supabase document store.
async function findAuthUserByEmail(email){
  let page=1;
  while(page<=20){
    const {data,error}=await supabase().auth.admin.listUsers({page,perPage:200});
    if(error)throw error;
    const found=(data?.users||[]).find(u=>String(u.email||'').toLowerCase()===String(email||'').toLowerCase());
    if(found)return found;
    if((data?.users||[]).length<200)break;
    page++;
  }
  return null;
}
app.post('/password-reset-request',async(req,res)=>{
  try{
    const mobile=String(req.body?.mobile||'').replace(/\D/g,'');
    if(mobile.length!==10)return res.status(400).json({error:'Valid 10-digit mobile number required'});
    const authUser=await findAuthUserByEmail(mobileAlias(mobile));
    if(!authUser)return res.json({ok:true,message:'Agar account registered hai to reset request Admin ko bhej di gayi hai.'});
    const profile=await rowGet('users',authUser.id);
    // Generic response prevents account enumeration.
    if(!profile)return res.json({ok:true,message:'Agar account registered hai to reset request Admin ko bhej di gayi hai.'});
    const rows=await rowsGet('passwordResetRequests');
    const old=rows.find(r=>r.data?.uid===profile.id&&r.data?.status==='Pending');
    const payload={uid:authUser.id,mobile,fullName:profile.data?.fullName||'User',email:profile.data?.email||'',accountType:profile.data?.isCommissionUser===true?'Commission':'Normal',status:'Pending',updatedAt:now()};
    if(old)await rowSet('passwordResetRequests',old.id,payload,true);else await rowSet('passwordResetRequests',crypto.randomUUID(),{...payload,createdAt:now()},false);
    return res.json({ok:true,message:old?'Reset request already pending hai. Admin temporary password set karega.':'Password reset request Admin Dashboard me bhej di gayi hai.'});
  }catch(e){console.error('password-reset-request',e);return res.status(500).json({error:e.message})}
});
app.get('/admin/password-reset-requests',async(req,res)=>{
  try{const ctx=await authContext(req,true);if(!ctx.admin)return res.status(403).json({error:'Admin required'});const rows=await rowsGet('passwordResetRequests');const requests=rows.map(r=>({id:r.id,...r.data})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));return res.json({ok:true,requests})}
  catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/admin/reset-user-password',async(req,res)=>{
  try{
    const ctx=await authContext(req,true);if(!ctx.admin)return res.status(403).json({error:'Admin required'});
    const requestId=String(req.body?.requestId||''),password=String(req.body?.temporaryPassword||'');
    if(password.length<6)return res.status(400).json({error:'Temporary password minimum 6 characters required'});
    const rr=await rowGet('passwordResetRequests',requestId);if(!rr)return res.status(404).json({error:'Reset request not found'});
    const {error}=await supabase().auth.admin.updateUserById(rr.data.uid,{password});if(error)throw error;
    await rowSet('users',rr.data.uid,{mustChangePassword:true,passwordResetAt:now(),updatedAt:now()},true);
    await rowSet('passwordResetRequests',requestId,{status:'Completed',completedAt:now(),updatedAt:now()},true);
    return res.json({ok:true});
  }catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/admin/delete-password-reset-request',async(req,res)=>{
  try{const ctx=await authContext(req,true);if(!ctx.admin)return res.status(403).json({error:'Admin required'});await rowDelete('passwordResetRequests',String(req.body?.requestId||''));return res.json({ok:true})}
  catch(e){return res.status(e.status||500).json({error:e.message})}
});
app.post('/change-own-password',async(req,res)=>{
  try{
    const ctx=await authContext(req,true),password=String(req.body?.newPassword||'');if(password.length<6)return res.status(400).json({error:'New password minimum 6 characters required'});
    const {error}=await supabase().auth.admin.updateUserById(ctx.uid,{password});if(error)throw error;
    await rowSet('users',ctx.uid,{mustChangePassword:false,passwordChangedAt:now(),updatedAt:now()},true);return res.json({ok:true});
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

app.all('/',(req,res)=>{
  const kind=String(req.query?.payu_return||'').toLowerCase();
  const body=req.body||{};
  const looksPayU=!!(
    body.txnid || body.status || body.mihpayid || body.hash ||
    body.udf1 || body.udf2 || body.productinfo
  );

  if(kind==='success' || (looksPayU && kind!=='failure')){
    return handlePaymentReturn(req,res,'success');
  }
  if(kind==='failure'){
    return handlePaymentReturn(req,res,'failure');
  }

  return res.json({ok:true,service:'KCSC Supabase Auth + PayU Backend',version:'5.0.0'});
});

app.post('/create-payment',async(req,res)=>{
 try{
  if(!PAYU_KEY||!PAYU_SALT||!BACKEND_BASE) return res.status(500).json({error:'PayU/Supabase backend environment not configured'});
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

  const surl=`${BACKEND_BASE}/payment-success`;
  const furl=`${BACKEND_BASE}/payment-failure`;
  console.log('PAYU-CREATE', {txnid,applicationDocId:appId,surl,furl,amount});

  return res.json({paymentUrl:payuEndpoints().payment,params:{
    key:PAYU_KEY,txnid,amount,productinfo:pinfo,firstname,email,phone,udf1,udf2,
    surl,furl,hash
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

async function processPaymentReturnData(data,kind){
  data=data||{};
  const txnid=String(data.txnid||data.txnId||data.transactionId||'').trim();
  let applicationId=String(data.udf1||data.applicationId||'').trim();
  let paid=false;
  let paymentStatus='Pending';

  try{
    if(txnid){
      const pay=await rowGet('payments',txnid);
      if(pay) applicationId=String(pay.data?.applicationId||applicationId||'');

      // Primary verification is always server-to-server PayU Verify API.
      try{
        const v=await verifyWithPayU(txnid);
        const d=v.detail||{};
        if(Object.keys(d).length){
          const safeData={
            txnid,
            udf1:applicationId||pay?.data?.applicationId||'',
            udf2:pay?.data?.applicationDocId||data.udf2||'',
            amount:d.amt??d.amount??d.transaction_amount??pay?.data?.amount??data.amount??0,
            status:d.status||d.transaction_status||d.unmappedstatus||d.unmapped_status||'',
            mihpayid:d.mihpayid||d.mihpayId||'',
            bank_ref_num:d.bank_ref_num||d.bank_ref_no||''
          };
          const r=await updatePaymentState(safeData,kind==='success'?'success':'failure');
          applicationId=r.applicationId||applicationId;
          paid=!!r.paid;
          paymentStatus=r.paymentStatus||paymentStatus;
        }else if(data.hash && verifyResponseHash(data)){
          const r=await updatePaymentState(data,kind==='success'?'success':'failure');
          applicationId=r.applicationId||applicationId;
          paid=!!r.paid;
          paymentStatus=r.paymentStatus||paymentStatus;
        }
      }catch(e){
        console.error(`PayU ${kind} verify warning`,e.message);
        if(data.hash && verifyResponseHash(data)){
          try{
            const r=await updatePaymentState(data,kind==='success'?'success':'failure');
            applicationId=r.applicationId||applicationId;
            paid=!!r.paid;
            paymentStatus=r.paymentStatus||paymentStatus;
          }catch(inner){
            console.error(`PayU ${kind} signed fallback warning`,inner.message);
          }
        }
      }
    }
  }catch(e){
    console.error(`payment-${kind} processing error`,e);
  }

  return {applicationId,txnid,paid,paymentStatus};
}

function paymentRedirectUrl(result,kind){
  const {applicationId='',txnid='',paid=false}=result||{};
  if(kind==='failure'){
    return `${WEBSITE_URL}/portal/payment-failure.html?${new URLSearchParams({applicationId,txnid})}`;
  }
  return `${WEBSITE_URL}/portal/payment-success.html?${new URLSearchParams({
    applicationId,txnid,payment:paid?'success':'review'
  })}`;
}

async function handlePaymentReturn(req,res,kind){
  const data={...(req.query||{}),...(req.body||{})};
  const result=await processPaymentReturnData(data,kind);
  return res.redirect(303,paymentRedirectUrl(result,kind));
}

// PAYU CANONICAL CALLBACK ROUTES v4.6
// Registered once at server startup (NOT inside middleware).
app.all('/payment-success', (req,res) => {
  console.log('PAYU-REAL-SUCCESS', {
    method:req.method,
    path:req.originalUrl,
    txnid:String((req.body||{}).txnid || (req.query||{}).txnid || '')
  });
  return handlePaymentReturn(req,res,'success');
});
app.all('/payment-success/', (req,res) => handlePaymentReturn(req,res,'success'));

app.all('/payment-failure', (req,res) => {
  console.log('PAYU-REAL-FAILURE', {
    method:req.method,
    path:req.originalUrl,
    txnid:String((req.body||{}).txnid || (req.query||{}).txnid || '')
  });
  return handlePaymentReturn(req,res,'failure');
});
app.all('/payment-failure/', (req,res) => handlePaymentReturn(req,res,'failure'));

// Explicit canonical + common PayU callback aliases.
const SUCCESS_PATHS=[
  '/payment_success','/payment_success/',
  '/paymentsuccess','/paymentsuccess/','/payu/success','/payu/success/',
  '/payu/payment-success','/payu/payment-success/','/success','/success/'
];
const FAILURE_PATHS=[
  '/payment_failure','/payment_failure/',
  '/paymentfailure','/paymentfailure/','/payu/failure','/payu/failure/',
  '/payu/payment-failure','/payu/payment-failure/','/failure','/failure/'
];

app.all(SUCCESS_PATHS,(req,res)=>handlePaymentReturn(req,res,'success'));
app.all(FAILURE_PATHS,(req,res)=>handlePaymentReturn(req,res,'failure'));

// Final callback safety-net: any PayU-like success/failure path is handled,
// so Express can never return its default "Not Found" for a payment return.
app.use((req,res,next)=>{
  const p=String(req.path||'').toLowerCase().replace(/[_\s]+/g,'-');
  const looksPayment=p.includes('payment')||p.includes('payu')||p.includes('txn');
  if(looksPayment && (p.includes('success')||p.endsWith('/success'))){
    return handlePaymentReturn(req,res,'success');
  }
  if(looksPayment && (p.includes('failure')||p.includes('failed')||p.endsWith('/failure'))){
    return handlePaymentReturn(req,res,'failure');
  }
  next();
});


// ABSOLUTE PAYU RETURN SAFETY-NET v4.3
// Some PayU/browser flows can return to an unexpected callback path.
// If the request itself clearly contains PayU transaction fields, handle it
// as a payment return instead of allowing Express to answer "Not Found".
app.use((req,res,next)=>{
  try{
    const data={...(req.query||{}),...(req.body||{})};
    const ref=String(req.get('referer')||req.get('referrer')||'').toLowerCase();
    const path=String(req.path||'').toLowerCase();

    const hasTxn=!!String(data.txnid||data.txnId||data.transactionId||'').trim();
    const hasPayUFields=hasTxn && (
      data.status!==undefined ||
      data.mihpayid!==undefined ||
      data.hash!==undefined ||
      data.udf1!==undefined ||
      data.udf2!==undefined ||
      data.productinfo!==undefined ||
      data.key!==undefined
    );
    const fromPayU=ref.includes('payu.in') || ref.includes('secure.payu') || ref.includes('test.payu');

    if(hasPayUFields || (hasTxn && fromPayU)){
      const rawStatus=String(data.status||data.unmappedstatus||'').toLowerCase();
      const looksFailure=
        rawStatus.includes('fail') ||
        rawStatus.includes('cancel') ||
        rawStatus.includes('bounced') ||
        path.includes('fail');

      console.log('PAYU-CATCHALL', {
        method:req.method,
        path:req.originalUrl,
        txnid:String(data.txnid||data.txnId||data.transactionId||''),
        status:rawStatus||'unknown'
      });

      return handlePaymentReturn(req,res,looksFailure?'failure':'success');
    }
  }catch(e){
    console.error('PAYU-CATCHALL error',e);
  }
  next();
});

// Last-resort page for unmatched callback-looking URLs.
// Never show Express "Not Found" for anything that even looks like a PayU return.
app.use((req,res,next)=>{
  const path=String(req.path||'').toLowerCase();
  const ref=String(req.get('referer')||req.get('referrer')||'').toLowerCase();
  const callbackLooking=
    path.includes('payment') ||
    path.includes('payu') ||
    path.includes('txn') ||
    ref.includes('payu.in');

  if(callbackLooking){
    console.log('PAYU-LAST-RESORT', {method:req.method,path:req.originalUrl,referrer:ref});
    const kind=(path.includes('fail')||path.includes('cancel'))?'failure':'success';
    return handlePaymentReturn(req,res,kind);
  }
  next();
});


const PORT=process.env.PORT||3000;

function parseRawPayuBody(raw,contentType){
  const s=String(raw||'');
  if(!s)return {};
  if(String(contentType||'').toLowerCase().includes('application/json')){
    try{return JSON.parse(s)}catch(_){return {}}
  }
  try{return Object.fromEntries(new URLSearchParams(s))}catch(_){return {}}
}

// IMPORTANT:
// PayU callback is intercepted at Node HTTP level BEFORE Express routing.
// Therefore /payment-success and /payment-failure cannot become Express "Not Found".
const httpServer=http.createServer((req,res)=>{
  let parsed;
  try{parsed=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`)}
  catch(_){parsed=new URL('http://localhost/')}

  const path=String(parsed.pathname||'/').replace(/\/+$/,'')||'/';
  const low=path.toLowerCase();
  const isSuccess=low==='/payment-success';
  const isFailure=low==='/payment-failure';

  if(isSuccess||isFailure){
    const kind=isFailure?'failure':'success';
    const chunks=[];
    let total=0;

    req.on('data',chunk=>{
      total+=chunk.length;
      if(total<=1024*1024)chunks.push(chunk);
    });

    req.on('end',async()=>{
      try{
        const raw=Buffer.concat(chunks).toString('utf8');
        const body=parseRawPayuBody(raw,req.headers['content-type']);
        const query=Object.fromEntries(parsed.searchParams);
        const data={...query,...body};

        console.log('PAYU-RAW-CALLBACK',{
          method:req.method,
          path:req.url,
          txnid:String(data.txnid||''),
          status:String(data.status||'')
        });

        const result=await processPaymentReturnData(data,kind);
        const location=paymentRedirectUrl(result,kind);

        res.statusCode=303;
        res.setHeader('Location',location);
        res.setHeader('Cache-Control','no-store');
        res.setHeader('Content-Type','text/plain; charset=utf-8');
        return res.end('Payment received. Redirecting...');
      }catch(e){
        console.error('PAYU-RAW-CALLBACK error',e);
        const location=paymentRedirectUrl({
          applicationId:'',
          txnid:'',
          paid:false
        },kind);
        res.statusCode=303;
        res.setHeader('Location',location);
        res.setHeader('Cache-Control','no-store');
        return res.end('Redirecting...');
      }
    });

    req.on('error',e=>{
      console.error('PAYU-RAW request error',e);
      res.statusCode=303;
      res.setHeader('Location',`${WEBSITE_URL}/portal/payment-${kind==='failure'?'failure':'success'}.html`);
      res.end();
    });
    return;
  }

  return app(req,res);
});

httpServer.listen(PORT,()=>console.log(`KCSC Supabase Backend v5.0 running on ${PORT}`));