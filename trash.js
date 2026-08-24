import {db} from './supabase-app.js';
import {collection,addDoc,doc,deleteDoc,serverTimestamp} from './supabase-db.js';
function clean(v){if(Array.isArray(v))return v.filter(x=>x!==undefined).map(clean);if(v&&typeof v==='object'&&!(v instanceof Date)&&typeof v.toDate!=='function'){const o={};for(const [k,x] of Object.entries(v))if(x!==undefined&&k!=='id')o[k]=clean(x);return o}return v}
export async function moveToTrash(type,id,data){if(!id)throw new Error('Missing item id');await addDoc(collection(db,'recycleBin'),{type,sourceId:id,data:clean(data||{}),deletedAt:serverTimestamp()});await deleteDoc(doc(db,type,id));return true}
