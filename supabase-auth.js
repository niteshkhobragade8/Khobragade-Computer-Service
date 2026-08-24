import { supabase } from './supabase-client.js';
import { DATA_API_URL } from './supabase-config.js';

const listeners=new Set();
let readyResolve;
const readyPromise=new Promise(r=>{readyResolve=r});
let initialized=false,readyDone=false;

function compatAuthCode(message=''){
  const m=String(message).toLowerCase();
  if(m.includes('invalid login credentials'))return 'auth/invalid-credential';
  if(m.includes('already registered')||m.includes('already exists'))return 'auth/email-already-in-use';
  if(m.includes('password')&&m.includes('6'))return 'auth/weak-password';
  if(m.includes('rate')||m.includes('too many'))return 'auth/too-many-requests';
  if(m.includes('email'))return 'auth/invalid-email';
  return 'auth/unknown';
}
function authError(message,code){const e=new Error(message||'Authentication failed');e.code=code||compatAuthCode(message);return e}

function adaptUser(user){
  if(!user)return null;
  return {
    ...user,
    uid:user.id,
    email:user.email||'',
    async getIdToken(){const {data}=await supabase.auth.getSession();return data.session?.access_token||'';},
    async getIdTokenResult(){const {data}=await supabase.auth.getSession();return {token:data.session?.access_token||''};}
  };
}
function emit(user){
  auth.currentUser=adaptUser(user);
  for(const cb of [...listeners]){try{cb(auth.currentUser)}catch(e){console.error('auth listener',e)}}
}
async function init(){
  if(initialized)return readyPromise;
  initialized=true;
  try{
    const {data,error}=await supabase.auth.getSession();
    if(error)console.warn('Supabase session:',error.message);
    emit(data.session?.user||null);
    supabase.auth.onAuthStateChange((_event,session)=>emit(session?.user||null));
  }finally{readyDone=true;readyResolve?.();readyResolve=null}
  return readyPromise;
}

export const auth={
  currentUser:null,
  authStateReady:()=>init(),
  onAuthStateChanged(cb){listeners.add(cb);if(readyDone)queueMicrotask(()=>cb(auth.currentUser));else init();return()=>listeners.delete(cb)}
};
init();

async function jsonApi(path,body={},token=''){
  const r=await fetch(DATA_API_URL+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw authError(j.error||j.message||`Request failed (${r.status})`,j.code);
  return j;
}

export async function signInWithEmailAndPassword(_auth,email,password){
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error)throw authError(error.message);
  auth.currentUser=adaptUser(data.user);
  return {user:auth.currentUser};
}
export async function createUserWithEmailAndPassword(_auth,email,password){
  // Backend creates a confirmed Supabase user, then browser signs in normally.
  await jsonApi('/auth/register',{email,password});
  return signInWithEmailAndPassword(auth,email,password);
}
export function onAuthStateChanged(_auth,cb){return auth.onAuthStateChanged(cb)}
export async function signOut(){await supabase.auth.signOut();auth.currentUser=null}
export async function sendPasswordResetEmail(_auth,email){
  const redirectTo=new URL('login.html?reset=1',location.href).href;
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
  if(error)throw authError(error.message);
}
export async function updatePassword(user,newPassword){
  if(!user)throw authError('Please login again.','auth/requires-recent-login');
  const {data,error}=await supabase.auth.updateUser({password:newPassword});
  if(error)throw authError(error.message);
  auth.currentUser=adaptUser(data.user);
  return {user:auth.currentUser};
}
export function getAuth(){return auth}
export async function setPersistence(){return true}
export const browserLocalPersistence='local';

export async function adminCreateUser(email,password,metadata={}){
  const {data}=await supabase.auth.getSession();
  const token=data.session?.access_token||'';
  if(!token)throw authError('Admin login required.');
  const j=await jsonApi('/auth/admin-create-user',{email,password,metadata},token);
  return {user:{uid:j.user.id,id:j.user.id,email:j.user.email||email}};
}
export async function adminDeleteUser(uid){
  const {data}=await supabase.auth.getSession();
  const token=data.session?.access_token||'';
  if(!token)throw authError('Admin login required.');
  return jsonApi('/auth/admin-delete-user',{uid},token);
}
