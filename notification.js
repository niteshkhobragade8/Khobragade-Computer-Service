import { moveToTrash } from './trash.js';
import { db } from "./supabase-app.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from './supabase-db.js';

const CLOUD_NAME = "jkia38fa";
const UPLOAD_PRESET = "khobragade_csc";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const $ = (id) => document.getElementById(id);
const saveButton = $("saveNotification");
const list = $("notificationList");
const searchInput = $("notificationSearch");
const typeFilter = $("notificationTypeFilter");
let editId = null;
let allNotifications = [];
let currentImageUrl = "";

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
    return matchesSearch && (type === "all" || item.type === type);
  });
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No Notifications Available</div>`;
  } else {
    list.innerHTML = filtered.map((item) => `
      <article class="content-card notification-card priority-${String(item.priority || "Medium").toLowerCase()}">
        <div class="content-card-head"><div><span class="status-badge ${String(item.status || "Published").toLowerCase()}">${escapeHTML(item.status || "Published")}</span> <span class="type-badge">${escapeHTML(item.type || "normal")}</span></div><small>${escapeHTML(formatDate(item.createdAt || item.updatedAt))}</small></div>
        ${item.imageUrl ? `<img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title || 'Notification')}" style="width:100%;max-height:220px;object-fit:cover;border-radius:14px;margin:10px 0" loading="lazy">` : ""}
        <h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p>
        <div class="notification-meta">Priority: <strong>${escapeHTML(item.priority || "Medium")}</strong> · Audience: <strong>${escapeHTML(item.audience || "all")}</strong> · Target: <strong>${escapeHTML(item.target === "_blank" ? "New Tab" : "Same Window")}</strong></div>
        <div class="card-actions"><button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button><button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button></div>
      </article>`).join("");
  }
  if ($("totalNotifications")) $("totalNotifications").textContent = allNotifications.length;
  if ($("notificationModuleTotal")) $("notificationModuleTotal").textContent = allNotifications.length;
  if ($("publishedNotifications")) $("publishedNotifications").textContent = allNotifications.filter((item) => (item.status || "Published") === "Published").length;
  if ($("draftNotifications")) $("draftNotifications").textContent = allNotifications.filter((item) => item.status === "Draft").length;
}

function updatePreview() {
  const preview = $("notificationPreview");
  if (!preview) return;
  const file = $("notificationImageFile")?.files?.[0];
  const typed = $("notificationImageUrl")?.value.trim() || currentImageUrl;
  const previewUrl = file ? URL.createObjectURL(file) : typed;
  preview.innerHTML = `<h2>👁 Live Preview</h2>${previewUrl ? `<img src="${escapeHTML(previewUrl)}" style="width:100%;max-height:300px;object-fit:contain;border-radius:14px;margin-bottom:10px">` : ""}<h3>${escapeHTML($("notificationTitle")?.value.trim() || "Notification Title")}</h3><p>${escapeHTML($("notificationDescription")?.value.trim() || "Notification Preview will appear here...")}</p>`;
}

async function uploadNotificationImage() {
  const file = $("notificationImageFile")?.files?.[0];
  const external = $("notificationImageUrl")?.value.trim() || "";
  if (!file) return external || currentImageUrl || "";
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image size 10 MB se kam rakho.");
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);
  data.append("folder", "khobragade-csc/notifications");
  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Notification image upload failed.");
  return result.secure_url || "";
}

function resetForm() {
  $("notificationTitle").value = "";
  $("notificationDescription").value = "";
  $("notificationType").selectedIndex = 0;
  $("notificationPriority").selectedIndex = 0;
  if ($("notificationStatus")) $("notificationStatus").value = "Published";
  if ($("notificationAudience")) $("notificationAudience").value = "all";
  if ($("notificationLink")) $("notificationLink").value = "";
  if ($("notificationTarget")) $("notificationTarget").value = "_self";
  if ($("notificationImageFile")) $("notificationImageFile").value = "";
  if ($("notificationImageUrl")) $("notificationImageUrl").value = "";
  currentImageUrl = "";
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
  const audience = $("notificationAudience")?.value || "all";
  const link = $("notificationLink")?.value.trim() || "";
  const target = $("notificationTarget")?.value || "_self";
  if (!title || !description) return alert("Notification Title aur Description bhariye.");
  saveButton.disabled = true;
  const originalText = saveButton.textContent;
  saveButton.textContent = "Saving...";
  try {
    const imageUrl = await uploadNotificationImage();
    const payload = { title, description, type, priority, status, audience, link, target, imageUrl, updatedAt: serverTimestamp() };
    if (editId) {
      await updateDoc(doc(db, "notifications", editId), payload);
      alert("Notification Updated Successfully");
    } else {
      delete payload.updatedAt;
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, "notifications"), payload);
      alert("Notification Published Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`Notification Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
    if (editId) saveButton.textContent = "Update Notification"; else saveButton.textContent = originalText || "Publish Notification";
  }
}

