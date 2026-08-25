import { supabase } from './supabase-client.js';
import { auth } from './supabase-auth.js';

const CACHE=new Map();
const CHANNELS=new Map();
const SUBSCRIBERS=new Map();
const POLLERS=new Map();
const INFLIGHT=new Map();
const REALTIME_DEBOUNCE=new Map();
const STATIC_COLLECTIONS=new Set([
  'services','serviceActions','formFields','settings','categories','updates','images','documents',
  'documentChecklists','youtube','themes','pageContent','siteSections','dynamicPages','dynamicSections',
  'menuItems','seoSettings','customButtons'
]);
const TTL_STATIC=60000, TTL_DYNAMIC=4000;

class CompatTimestamp{
  constructor(value=new Date()){
    this._date=value instanceof Date?value:new Date(value);
    this.seconds=Math.floor(this._date.getTime()/1000);
    this.nanoseconds=(this._date.getTime()%1000)*1000000;
  }
  toDate(){return new Date(this._date)}
  toMillis(){return this._date.getTime()}
  toJSON(){return this._date.toISOString()}
}
function isIsoDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v)}
function revive(v){
  if(Array.isArray(v))return v.map(revive);
  if(v&&typeof v==='object'){const o={};for(const[k,x]of Object.entries(v))o[k]=revive(x);return o}
  return isIsoDate(v)?new CompatTimestamp(v):v;
}
function serialize(v){
  if(v instanceof CompatTimestamp)return v.toJSON();
  if(Array.isArray(v))return v.map(serialize);
  if(v&&typeof v==='object'){
    if(v.__kcscIncrement!==undefined||v.__kcscArrayUnion)return v;
    const o={};for(const[k,x]of Object.entries(v))o[k]=serialize(x);return o;
  }
  return v;
}
function collection(_db,name){return{kind:'collection',name:String(name)}}
function doc(first,...parts){
  if(first?.kind==='collection'){const id=parts[0]||crypto.randomUUID();return{kind:'doc',collection:first.name,id:String(id)}}
  const[collectionName,id]=parts;return{kind:'doc',collection:String(collectionName),id:String(id)};
}
function getDatabase(){return{kind:'supabase-db'}}
function where(field,op,value){return{type:'where',field,op,value}}
function orderBy(field,direction='asc'){return{type:'orderBy',field,direction}}
function limit(count){return{type:'limit',count:Number(count)}}
function query(base,...constraints){return{kind:'query',base,constraints}}
function serverTimestamp(){return new CompatTimestamp(new Date())}
function increment(amount=1){return{__kcscIncrement:Number(amount)}}
function arrayUnion(...items){return{__kcscArrayUnion:items}}
function baseCollection(ref){return ref.kind==='collection'?ref.name:ref.kind==='query'?ref.base.name:''}
function ttl(name){return STATIC_COLLECTIONS.has(name)?TTL_STATIC:TTL_DYNAMIC}
function cacheKey(ref){return JSON.stringify([baseCollection(ref),ref.constraints||[]])}
function mapRow(r,name){return{collection:name,id:r.id,data:revive(r.data||{})}}
function makeDocSnap(row,fallbackId=''){const exists=!!row,id=row?.id||fallbackId,data=row?revive(row.data||{}):undefined;return{id,exists:()=>exists,data:()=>data,ref:{kind:'doc',collection:row?.collection,id}}}
function makeQuerySnap(rows=[]){const docs=rows.map(r=>makeDocSnap(r));return{docs,size:docs.length,empty:!docs.length,forEach(fn){docs.forEach(fn)}}}
async function authReady(){try{await auth.authStateReady()}catch(_){}}
function errorOut(error){if(!error)return;const e=new Error(error.message||'Supabase database error');e.code=error.code||'supabase/error';throw e}

