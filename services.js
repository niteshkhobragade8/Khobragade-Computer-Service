import { db } from "./firebase-config.js";
import { DEFAULT_SERVICES, DEFAULT_SCHEMES, DEFAULT_DIVYANG } from "./catalog-data.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const saveButton = $("saveService");
const list = $("servicesList");
const searchInput = $("serviceSearch");
const categoryFilter = $("serviceCategoryFilter");
const statusFilter = $("serviceStatusFilter");
let editId = null;
let allServices = [];

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
  const filtered = allServices.filter((item) => {
    const matchesSearch = !search || `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(search);
    const matchesCategory = category === "all" || item.category === category;
    const itemStatus = item.status || "Published";
    const matchesStatus = status === "all" || itemStatus === status;
    return matchesSearch && matchesCategory && matchesStatus;
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
      await updateDoc(doc(db, "services", editId), { name, nameHI, nameMR, description, descriptionHI, descriptionMR, category, icon, status, featured, updatedAt: serverTimestamp() });
      alert("Service Updated Successfully");
    } else {
      await addDoc(collection(db, "services"), { name, nameHI, nameMR, description, descriptionHI, descriptionMR, category, icon, status, featured, createdAt: serverTimestamp() });
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
  if (!confirm("Complete CSC + Yojana + Divyang catalog Firebase me add karna hai? Existing duplicate names skip honge.")) return;
  const catalog = [...DEFAULT_SERVICES, ...DEFAULT_SCHEMES, ...DEFAULT_DIVYANG];
  const existing = new Set(allServices.map((x) => String(x.name || "").replace(/\s+/g," ").trim().toLocaleLowerCase()));
  let added = 0, skipped = 0;
  if (button) { button.disabled = true; button.textContent = "Loading Catalog..."; }
  try {
    for (const item of catalog) {
      const key = String(item.name || "").replace(/\s+/g," ").trim().toLocaleLowerCase();
      if (!key || existing.has(key)) { skipped++; continue; }
      await addDoc(collection(db,"services"), {...item,status:"Published",featured:false,createdAt:serverTimestamp()});
      existing.add(key); added++;
    }
    alert(`Catalog Ready: ${added} added, ${skipped} duplicates skipped.`);
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
  if ($("serviceFeatured")) $("serviceFeatured").checked = Boolean(item.featured);
  saveButton.textContent = "Update Service";
  document.querySelector(".service-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteService(id) {
  if (!confirm("Delete this service?")) return;
  try {
    await deleteDoc(doc(db, "services", id));
    alert("Service Deleted Successfully");
  } catch (error) {
    alert(error.message);
  }
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

const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
  allServices = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  renderServices();
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
