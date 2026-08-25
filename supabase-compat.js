
// KCSC Supabase database compatibility layer.
// Keeps the existing document-style application code working while all
// document data is stored in Supabase through the secure Render backend.

import { DATA_API_URL } from './supabase-config.js';
import { supabase } from './supabase-client.js';

const CACHE = new Map();
const LISTENERS = new Map();
const POLLERS = new Map();
const DEFAULT_POLL = 45000;
const FAST_COLLECTIONS = new Set([
  'applications','payments','paymentScreenshots','notifications',
  'commissionLedger','passwordResetRequests'
]);

class CompatTimestamp {
  constructor(value = new Date()) {
    this._date = value instanceof Date ? value : new Date(value);
    this.seconds = Math.floor(this._date.getTime() / 1000);
    this.nanoseconds = (this._date.getTime() % 1000) * 1000000;
  }
  toDate(){ return new Date(this._date); }
  toMillis(){ return this._date.getTime(); }
  toJSON(){ return this._date.toISOString(); }
}

function isIsoDate(v){
  return typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v);
}
function revive(v){
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k,val] of Object.entries(v)) out[k] = revive(val);
    return out;
  }
  return isIsoDate(v) ? new CompatTimestamp(v) : v;
}
function serialize(v){
  if (v instanceof CompatTimestamp) return v.toJSON();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') {
    if (v.__kcscIncrement) return v;
    const out = {};
    for (const [k,val] of Object.entries(v)) out[k] = serialize(val);
    return out;
  }
  return v;
}

async function sessionToken(){
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  } catch (_) { return ''; }
}

async function api(path, body = {}, method = 'POST'){
  const token = await sessionToken();
  const r = await fetch(DATA_API_URL + path, {
    method,
    headers: {
      'Content-Type':'application/json',
      ...(token ? {'Authorization':'Bearer '+token} : {})
    },
    body: method === 'GET' ? undefined : JSON.stringify(body)
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) {
    const e = new Error(j.error || j.message || `Database request failed (${r.status})`);
    e.code = j.code || 'supabase/request-failed';
    throw e;
  }
  return j;
}

function makeDocSnap(row, fallbackId=''){
  const exists = !!row;
  const id = row?.id || fallbackId;
  const data = row ? revive(row.data || {}) : undefined;
  return {
    id,
    exists: () => exists,
    data: () => data,
    ref: {kind:'doc', collection:row?.collection, id}
  };
}
function makeQuerySnap(rows=[]){
  const docs = rows.map(r => makeDocSnap(r));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach(fn){ docs.forEach(fn); }
  };
}
function cacheKey(collectionName){ return 'c:'+collectionName; }

function collection(_db, name){ return {kind:'collection', name:String(name)}; }
function doc(first, ...parts){
  if (first?.kind === 'collection') {
    const id = parts[0] || crypto.randomUUID();
    return {kind:'doc', collection:first.name, id:String(id)};
  }
  const [collectionName, id] = parts;
  return {kind:'doc', collection:String(collectionName), id:String(id)};
}
function getDatabase(){ return {kind:'supabase-db'}; }

function where(field, op, value){ return {type:'where', field, op, value}; }
function orderBy(field, direction='asc'){ return {type:'orderBy', field, direction}; }
function limit(count){ return {type:'limit', count:Number(count)}; }
function query(base, ...constraints){ return {kind:'query', base, constraints}; }

function applyConstraints(rows, constraints=[]){
  let out = [...rows];
  for (const c of constraints) {
    if (c.type === 'where') {
      out = out.filter(r => {
        const v = (r.data || {})[c.field];
        if (c.op === '==') return v === c.value;
        if (c.op === '!=') return v !== c.value;
        if (c.op === '>') return v > c.value;
        if (c.op === '>=') return v >= c.value;
        if (c.op === '<') return v < c.value;
        if (c.op === '<=') return v <= c.value;
        return true;
      });
    } else if (c.type === 'orderBy') {
      const dir = c.direction === 'desc' ? -1 : 1;
      out.sort((a,b)=>{
        let av=(a.data||{})[c.field], bv=(b.data||{})[c.field];
        const norm=x=>x?.seconds ? x.seconds*1000 : (isIsoDate(x)?new Date(x).getTime():x);
        av=norm(av); bv=norm(bv);
        return av===bv ? 0 : (av>bv?1:-1)*dir;
      });
    } else if (c.type === 'limit') out = out.slice(0,c.count);
  }
  return out;
}
function baseCollection(ref){
  if (ref.kind === 'collection') return ref.name;
  if (ref.kind === 'query') return ref.base.name;
  return '';
}

async function fetchCollection(name, force=false){
  const key=cacheKey(name), cached=CACHE.get(key);
  if (!force && cached && Date.now()-cached.at < 5000) return cached.rows;
  const j=await api('/supabase/query',{collection:name});
  const rows=(j.rows||[]).map(r=>({collection:name,id:r.id,data:revive(r.data||{})}));
  CACHE.set(key,{at:Date.now(),rows});
  return rows;
}
async function getDocs(ref){
  const name=baseCollection(ref);
  const rows=await fetchCollection(name, true);
  const filtered=ref.kind==='query'?applyConstraints(rows,ref.constraints):rows;
  return makeQuerySnap(filtered);
}
async function getDoc(ref){
  const j=await api('/supabase/query',{collection:ref.collection,id:ref.id});
  return makeDocSnap(j.row ? {collection:ref.collection,...j.row}:null, ref.id);
}