function editNotification(id) {
  const item = allNotifications.find((notification) => notification.id === id);
  if (!item) return;
  editId = id;
  currentImageUrl = item.imageUrl || "";
  $("notificationTitle").value = item.title || "";
  $("notificationDescription").value = item.description || "";
  $("notificationType").value = item.type || "breaking";
  $("notificationPriority").value = item.priority || "Medium";
  if ($("notificationStatus")) $("notificationStatus").value = item.status || "Published";
  if ($("notificationAudience")) $("notificationAudience").value = item.audience || "all";
  if ($("notificationLink")) $("notificationLink").value = item.link || "";
  if ($("notificationTarget")) $("notificationTarget").value = item.target || "_self";
  if ($("notificationImageUrl")) $("notificationImageUrl").value = currentImageUrl;
  if ($("notificationImageFile")) $("notificationImageFile").value = "";
  saveButton.textContent = "Update Notification";
  updatePreview();
  document.querySelector(".notification-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteNotification(id) {
  const item = allNotifications.find((x) => x.id === id);
  if (!item || !confirm("Move this notification to Recycle Bin?")) return;
  try { await moveToTrash("notifications", id, item); alert("Notification moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}
async function publishAllNotifications() {
  if (!allNotifications.length) return alert("No Notifications Available");
  const batch = writeBatch(db);
  allNotifications.forEach((item) => batch.update(doc(db, "notifications", item.id), { status: "Published", updatedAt: serverTimestamp() }));
  await batch.commit(); alert("All Notifications Published");
}
async function deleteAllNotifications() {
  if (!allNotifications.length || !confirm("Move ALL Notifications to Recycle Bin?")) return;
  for (const item of [...allNotifications]) await moveToTrash("notifications", item.id, item);
  alert("All Notifications moved to Recycle Bin");
}

saveButton?.addEventListener("click", saveNotification);
list?.addEventListener("click", (event) => { const button = event.target.closest("button[data-action]"); if (!button) return; if (button.dataset.action === "edit") editNotification(button.dataset.id); if (button.dataset.action === "delete") deleteNotification(button.dataset.id); });
searchInput?.addEventListener("input", renderNotifications);
typeFilter?.addEventListener("change", renderNotifications);
$("publishAll")?.addEventListener("click", publishAllNotifications);
$("deleteAll")?.addEventListener("click", deleteAllNotifications);
$("refreshNotifications")?.addEventListener("click", renderNotifications);
["notificationTitle", "notificationDescription", "notificationType", "notificationPriority", "notificationAudience", "notificationLink", "notificationTarget", "notificationImageUrl", "notificationImageFile"].forEach((id) => { $(id)?.addEventListener("input", updatePreview); $(id)?.addEventListener("change", updatePreview); });

const unsubscribe = onSnapshot(collection(db, "notifications"), (snapshot) => {
  allNotifications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  renderNotifications();
}, (error) => { console.error(error); if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`; });
window.editNotification = editNotification;
window.deleteNotification = deleteNotification;
window.refreshNotifications = renderNotifications;
window.addEventListener("beforeunload", unsubscribe);
updatePreview();
export { renderNotifications as loadNotifications };
