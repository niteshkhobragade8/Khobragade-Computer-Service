import { moveToTrash } from './trash.js';
import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const $ = (id) => document.getElementById(id);
const list = $("imagesList");
let cloudImages = [];
let staticImages = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function loadStaticImages(){ staticImages=[]; renderImages(); }

function renderImages() {
  if (!list) return;
  const search = ($("searchImage")?.value || "").trim().toLowerCase();
  const combined = [
    ...cloudImages.map((item) => ({ ...item, source: "cloud" })),
    ...staticImages.map((item, index) => ({ id: `static-${index}`, title: item.name, name: item.name, url: item.url, source: "static" }))
  ];
  const filtered = combined.filter((item) => !search || `${item.title || item.name || ""} ${item.category || ""}`.toLowerCase().includes(search));

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No Images Available</div>`;
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <article class="image-card">
      <img src="${escapeHTML(item.url)}" alt="${escapeHTML(item.title || item.name || "Image")}" loading="lazy">
      <div class="image-card-body">
        <h3>${escapeHTML(item.title || item.name || "Image")}</h3>
        <small>${escapeHTML(item.category || (item.source === "static" ? "Website Asset" : "Gallery"))}</small>
        <div class="card-actions compact">
          <a class="action-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">👁 Preview</a>
          <button class="action-btn copy" data-action="copy" data-url="${escapeHTML(item.url)}">📋 Copy</button>
          ${item.source === "cloud" ? `<button class="action-btn delete" data-action="delete" data-id="${item.id}" data-path="${escapeHTML(item.storagePath || "")}">🗑 Delete</button>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

async function uploadImage() {
  const file = $("imageUpload")?.files?.[0];
  const externalUrl = $("imageUrl")?.value.trim() || "";
  const title = $("imageTitle")?.value.trim() || file?.name || "Website Image";
  const category = $("imageCategory")?.value || "Gallery";

  if (!file && !externalUrl) {
    alert("Image file select karo ya Image URL dalo.");
    return;
  }

  const button = $("uploadImage");
  button.disabled = true;
  button.textContent = "Uploading...";

  try {
    let url = externalUrl;
    let storagePath = "";

    if (file) {
      if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
      if (file.size > 8 * 1024 * 1024) throw new Error("Image size 8 MB se kam rakho.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `website-images/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, { contentType: file.type });
      url = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "images"), { title, category, url, storagePath, status: "Published", createdAt: serverTimestamp() });
    $("imageUpload").value = "";
    if ($("imageUrl")) $("imageUrl").value = "";
    if ($("imageTitle")) $("imageTitle").value = "";
    alert("Image Added Successfully");
  } catch (error) {
    console.error(error);
    alert(`Image Upload Error: ${error.message}\n\nAgar Firebase Storage enabled nahi hai to Image URL field use kar sakte ho.`);
  } finally {
    button.disabled = false;
    button.textContent = "Upload / Add Image";
  }
}

async function deleteImage(id) {
  const item = cloudImages.find((x) => x.id === id);
  if (!item || !confirm("Move this image to Recycle Bin?")) return;
  try { await moveToTrash("images", id, item); alert("Image moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
  } catch (_) {
    const area = document.createElement("textarea");
    area.value = url;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  alert("Image Link Copied");
}

$("uploadImage")?.addEventListener("click", uploadImage);
$("searchImage")?.addEventListener("input", renderImages);
$("searchImageBtn")?.addEventListener("click", renderImages);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "delete") deleteImage(button.dataset.id, button.dataset.path);
  if (button.dataset.action === "copy") copyUrl(button.dataset.url);
});

const unsubscribe = onSnapshot(collection(db, "images"), (snapshot) => {
  cloudImages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderImages();
}, (error) => {
  console.error("Images Firestore error:", error);
  renderImages();
});

loadStaticImages();
window.refreshImages = renderImages;
window.addEventListener("beforeunload", unsubscribe);
