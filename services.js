import { moveToTrash } from './trash.js';
import { db } from "./app-backend.js";
import { DEFAULT_SERVICES, DEFAULT_SCHEMES, DEFAULT_DIVYANG } from "./catalog-data.js";
import { MASTER_SERVICES } from "./master-catalog.js";
import {
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "./supabase-db.js";

const $ = (id) => document.getElementById(id);
const saveButton = $("saveService");
const list = $("servicesList");
const searchInput = $("serviceSearch");
const categoryFilter = $("serviceCategoryFilter");
const statusFilter = $("serviceStatusFilter");
const availabilityFilter = $("serviceAvailabilityFilter");
let editId = null;
let allServices = [];

const TARGET_SERVICE_COUNT = 242;
function normalizeServiceName(value){ return String(value || "").replace(/\s+/g," ").trim().toLocaleLowerCase(); }
function buildTargetCatalog(){
  const map = new Map();
  for (const item of MASTER_SERVICES) {
    // Current live catalogue intentionally does not expose the generic Aadhaar guidance item.
    if (item.id === "aadhaar-assistance") continue;
    const key = normalizeServiceName(item.name);
    if (!key || map.has(key)) continue;
    map.set(key,{
      name:item.name, category:item.category || "Government", icon:item.icon || "📄",
      description:item.description || `${item.name} service/assistance available.`
    });
  }
  for (const item of [...DEFAULT_SERVICES, ...DEFAULT_SCHEMES, ...DEFAULT_DIVYANG]) {
    const key = normalizeServiceName(item.name);
    if (!key || map.has(key)) continue;
    map.set(key,item);
  }
  return [...map.values()].slice(0,TARGET_SERVICE_COUNT);
}
const TARGET_SERVICE_CATALOG = buildTargetCatalog();
let serviceCatalogSyncRunning = false;
let serviceCatalogSyncDone = false;
let actionCoverageSyncRunning = false;
let actionCoverageSyncDone = false;

function stableCatalogId(name){
  let h=2166136261;
  for(const ch of normalizeServiceName(name)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return `catalog_${(h>>>0).toString(36)}`;
}
function safeActionId(serviceId){
  return `default_${String(serviceId||'service').replace(/[^A-Za-z0-9_-]/g,'_')}`.slice(0,120);
}

async function ensureEveryServiceHasAction(serviceRows){
  if(actionCoverageSyncRunning || actionCoverageSyncDone || !serviceRows?.length) return;
  actionCoverageSyncRunning = true;
  try{
    const snap = await getDocs(collection(db,'serviceActions'));
    const actions = snap.docs.map(d=>({id:d.id,...d.data()}));
    const covered = new Set(actions.map(a=>String(a.serviceId||'')));
    const missing = serviceRows.filter(s=>s.id && !covered.has(String(s.id)));
    if(missing.length){
      const batch = writeBatch(db);
      for(const svc of missing){
        batch.set(doc(db,'serviceActions',safeActionId(svc.id)),{
          serviceId:svc.id,
          name:'Apply Service',
          serviceCharge:Number(svc.serviceCharge||0),
          officialFee:0,
          description:`${svc.name||'Service'} application / assistance`,
          requiredDocuments:[],
          availabilityStatus:svc.availabilityStatus||'Available',
          available:(svc.availabilityStatus||'Available')==='Available',
          order:10,
          autoDefault:true,
          createdAt:serverTimestamp(),
          updatedAt:serverTimestamp()
        },{merge:true});
      }
      await batch.commit();
    }
    actionCoverageSyncDone = true;
  }catch(error){ console.error('Service action coverage sync error:',error); }
  finally{ actionCoverageSyncRunning = false; }
}

async function ensureTargetServiceCatalog(){
  if (serviceCatalogSyncRunning || serviceCatalogSyncDone) return;
  serviceCatalogSyncRunning = true;
  try{
    const currentSnap = await getDocs(collection(db,'services'));
    const currentRows = currentSnap.docs.map(d=>({id:d.id,...d.data()}));
    const existing = new Set(currentRows.map((x)=>normalizeServiceName(x.name)));
    const missing = TARGET_SERVICE_CATALOG.filter((x)=>!existing.has(normalizeServiceName(x.name)));
    const needed = Math.max(0, TARGET_SERVICE_COUNT - currentRows.length);
    const toAdd = missing.slice(0,needed);
    if(toAdd.length){
      const batch = writeBatch(db);
      for(const item of toAdd){
        batch.set(doc(db,'services',stableCatalogId(item.name)),{
          ...item,status:'Published',availabilityStatus:'Available',featured:false,
          createdAt:serverTimestamp(),updatedAt:serverTimestamp()
        },{merge:true});
      }
      await batch.commit();
    }
    serviceCatalogSyncDone = true;
    const finalSnap = await getDocs(collection(db,'services'));
    const finalRows = finalSnap.docs.map(d=>({id:d.id,...d.data()}));
    await ensureEveryServiceHasAction(finalRows);
  }catch(error){ console.error("242 service sync error:",error); }
  finally{ serviceCatalogSyncRunning = false; }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function timeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function fillCategoryFilter() {
  if (!categoryFilter) return;
  const current = categoryFilter.value;
  const categories = [...new Set(allServices.map((item) => item.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>${categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}`;
  if (["all", ...categories].includes(current)) categoryFilter.value = current;
}

function renderServices() {
  if (!list) return;
  fillCategoryFilter();
  const search = (searchInput?.value || "").trim().toLowerCase();
  const category = categoryFilter?.value || "all";
  const status = statusFilter?.value || "all";
  const availability = availabilityFilter?.value || "all";
  const filtered = allServices.filter((item) => {
    const matchesSearch = !search || `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(search);
    const matchesCategory = category === "all" || item.category === category;
    const itemStatus = item.status || "Published";
    const matchesStatus = status === "all" || itemStatus === status;
    const itemAvailability = item.availabilityStatus || "Available";
    const matchesAvailability = availability === "all" || itemAvailability === availability;
    return matchesSearch && matchesCategory && matchesStatus && matchesAvailability;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No services found.</div>`;
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <article class="content-card service-card">
      <div class="content-card-head">
        <span class="service-icon">${escapeHTML(item.icon || "📄")}</span>
        <div>
          <span class="status-badge ${String(item.status || "Published").toLowerCase()}">${escapeHTML(item.status || "Published")}</span>
          ${item.featured ? '<span class="featured-badge">★ Featured</span>' : ''}
          <span class="status-badge ${String(item.availabilityStatus || "Available").toLowerCase().replace(/\s+/g,"-")}">${escapeHTML(item.availabilityStatus || "Available")}</span>
        </div>
      </div>
      <h3>${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.description || "")}</p>
      <small>${escapeHTML(item.category || "Government")}</small>
      <div class="card-actions">
        <button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button>
        <button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button>
      </div>
    </article>
  `).join("");
}

function resetForm() {
  $("serviceName").value = "";
  $("serviceDescription").value = "";
  if ($("serviceNameHI")) $("serviceNameHI").value=""; if ($("serviceNameMR")) $("serviceNameMR").value=""; if ($("serviceDescriptionHI")) $("serviceDescriptionHI").value=""; if ($("serviceDescriptionMR")) $("serviceDescriptionMR").value="";
  $("serviceCategory").selectedIndex = 0;
  $("serviceIcon").value = "";
  if ($("serviceStatus")) $("serviceStatus").value = "Published";
  if ($("serviceAvailability")) $("serviceAvailability").value = "Available";
  if ($("serviceTarget")) $("serviceTarget").value = "_self";
  if ($("serviceFeatured")) $("serviceFeatured").checked = false;
  editId = null;
  if (saveButton) saveButton.textContent = "Save Service";
}

async function saveService() {
  const name = $("serviceName")?.value.trim() || "";
  const description = $("serviceDescription")?.value.trim() || "";
  const nameHI=$("serviceNameHI")?.value.trim()||"", nameMR=$("serviceNameMR")?.value.trim()||"";
  const descriptionHI=$("serviceDescriptionHI")?.value.trim()||"", descriptionMR=$("serviceDescriptionMR")?.value.trim()||"";
  const category = $("serviceCategory")?.value || "Government";
  const icon = $("serviceIcon")?.value.trim() || "📄";
  const status = $("serviceStatus")?.value || "Published";
  const featured = Boolean($("serviceFeatured")?.checked);
  const availabilityStatus = $("serviceAvailability")?.value || "Available";
  const target = $("serviceTarget")?.value || "_self";
  if (!name) {
    alert("Enter Service Name");
    return;
  }
  const normalizedName = name.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  const duplicate = allServices.find((item) => item.id !== editId && String(item.name || "").replace(/\s+/g, " ").trim().toLocaleLowerCase() === normalizedName);
  if (duplicate) {
    alert(`Duplicate Service Not Allowed: "${duplicate.name}" already exists.`);
    return;
  }

  saveButton.disabled = true;
  try {
    if (editId) {
      await updateDoc(doc(db, "services", editId), { name, nameHI, nameMR, description, descriptionHI, descriptionMR, category, icon, status, availabilityStatus, target, featured, updatedAt: serverTimestamp() });
      alert("Service Updated Successfully");
    } else {
      await addDoc(collection(db, "services"), { name, nameHI, nameMR, description, descriptionHI, descriptionMR, category, icon, status, availabilityStatus, target, featured, createdAt: serverTimestamp() });
      alert("Service Saved Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`Service Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
}


async function loadDefaultCatalog() {
  const button = $("loadDefaultCatalog");
  if (!confirm("Complete CSC + Yojana + Divyang catalog Supabase me add karna hai? Existing duplicate names skip honge.")) return;
  const catalog = [...DEFAULT_SERVICES, ...DEFAULT_SCHEMES, ...DEFAULT_DIVYANG];
  const existing = new Set(allServices.map((x) => String(x.name || "").replace(/\s+/g," ").trim().toLocaleLowerCase()));
  let added = 0, skipped = 0;
  if (button) { button.disabled = true; button.textContent = "Loading Catalog..."; }
  try {
    for (const item of catalog) {
      const key = String(item.name || "").replace(/\s+/g," ").trim().toLocaleLowerCase();
      if (!key || existing.has(key)) { skipped++; continue; }
      await addDoc(collection(db,"services"), {...item,status:"Published",availabilityStatus:"Available",featured:false,createdAt:serverTimestamp()});
      existing.add(key); added++;
    }
    await setDoc(doc(db,"settings","website"),{catalogMode:"supabase",updatedAt:serverTimestamp()},{merge:true});
    alert(`Catalog Ready: ${added} added, ${skipped} duplicates skipped. Editable mode ON.`);
  } catch(error) { console.error(error); alert(`Catalog Error: ${error.message}`); }
  finally { if (button) { button.disabled=false; button.textContent="⚡ Load Complete CSC + Yojana + Divyang Catalog"; } }
}

function editService(id) {
  const item = allServices.find((service) => service.id === id);
  if (!item) return;
  editId = id;
  $("serviceName").value = item.name || "";
  $("serviceDescription").value = item.description || "";
  if ($("serviceNameHI")) $("serviceNameHI").value=item.nameHI||""; if ($("serviceNameMR")) $("serviceNameMR").value=item.nameMR||""; if ($("serviceDescriptionHI")) $("serviceDescriptionHI").value=item.descriptionHI||""; if ($("serviceDescriptionMR")) $("serviceDescriptionMR").value=item.descriptionMR||"";
  $("serviceCategory").value = item.category || "Government";
  $("serviceIcon").value = item.icon || "";
  if ($("serviceStatus")) $("serviceStatus").value = item.status || "Published";
  if ($("serviceAvailability")) $("serviceAvailability").value = item.availabilityStatus || "Available";
  if ($("serviceTarget")) $("serviceTarget").value = item.target || "_self";
  if ($("serviceFeatured")) $("serviceFeatured").checked = Boolean(item.featured);
  saveButton.textContent = "Update Service";
  document.querySelector(".service-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteService(id) {
  const item = allServices.find((x) => x.id === id);
  if (!item || !confirm("Move this service to Recycle Bin?")) return;
  try { await moveToTrash("services", id, item); alert("Service moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}

saveButton?.addEventListener("click", saveService);
$("loadDefaultCatalog")?.addEventListener("click", loadDefaultCatalog);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editService(button.dataset.id);
  if (button.dataset.action === "delete") deleteService(button.dataset.id);
});
searchInput?.addEventListener("input", renderServices);
categoryFilter?.addEventListener("change", renderServices);
statusFilter?.addEventListener("change", renderServices);
availabilityFilter?.addEventListener("change", renderServices);

const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
  allServices = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  renderServices();
  ensureTargetServiceCatalog();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.editService = editService;
window.deleteService = deleteService;
window.clearServiceForm = resetForm;
window.refreshServices = renderServices;
window.addEventListener("beforeunload", unsubscribe);

export { renderServices as loadServices };
