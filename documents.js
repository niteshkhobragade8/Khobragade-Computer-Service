import { moveToTrash } from './trash.js';
import { db } from "./supabase-app.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from './supabase-db.js';
import { uploadCloudFile } from './cloudinary-upload.js';

const $ = (id) => document.getElementById(id);
const list = $("documentsList");
let allDocuments = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "External Link";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderDocuments() {
  if (!list) return;
  const search = ($("documentSearch")?.value || "").trim().toLowerCase();
  const category = $("documentCategoryFilter")?.value || "all";
  const filtered = allDocuments.filter((item) => {
    const matchesSearch = !search || `${item.title || ""} ${item.category || ""}`.toLowerCase().includes(search);
    return matchesSearch && (category === "all" || item.category === category);
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No Documents Available</div>`;
    return;
  }

  list.innerHTML = `<div class="document-table-wrap"><table class="document-table"><thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Status</th><th>Actions</th></tr></thead><tbody>${filtered.map((item) => `
    <tr>
      <td><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.fileName || "")}</small></td>
      <td>${escapeHTML(item.category || "Other")}</td>
      <td>${escapeHTML(formatBytes(item.fileSize))}</td>
      <td><span class="status-badge published">Published</span></td>
      <td class="table-actions"><a class="action-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">👁 Open</a><a class="action-link" href="${escapeHTML(item.url)}" download>⬇ Download</a><button class="action-btn delete" data-action="delete" data-id="${item.id}" data-path="${escapeHTML(item.storagePath || "")}">🗑</button></td>
    </tr>`).join("")}</tbody></table></div>`;
}

async function uploadDocument() {
  const file = $("documentFile")?.files?.[0];
  const externalUrl = $("documentUrl")?.value.trim() || "";
  const title = $("documentTitle")?.value.trim() || file?.name || "Document";
  const category = $("documentCategory")?.value || "Other";

  if (!title || (!file && !externalUrl)) {
    alert("Document Title aur file/URL dalo.");
    return;
  }

  const button = $("uploadDocument");
  button.disabled = true;
  button.textContent = "Uploading...";
  try {
    let url = externalUrl;
    let storagePath = "";
    let fileName = file?.name || "External document";
    let fileSize = file?.size || 0;
    let fileType = file?.type || "external/url";

    if (file) {
      if (file.size > 15 * 1024 * 1024) throw new Error("Document size 15 MB se kam rakho.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `website-documents/${Date.now()}-${safeName}`;
      url = await uploadCloudFile(file, 'kcsc-admin/website-documents');
    }

    await addDoc(collection(db, "documents"), { title, category, url, storagePath, fileName, fileSize, fileType, status: "Published", createdAt: serverTimestamp() });
    $("documentTitle").value = "";
    $("documentFile").value = "";
    if ($("documentUrl")) $("documentUrl").value = "";
    $("documentCategory").selectedIndex = 0;
    alert("Document Added Successfully");
  } catch (error) {
    console.error(error);
    alert(`Document Upload Error: ${error.message}\n\nFile upload failed ho to Document URL field use karo.`);
  } finally {
    button.disabled = false;
    button.textContent = "Upload / Add Document";
  }
}

async function deleteDocument(id) {
  const item = allDocuments.find((x) => x.id === id);
  if (!item || !confirm("Move this document to Recycle Bin?")) return;
  try { await moveToTrash("documents", id, item); alert("Document moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}

$("uploadDocument")?.addEventListener("click", uploadDocument);
$("documentSearch")?.addEventListener("input", renderDocuments);
$("documentCategoryFilter")?.addEventListener("change", renderDocuments);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='delete']");
  if (button) deleteDocument(button.dataset.id, button.dataset.path);
});

const unsubscribe = onSnapshot(collection(db, "documents"), (snapshot) => {
  allDocuments = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderDocuments();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.refreshDocuments = renderDocuments;
window.addEventListener("beforeunload", unsubscribe);
