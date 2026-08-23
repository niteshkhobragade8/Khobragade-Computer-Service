import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

let services = [];
let actions = [];
const edited = new Map();

function serviceName(id){
  return services.find(s => s.id === id)?.name || id || 'Unknown Service';
}

function currentCharge(action){
  return Number(action?.serviceCharge || 0);
}

function setMessage(text, type='info'){
  const box = $('allChargeMessage');
  if(!box) return;
  box.textContent = text;
  box.className = `settings-message ${type}`;
}

function rows(){
  const q = ($('allChargeSearch')?.value || '').trim().toLowerCase();
  return [...actions]
    .filter(a => !q || `${serviceName(a.serviceId)} ${a.name || ''}`.toLowerCase().includes(q))
    .sort((a,b) => serviceName(a.serviceId).localeCompare(serviceName(b.serviceId)) || Number(a.order||0)-Number(b.order||0));
}

function render(){
  const body = $('allChargeTable');
  if(!body) return;
  const list = rows();
  if(!list.length){
    body.innerHTML = '<tr><td colspan="5">No service/action charges found.</td></tr>';
    setMessage(actions.length ? 'Search me koi matching charge nahi mila.' : 'Abhi koi service action nahi mila.', 'info');
    return;
  }
  body.innerHTML = list.map((a,i) => {
    const old = currentCharge(a);
    const value = edited.has(a.id) ? edited.get(a.id) : old;
    return `<tr>
      <td>${i+1}</td>
      <td><b>${esc(serviceName(a.serviceId))}</b></td>
      <td>${esc(a.name || 'Action')}</td>
      <td>₹${old.toFixed(2)}</td>
      <td><input type="number" min="0" step="0.01" value="${Number(value)}" data-all-charge="${esc(a.id)}" style="width:130px" aria-label="New charge for ${esc(serviceName(a.serviceId))} ${esc(a.name||'Action')}"></td>
    </tr>`;
  }).join('');
  const changedCount = [...edited.entries()].filter(([id,val]) => {
    const a = actions.find(x=>x.id===id);
    return a && Number(val) !== currentCharge(a);
  }).length;
  setMessage(changedCount ? `${changedCount} charge change Save karna baki hai.` : `${actions.length} service/action charges loaded.`, changedCount ? 'warning' : 'success');
}

$('allChargeTable')?.addEventListener('input', e => {
  const input = e.target.closest('[data-all-charge]');
  if(!input) return;
  const id = input.dataset.allCharge;
  const val = Math.max(0, Number(input.value || 0));
  edited.set(id, val);
  const a = actions.find(x=>x.id===id);
  if(a && val === currentCharge(a)) edited.delete(id);
  const changedCount = edited.size;
  setMessage(changedCount ? `${changedCount} charge change Save karna baki hai.` : `${actions.length} service/action charges loaded.`, changedCount ? 'warning' : 'success');
});

$('allChargeSearch')?.addEventListener('input', render);

$('allChargeSaveAll')?.addEventListener('click', async () => {
  const changes = [...edited.entries()].filter(([id,val]) => {
    const a = actions.find(x=>x.id===id);
    return a && Number(val) !== currentCharge(a);
  });
  if(!changes.length){
    setMessage('Koi charge change nahi hua.', 'info');
    return;
  }
  if(!confirm(`${changes.length} service/action charges update karein?`)) return;
  const btn = $('allChargeSaveAll');
  if(btn) btn.disabled = true;
  setMessage(`${changes.length} charges update ho rahe hain...`, 'info');
  let done = 0;
  try{
    for(const [id, charge] of changes){
      await updateDoc(doc(db,'serviceActions',id), { serviceCharge:Number(charge), updatedAt:serverTimestamp() });
      done++;
    }
    edited.clear();
    setMessage(`✅ ${done} charges successfully updated. User payment me latest charge automatically use hoga.`, 'success');
  }catch(err){
    setMessage(`❌ ${done} updated; baaki update fail: ${err.message}`, 'danger');
  }finally{
    if(btn) btn.disabled = false;
  }
});

onSnapshot(collection(db,'services'), snap => {
  services = snap.docs.map(d => ({id:d.id, ...d.data()}));
  render();
}, err => setMessage('Services load error: '+err.message,'danger'));

onSnapshot(collection(db,'serviceActions'), snap => {
  actions = snap.docs.map(d => ({id:d.id, ...d.data()}));
  // Remove stale edit entries after live update/delete.
  for(const id of [...edited.keys()]) if(!actions.some(a=>a.id===id)) edited.delete(id);
  render();
}, err => setMessage('Charges load error: '+err.message,'danger'));