function clientFilter(rows,constraints=[]){
  let out=[...rows];
  for(const c of constraints){
    if(c.type==='where'){
      out=out.filter(r=>{const v=(r.data||{})[c.field];if(c.op==='==')return v===c.value;if(c.op==='!=')return v!==c.value;if(c.op==='>')return v>c.value;if(c.op==='>=')return v>=c.value;if(c.op==='<')return v<c.value;if(c.op==='<=')return v<=c.value;return true});
    }else if(c.type==='orderBy'){
      const dir=c.direction==='desc'?-1:1;
      const norm=x=>x?.seconds?x.seconds*1000:isIsoDate(x)?new Date(x).getTime():x;
      out.sort((a,b)=>{const av=norm((a.data||{})[c.field]),bv=norm((b.data||{})[c.field]);return av===bv?0:(av>bv?1:-1)*dir});
    }else if(c.type==='limit')out=out.slice(0,c.count);
  }
  return out;
}
function buildSelect(name,constraints=[]){
  let q=supabase.from('kcsc_documents').select('collection,id,data,created_at,updated_at').eq('collection',name);
  // Push equality filters to PostgREST. This avoids loading thousands of formFields/serviceActions.
  for(const c of constraints){
    if(c.type==='where'&&c.op==='==') q=q.eq(`data->>${c.field}`,String(c.value));
  }
  const lim=constraints.find(c=>c.type==='limit');if(lim)q=q.limit(lim.count);
  return q;
}
async function fetchRows(ref,force=false){
  await authReady();
  const name=baseCollection(ref),key=cacheKey(ref),c=CACHE.get(key);
  if(!force&&c&&Date.now()-c.at<ttl(name))return c.rows;

  // Coalesce identical requests. Many Admin modules watch the same collection.
  // Without this, one page action can trigger the same Supabase query many times.
  if(INFLIGHT.has(key))return INFLIGHT.get(key);

  const task=(async()=>{
    const constraints=ref.constraints||[];
    const{data,error}=await buildSelect(name,constraints);errorOut(error);
    let rows=(data||[]).map(r=>mapRow(r,name));
    rows=clientFilter(rows,constraints.filter(c=>!(c.type==='where'&&c.op==='==')));
    CACHE.set(key,{at:Date.now(),rows});
    return rows;
  })();

  INFLIGHT.set(key,task);
  try{return await task}
  finally{if(INFLIGHT.get(key)===task)INFLIGHT.delete(key)}
}
function invalidate(name){for(const key of [...CACHE.keys()]){try{if(JSON.parse(key)[0]===name)CACHE.delete(key)}catch(_){}}}
async function getDocs(ref){return makeQuerySnap(await fetchRows(ref,false))}
async function getDoc(ref){
  await authReady();
  const key=JSON.stringify(['doc',ref.collection,ref.id]),c=CACHE.get(key);
  if(c&&Date.now()-c.at<ttl(ref.collection))return makeDocSnap(c.row,ref.id);
  const{data,error}=await supabase.from('kcsc_documents').select('collection,id,data,created_at,updated_at').eq('collection',ref.collection).eq('id',ref.id).maybeSingle();errorOut(error);
  const row=data?mapRow(data,ref.collection):null;CACHE.set(key,{at:Date.now(),row});return makeDocSnap(row,ref.id);
}
async function existingData(collectionName,id){const s=await getDoc({kind:'doc',collection:collectionName,id});return s.exists()?s.data():{}}
async function resolveTransforms(collectionName,id,data){
  const str=JSON.stringify(data);if(!str.includes('__kcscIncrement')&&!str.includes('__kcscArrayUnion'))return serialize(data);
  const old=await existingData(collectionName,id);
  const walk=(v,path=[])=>{
    if(Array.isArray(v))return v.map((x,i)=>walk(x,[...path,i]));
    if(v&&typeof v==='object'&&v.__kcscIncrement!==undefined){let cur=old;for(const k of path)cur=cur?.[k];return Number(cur||0)+Number(v.__kcscIncrement||0)}
    if(v&&typeof v==='object'&&Array.isArray(v.__kcscArrayUnion)){let cur=old;for(const k of path)cur=cur?.[k];const base=Array.isArray(cur)?[...cur]:[];for(const item of v.__kcscArrayUnion){const s=serialize(item);if(!base.some(x=>JSON.stringify(serialize(x))===JSON.stringify(s)))base.push(s)}return base}
    if(v&&typeof v==='object'){const o={};for(const[k,x]of Object.entries(v))o[k]=walk(x,[...path,k]);return o}
    return serialize(v);
  };
  return walk(data);
}
async function setDoc(ref,data,options={}){
  await authReady();
  let payload=await resolveTransforms(ref.collection,ref.id,data);
  if(options.merge)payload={...(await existingData(ref.collection,ref.id)),...payload};
  const stamp=new Date().toISOString();
  const{error}=await supabase.from('kcsc_documents').upsert({collection:ref.collection,id:ref.id,data:payload,updated_at:stamp},{onConflict:'collection,id'});errorOut(error);invalidate(ref.collection);return{ok:true,id:ref.id};
}
async function updateDoc(ref,data){return setDoc(ref,data,{merge:true})}
async function deleteDoc(ref){await authReady();const{error}=await supabase.from('kcsc_documents').delete().eq('collection',ref.collection).eq('id',ref.id);errorOut(error);invalidate(ref.collection);return{ok:true}}
async function addDoc(col,data){const id=crypto.randomUUID();await setDoc({kind:'doc',collection:col.name,id},data);return{id}}

