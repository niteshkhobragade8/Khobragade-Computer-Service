import { moveToTrash } from './trash.js';
import { db } from "./supabase-app.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "./supabase-compat.js";

const $ = (id) => document.getElementById(id);
const list = $("youtubeList");
const saveButton = $("saveYoutube");
const searchInput = $("youtubeSearch");
let editId = null;
let allVideos = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalizeYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(parsed.hostname)) return "";
    return parsed.href;
  } catch (_) { return ""; }
}

function videoIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2];
    return parsed.searchParams.get("v") || "";
  } catch (_) { return ""; }
}

function renderVideos() {
  if (!list) return;
  const search = (searchInput?.value || "").trim().toLowerCase();
  const filtered = allVideos.filter((item) => !search || `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(search));
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No Videos Available</div>`;
    return;
  }
  list.innerHTML = filtered.map((item) => {
    const videoId = videoIdFromUrl(item.link || "");
    const thumb = videoId ? `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : "";
    return `
      <article class="youtube-card">
        ${thumb ? `<img src="${thumb}" alt="${escapeHTML(item.title)}" loading="lazy">` : '<div class="youtube-placeholder">▶</div>'}
        <div class="youtube-body">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description || "")}</p><small>Target: ${escapeHTML(item.target === "_self" ? "Same Window" : "New Tab")}</small>
          <a class="text-link" href="${escapeHTML(item.link)}" target="_blank" rel="noopener">▶ Watch Video</a>
          <div class="card-actions">
            <button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button>
            <button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function resetForm() {
  $("youtubeTitle").value = "";
  $("youtubeLink").value = "";
  $("youtubeDescription").value = "";
  if ($("youtubeStatus")) $("youtubeStatus").value = "Published";
  if ($("youtubeTarget")) $("youtubeTarget").value = "_blank";
  editId = null;
  saveButton.textContent = "Save Video";
}

async function saveVideo() {
  const title = $("youtubeTitle")?.value.trim() || "";
  const link = normalizeYouTubeUrl($("youtubeLink")?.value.trim() || "");
  const description = $("youtubeDescription")?.value.trim() || "";
  const status = $("youtubeStatus")?.value || "Published";
  const target = $("youtubeTarget")?.value || "_blank";
  if (!title || !link) {
    alert("Valid YouTube title aur link bhariye.");
    return;
  }
  saveButton.disabled = true;
  try {
    if (editId) {
      await updateDoc(doc(db, "youtube", editId), { title, link, description, status, target, updatedAt: serverTimestamp() });
      alert("Video Updated Successfully");
    } else {
      await addDoc(collection(db, "youtube"), { title, link, description, status, target, createdAt: serverTimestamp() });
      alert("Video Saved Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`YouTube Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
}

function editVideo(id) {
  const item = allVideos.find((video) => video.id === id);
  if (!item) return;
  editId = id;
  $("youtubeTitle").value = item.title || "";
  $("youtubeLink").value = item.link || "";
  $("youtubeDescription").value = item.description || "";
  if ($("youtubeStatus")) $("youtubeStatus").value = item.status || "Published";
  if ($("youtubeTarget")) $("youtubeTarget").value = item.target || "_blank";
  saveButton.textContent = "Update Video";
  document.querySelector(".youtube-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteVideo(id) {
  const item = allVideos.find((x) => x.id === id);
  if (!item || !confirm("Move this video to Recycle Bin?")) return;
  try { await moveToTrash("youtube", id, item); alert("Video moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}

saveButton?.addEventListener("click", saveVideo);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editVideo(button.dataset.id);
  if (button.dataset.action === "delete") deleteVideo(button.dataset.id);
});
searchInput?.addEventListener("input", renderVideos);

const unsubscribe = onSnapshot(collection(db, "youtube"), (snapshot) => {
  allVideos = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderVideos();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.deleteVideo = deleteVideo;
window.editVideo = editVideo;
window.refreshYoutube = renderVideos;
window.addEventListener("beforeunload", unsubscribe);
