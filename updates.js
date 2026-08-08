import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const saveBtn = $("saveUpdate");
const list = $("updatesList");
const searchInput = $("updateSearch");
const statusFilter = $("updateStatusFilter");
let editId = null;
let allUpdates = [];

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function timeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function renderUpdates() {
  if (!list) return;
  const search = (searchInput?.value || "").trim().toLowerCase();
  const status = statusFilter?.value || "all";
  const filtered = allUpdates.filter((item) => {
    const matchesSearch = !search || `${item.title || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(search);
    const itemStatus = item.status || "Published";
    const matchesStatus = status === "all" || itemStatus === status;
    return matchesSearch && matchesStatus;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No updates found.</div>`;
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <article class="content-card update-card">
      <div class="content-card-head">
        <div>
          <span class="status-badge ${String(item.status || "Published").toLowerCase()}">${escapeHTML(item.status || "Published")}</span>
          ${item.featured ? '<span class="featured-badge">★ Featured</span>' : ''}
        </div>
        <small>${escapeHTML(item.category || "Government Update")}</small>
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description)}</p>
      <div class="card-actions">
        <button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button>
        <button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button>
      </div>
    </article>
  `).join("");
}

function resetForm() {
  $("updateTitle").value = "";
  $("updateDescription").value = "";
  $("updateCategory").selectedIndex = 0;
  if ($("updateStatus")) $("updateStatus").value = "Published";
  if ($("updateFeatured")) $("updateFeatured").checked = false;
  editId = null;
  if (saveBtn) saveBtn.textContent = "Save Update";
}

async function saveUpdate() {
  const title = $("updateTitle")?.value.trim() || "";
  const description = $("updateDescription")?.value.trim() || "";
  const category = $("updateCategory")?.value || "Government Update";
  const status = $("updateStatus")?.value || "Published";
  const featured = Boolean($("updateFeatured")?.checked);

  if (!title || !description) {
    alert("Update Title aur Description bhariye.");
    return;
  }

  saveBtn.disabled = true;
  try {
    if (editId) {
      await updateDoc(doc(db, "updates", editId), {
        title, description, category, status, featured, updatedAt: serverTimestamp()
      });
      alert("Update Updated Successfully");
    } else {
      await addDoc(collection(db, "updates"), {
        title, description, category, status, featured, createdAt: serverTimestamp()
      });
      alert("Update Saved Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`Update Error: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
  }
}

function editUpdate(id) {
  const item = allUpdates.find((update) => update.id === id);
  if (!item) return;
  editId = id;
  $("updateTitle").value = item.title || "";
  $("updateDescription").value = item.description || "";
  $("updateCategory").value = item.category || "Government Update";
  if ($("updateStatus")) $("updateStatus").value = item.status || "Published";
  if ($("updateFeatured")) $("updateFeatured").checked = Boolean(item.featured);
  saveBtn.textContent = "Update Government Update";
  document.querySelector(".update-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteUpdate(id) {
  if (!confirm("Are you sure you want to delete this update?")) return;
  try {
    await deleteDoc(doc(db, "updates", id));
    alert("Update Deleted Successfully");
  } catch (error) {
    alert(error.message);
  }
}

saveBtn?.addEventListener("click", saveUpdate);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editUpdate(button.dataset.id);
  if (button.dataset.action === "delete") deleteUpdate(button.dataset.id);
});
searchInput?.addEventListener("input", renderUpdates);
statusFilter?.addEventListener("change", renderUpdates);

const unsubscribe = onSnapshot(collection(db, "updates"), (snapshot) => {
  allUpdates = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  renderUpdates();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.editUpdate = editUpdate;
window.deleteUpdate = deleteUpdate;
window.refreshUpdates = renderUpdates;
window.clearUpdateForm = resetForm;
window.addEventListener("beforeunload", unsubscribe);

export { renderUpdates as loadUpdates };
