import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const saveButton = $("saveNotification");
const list = $("notificationList");
const searchInput = $("notificationSearch");
const typeFilter = $("notificationTypeFilter");
let editId = null;
let allNotifications = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function timeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function formatDate(value) {
  if (!value) return "";
  try {
    if (typeof value.toDate === "function") return value.toDate().toLocaleString();
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
    return new Date(value).toLocaleString();
  } catch (_) { return ""; }
}

function renderNotifications() {
  if (!list) return;
  const search = (searchInput?.value || "").trim().toLowerCase();
  const type = typeFilter?.value || "all";
  const filtered = allNotifications.filter((item) => {
    const matchesSearch = !search || `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(search);
    const matchesType = type === "all" || item.type === type;
    return matchesSearch && matchesType;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No Notifications Available</div>`;
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <article class="content-card notification-card priority-${String(item.priority || "Medium").toLowerCase()}">
      <div class="content-card-head">
        <div>
          <span class="status-badge ${String(item.status || "Published").toLowerCase()}">${escapeHTML(item.status || "Published")}</span>
          <span class="type-badge">${escapeHTML(item.type || "normal")}</span>
        </div>
        <small>${escapeHTML(formatDate(item.createdAt || item.updatedAt))}</small>
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description)}</p>
      <div class="notification-meta">Priority: <strong>${escapeHTML(item.priority || "Medium")}</strong></div>
      <div class="card-actions">
        <button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button>
        <button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button>
      </div>
    </article>
  `).join("");

  if ($("totalNotifications")) $("totalNotifications").textContent = allNotifications.length;
  if ($("notificationModuleTotal")) $("notificationModuleTotal").textContent = allNotifications.length;
  if ($("publishedNotifications")) $("publishedNotifications").textContent = allNotifications.filter((item) => (item.status || "Published") === "Published").length;
  if ($("draftNotifications")) $("draftNotifications").textContent = allNotifications.filter((item) => item.status === "Draft").length;
}

function updatePreview() {
  const preview = $("notificationPreview");
  if (!preview) return;
  preview.innerHTML = `<h2>👁 Live Preview</h2><h3>${escapeHTML($("notificationTitle")?.value.trim() || "Notification Title")}</h3><p>${escapeHTML($("notificationDescription")?.value.trim() || "Notification Preview will appear here...")}</p>`;
}

function resetForm() {
  $("notificationTitle").value = "";
  $("notificationDescription").value = "";
  $("notificationType").selectedIndex = 0;
  $("notificationPriority").selectedIndex = 0;
  if ($("notificationStatus")) $("notificationStatus").value = "Published";
  editId = null;
  if (saveButton) saveButton.textContent = "Publish Notification";
  updatePreview();
}

async function saveNotification() {
  const title = $("notificationTitle")?.value.trim() || "";
  const description = $("notificationDescription")?.value.trim() || "";
  const type = $("notificationType")?.value || "breaking";
  const priority = $("notificationPriority")?.value || "Medium";
  const status = $("notificationStatus")?.value || "Published";
  if (!title || !description) {
    alert("Notification Title aur Description bhariye.");
    return;
  }
  saveButton.disabled = true;
  try {
    if (editId) {
      await updateDoc(doc(db, "notifications", editId), { title, description, type, priority, status, updatedAt: serverTimestamp() });
      alert("Notification Updated Successfully");
    } else {
      await addDoc(collection(db, "notifications"), { title, description, type, priority, status, createdAt: serverTimestamp() });
      alert("Notification Published Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`Notification Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
}

function editNotification(id) {
  const item = allNotifications.find((notification) => notification.id === id);
  if (!item) return;
  editId = id;
  $("notificationTitle").value = item.title || "";
  $("notificationDescription").value = item.description || "";
  $("notificationType").value = item.type || "breaking";
  $("notificationPriority").value = item.priority || "Medium";
  if ($("notificationStatus")) $("notificationStatus").value = item.status || "Published";
  saveButton.textContent = "Update Notification";
  updatePreview();
  document.querySelector(".notification-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteNotification(id) {
  if (!confirm("Delete this notification?")) return;
  try {
    await deleteDoc(doc(db, "notifications", id));
    alert("Notification Deleted Successfully");
  } catch (error) {
    alert(error.message);
  }
}

async function publishAllNotifications() {
  if (!allNotifications.length) return alert("No Notifications Available");
  const batch = writeBatch(db);
  allNotifications.forEach((item) => batch.update(doc(db, "notifications", item.id), { status: "Published", updatedAt: serverTimestamp() }));
  await batch.commit();
  alert("All Notifications Published");
}

async function deleteAllNotifications() {
  if (!allNotifications.length || !confirm("Delete All Notifications?")) return;
  const batch = writeBatch(db);
  allNotifications.forEach((item) => batch.delete(doc(db, "notifications", item.id)));
  await batch.commit();
  alert("All Notifications Deleted");
}

saveButton?.addEventListener("click", saveNotification);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editNotification(button.dataset.id);
  if (button.dataset.action === "delete") deleteNotification(button.dataset.id);
});
searchInput?.addEventListener("input", renderNotifications);
typeFilter?.addEventListener("change", renderNotifications);
$("publishAll")?.addEventListener("click", publishAllNotifications);
$("deleteAll")?.addEventListener("click", deleteAllNotifications);
$("refreshNotifications")?.addEventListener("click", renderNotifications);
["notificationTitle", "notificationDescription", "notificationType", "notificationPriority"].forEach((id) => {
  $(id)?.addEventListener("input", updatePreview);
  $(id)?.addEventListener("change", updatePreview);
});

const unsubscribe = onSnapshot(collection(db, "notifications"), (snapshot) => {
  allNotifications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  renderNotifications();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.editNotification = editNotification;
window.deleteNotification = deleteNotification;
window.refreshNotifications = renderNotifications;
window.addEventListener("beforeunload", unsubscribe);
updatePreview();

export { renderNotifications as loadNotifications };