function serverTimestamp(){ return new CompatTimestamp(new Date()); }
function increment(amount=1){ return {__kcscIncrement:Number(amount)}; }
function arrayUnion(...items){ return {__kcscArrayUnion:items}; }

async function resolveIncrements(collectionName,id,data){
  const hasInc = JSON.stringify(data).includes('__kcscIncrement');
  if(!hasInc) return serialize(data);
  const snap=await getDoc({kind:'doc',collection:collectionName,id});
  const old=snap.exists()?snap.data():{};
  const walk=(v,keyPath=[])=>{
    if(Array.isArray(v)) return v.map((x,i)=>walk(x,[...keyPath,i]));
    if(v&&typeof v==='object'&&v.__kcscIncrement!==undefined){
      let cur=old;
      for(const k of keyPath) cur=cur?.[k];
      return Number(cur||0)+Number(v.__kcscIncrement||0);
    }
    if(v&&typeof v==='object'&&Array.isArray(v.__kcscArrayUnion)){
      let cur=old;
      for(const k of keyPath) cur=cur?.[k];
      const base=Array.isArray(cur)?[...cur]:[];
      for(const item of v.__kcscArrayUnion){
        const serialized=serialize(item);
        if(!base.some(x=>JSON.stringify(serialize(x))===JSON.stringify(serialized))) base.push(serialized);
      }
      return base;
    }
    if(v&&typeof v==='object'){
      const o={}; for(const [k,x] of Object.entries(v)) o[k]=walk(x,[...keyPath,k]); return o;
    }
    return serialize(v);
  };
  return walk(data);
}
async function writeOne(op, ref, data={}, options={}){
  const payload=await resolveIncrements(ref.collection,ref.id,data);
  const j=await api('/supabase/write',{
    op,collection:ref.collection,id:ref.id,data:payload,merge:!!options.merge
  });
  CACHE.delete(cacheKey(ref.collection));
  return j;
}
async function setDoc(ref,data,options={}){ return writeOne('set',ref,data,options); }
async function updateDoc(ref,data){ return writeOne('update',ref,data,{merge:true}); }
async function deleteDoc(ref){
  const j=await api('/supabase/write',{op:'delete',collection:ref.collection,id:ref.id});
  CACHE.delete(cacheKey(ref.collection)); return j;
}
async function addDoc(collectionRef,data){
  const id=crypto.randomUUID();
  await setDoc({kind:'doc',collection:collectionRef.name,id},data);
  return {id};
}

function listenerKey(ref){
  if(ref.kind==='doc') return `d:${ref.collection}:${ref.id}`;
  return `q:${baseCollection(ref)}:${JSON.stringify(ref.constraints||[])}`;
}
async function emitListener(entry){
  try{
    if(entry.ref.kind==='doc') entry.cb(await getDoc(entry.ref));
    else entry.cb(await getDocs(entry.ref));
  }catch(e){ entry.err?.(e); }
}
function ensurePoller(collectionName){
  if(POLLERS.has(collectionName)) return;
  const ms=FAST_COLLECTIONS.has(collectionName)?15000:DEFAULT_POLL;
  const timer=setInterval(async()=>{
    if(document.visibilityState==='hidden') return;
    CACHE.delete(cacheKey(collectionName));
    for(const entry of LISTENERS.values()){
      if(baseCollection(entry.ref)===collectionName || entry.ref.collection===collectionName) emitListener(entry);
    }
  },ms);
  POLLERS.set(collectionName,timer);
}
function onSnapshot(ref, cb, err){
  const key=listenerKey(ref)+'::'+crypto.randomUUID();
  const entry={ref,cb,err}; LISTENERS.set(key,entry);
  ensurePoller(ref.kind==='doc'?ref.collection:baseCollection(ref));
  queueMicrotask(()=>emitListener(entry));
  return ()=>LISTENERS.delete(key);
}

function writeBatch(){
  const ops=[];
  return {
    set(ref,data,options={}){ops.push({op:'set',ref,data,options});return this;},
    update(ref,data){ops.push({op:'update',ref,data,options:{merge:true}});return this;},
    delete(ref){ops.push({op:'delete',ref});return this;},
    async commit(){
      const payload=[];
      for(const x of ops){
        payload.push({
          op:x.op,collection:x.ref.collection,id:x.ref.id,
          data:x.data?await resolveIncrements(x.ref.collection,x.ref.id,x.data):undefined,
          merge:!!x.options?.merge
        });
      }
      const j=await api('/supabase/batch',{operations:payload});
      for(const x of ops) CACHE.delete(cacheKey(x.ref.collection));
      return j;
    }
  };
}

export {
  CompatTimestamp, collection, doc, getDatabase, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit,
  serverTimestamp, increment, arrayUnion, writeBatch
};