function listenerKey(ref){return JSON.stringify([baseCollection(ref),ref.constraints||[]])+'::'+crypto.randomUUID()}
async function emitEntry(entry,{force=true}={}){
  if(entry.closed)return;
  try{
    const name=entry.ref.kind==='doc'?entry.ref.collection:baseCollection(entry.ref);
    if(force)invalidate(name);
    const snap=entry.ref.kind==='doc'
      ? await getDoc(entry.ref)
      : makeQuerySnap(await fetchRows(entry.ref,force));
    if(!entry.closed)entry.cb(snap);
  }catch(e){entry.err?.(e)}
}
function refreshCollection(name,{force=true}={}){
  const entries=[...(SUBSCRIBERS.get(name)||[])];
  if(!entries.length)return;

  // One short debounce for a burst of INSERT/UPDATE events.
  const old=REALTIME_DEBOUNCE.get(name);
  if(old)clearTimeout(old);
  const timer=setTimeout(()=>{
    REALTIME_DEBOUNCE.delete(name);
    for(const entry of entries)emitEntry(entry,{force});
  },120);
  REALTIME_DEBOUNCE.set(name,timer);
}

function ensureCollectionRealtime(name){
  if(CHANNELS.has(name))return;
  const channel=supabase.channel('kcsc-'+name)
    .on('postgres_changes',{event:'*',schema:'public',table:'kcsc_documents',filter:`collection=eq.${name}`},()=>{
      refreshCollection(name,{force:true});
    })
    .subscribe();
  CHANNELS.set(name,channel);

  // Realtime is primary. Polling is only a safety-net now.
  // Heavy 8-second polling across every Admin module was blocking menu/dropdown UI.
  const fast=new Set(['applications','payments','users','commissionLedger']);
  const pollMs=STATIC_COLLECTIONS.has(name)?180000:(fast.has(name)?2000:60000);
  const timer=setInterval(()=>{
    if(document.visibilityState==='hidden')return;
    refreshCollection(name,{force:true});
  },pollMs);
  POLLERS.set(name,timer);
}
function releaseCollectionRealtime(name){
  if((SUBSCRIBERS.get(name)?.size||0)>0)return;
  const ch=CHANNELS.get(name);if(ch)supabase.removeChannel(ch).catch(()=>{});
  CHANNELS.delete(name);
  const timer=POLLERS.get(name);if(timer)clearInterval(timer);POLLERS.delete(name);
  const deb=REALTIME_DEBOUNCE.get(name);if(deb)clearTimeout(deb);REALTIME_DEBOUNCE.delete(name);
  SUBSCRIBERS.delete(name);
}
function onSnapshot(ref,cb,err){
  const name=ref.kind==='doc'?ref.collection:baseCollection(ref);
  const entry={key:listenerKey(ref),ref,cb,err,closed:false};
  if(!SUBSCRIBERS.has(name))SUBSCRIBERS.set(name,new Set());
  SUBSCRIBERS.get(name).add(entry);
  ensureCollectionRealtime(name);
  queueMicrotask(()=>emitEntry(entry,{force:false}));
  return()=>{entry.closed=true;SUBSCRIBERS.get(name)?.delete(entry);releaseCollectionRealtime(name)};
}
function writeBatch(){
  const ops=[];
  return{
    set(ref,data,options={}){ops.push({op:'set',ref,data,options});return this},
    update(ref,data){ops.push({op:'set',ref,data,options:{merge:true}});return this},
    delete(ref){ops.push({op:'delete',ref});return this},
    async commit(){
      // Run independent writes concurrently; much faster than the old sequential Render proxy.
      await Promise.all(ops.map(x=>x.op==='delete'?deleteDoc(x.ref):setDoc(x.ref,x.data,x.options)));
      return{ok:true,count:ops.length};
    }
  };
}

export{CompatTimestamp,collection,doc,getDatabase,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,onSnapshot,query,where,orderBy,limit,serverTimestamp,increment,arrayUnion,writeBatch};
