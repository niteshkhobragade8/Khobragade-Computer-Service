import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

let services = [];
let actions = [];
const editedCharges = new Map();
const editedAvailability = new Map();

function serviceName(id){
  return services.find(s => s.id === id)?.name || id || 'Unknown Service';
}
function currentCharge(action){
  return Number(action?.serviceCharge || 0);
}
function currentAvailability(action){
  return action?.availabilityStatus || ((action?.available === false) ? 'Unavailable' : 'Available');
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
function pendingRowCount(){
  return new Set([...editedCharges.keys(), ...editedAvailability.keys()]).size;
}
function updatePendingMessage(){
  const count = pendingRowCount();
  setMessage(
    count ? `${count} row change Save karna baki hai.` : `${actions.length} service/action rows loaded.`,
    count ? 'warning' : 'success'
  );
}
function render(){
  const body = $('allChargeTable');
  if(!body) return;
  const list = rows();
  if(!list.length){
    body.innerHTML = '<tr><td colspan="6">No service/action charges found.</td></tr>';
    setMessage(actions.length ? 'Search me koi matching service/action nahi mila.' : 'Abhi koi service action nahi mila.', 'info');
    return;
  }
  body.innerHTML = list.map((a,i) => {
    const oldCharge = currentCharge(a);
    const chargeValue = editedCharges.has(a.id) ? editedCharges.get(a.id) : oldCharge;
    const availabilityValue = editedAvailability.has(a.id) ? editedAvailability.get(a.id) : currentAvailability(a);
    return `<tr>
      <td>${i+1}</td>
      <td><b>${esc(serviceName(a.serviceId))}</b></td>
      <td>${esc(a.name || 'Action')}</td>
      <td>₹${oldCharge.toFixed(2)}</td>
      <td><input type="number" min="0" step="0.01" value="${Number(chargeValue)}" data-all-charge="${esc(a.id)}" style="width:130px"></td>
      <td>
        <select data-all-availability="${esc(a.id)}">
          <option ${availabilityValue==='Available'?'selected':''}>Available</option>
          <option ${availabilityValue==='Unavailable'?'selected':''}>Unavailable</option>
          <option ${availabilityValue==='Coming Soon'?'selected':''}>Coming Soon</option>
        </select>
      </td>
    </tr>`;
  }).join('');
  updatePendingMessage();
}

$('allChargeTable')?.addEventListener('input', e => {
  const input = e.target.closest('[data-all-charge]');
  if(!input) return;
  const id = input.dataset.allCharge;
  const a = actions.find(x => x.id === id);
  if(!a) return;
  const value = Math.max(0, Number(input.value || 0));
  if(value === currentCharge(a)) editedCharges.delete(id);
  else editedCharges.set(id, value);
  updatePendingMessage();
});

$('allChargeTable')?.addEventListener('change', e => {
  const select = e.target.closest('[data-all-availability]');
  if(!select) return;
  const id = select.dataset.allAvailability;
  const a = actions.find(x => x.id === id);
  if(!a) return;
  const value = select.value || 'Available';
  if(value === currentAvailability(a)) editedAvailability.delete(id);
  else editedAvailability.set(id, value);
  updatePendingMessage();
});

$('allChargeSearch')?.addEventListener('input', render);

$('allChargeSaveAll')?.addEventListener('click', async () => {
  const ids = [...new Set([...editedCharges.keys(), ...editedAvailability.keys()])];
  const changes = ids.map(id => {
    const a = actions.find(x => x.id === id);
    if(!a) return null;
    const charge = editedCharges.has(id) ? Number(editedCharges.get(id)) : currentCharge(a);
    const availability = editedAvailability.has(id) ? editedAvailability.get(id) : currentAvailability(a);
    return {
      id,
      charge,
      availability,
      chargeChanged: charge !== currentCharge(a),
      availabilityChanged: availability !== currentAvailability(a)
    };
  }).filter(x => x && (x.chargeChanged || x.availabilityChanged));

  if(!changes.length){
    setMessage('Koi charge ya availability change nahi hua.', 'info');
    return;
  }
  if(!confirm(`${changes.length} service/action rows update karein?`)) return;

  const btn = $('allChargeSaveAll');
  if(btn) btn.disabled = true;
  setMessage(`${changes.length} rows update ho rahe hain...`, 'info');

  let done = 0;
  try{
    for(const change of changes){
      const payload = { updatedAt: serverTimestamp() };
      if(change.chargeChanged) payload.serviceCharge = Number(change.charge);
      if(change.availabilityChanged){
        payload.availabilityStatus = change.availability;
        payload.available = change.availability === 'Available';
      }
      await updateDoc(doc(db, 'serviceActions', change.id), payload);
      done++;
    }
    editedCharges.clear();
    editedAvailability.clear();
    setMessage(`✅ ${done} rows successfully updated. Charge aur availability dono live use honge.`, 'success');
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
  for(const id of [...editedCharges.keys()]) if(!actions.some(a=>a.id===id)) editedCharges.delete(id);
  for(const id of [...editedAvailability.keys()]) if(!actions.some(a=>a.id===id)) editedAvailability.delete(id);
  render();
}, err => setMessage('Charges load error: '+err.message,'danger'));
