import { moveToTrash } from './trash.js';
import { db } from "./firebase-config.js";
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
const saveButton = $("saveCategory");
const list = $("categoriesList");
const searchInput = $("categorySearch");
let editId = null;
let allCategories = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderCategories() {
  if (!list) return;
  const search = (searchInput?.value || "").trim().toLowerCase();
  const filtered = allCategories.filter((item) => !search || String(item.name || "").toLowerCase().includes(search));
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No categories found.</div>`;
    return;
  }
  list.innerHTML = filtered.map((item, index) => `
    <article class="category-card">
      <div class="category-number">${String(index + 1).padStart(2, "0")}</div>
      <div class="category-main"><h3>${escapeHTML(item.name)}</h3><small>Service Category</small></div>
      <div class="card-actions compact">
        <button class="action-btn edit" data-action="edit" data-id="${item.id}">✏️ Edit</button>
        <button class="action-btn delete" data-action="delete" data-id="${item.id}">🗑 Delete</button>
      </div>
    </article>
  `).join("");
}

function resetForm() {
  $("categoryName").value = "";
  editId = null;
  if (saveButton) saveButton.textContent = "Save Category";
}

async function saveCategory() {
  const name = $("categoryName")?.value.trim() || "";
  if (!name) {
    alert("Enter Category Name");
    return;
  }
  const normalizedName = name.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  const duplicate = allCategories.find((item) => item.id !== editId && String(item.name || "").replace(/\s+/g, " ").trim().toLocaleLowerCase() === normalizedName);
  if (duplicate) {
    alert(`Duplicate Category Not Allowed: "${duplicate.name}" already exists.`);
    return;
  }
  saveButton.disabled = true;
  try {
    if (editId) {
      await updateDoc(doc(db, "categories", editId), { name, updatedAt: serverTimestamp() });
      alert("Category Updated Successfully");
    } else {
      await addDoc(collection(db, "categories"), { name, createdAt: serverTimestamp() });
      alert("Category Saved Successfully");
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert(`Category Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
}

function editCategory(id) {
  const item = allCategories.find((category) => category.id === id);
  if (!item) return;
  editId = id;
  $("categoryName").value = item.name || "";
  saveButton.textContent = "Update Category";
  document.querySelector(".category-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteCategory(id) {
  const item = allCategories.find((x) => x.id === id);
  if (!item || !confirm("Move this category to Recycle Bin?")) return;
  try { await moveToTrash("categories", id, item); alert("Category moved to Recycle Bin"); }
  catch (error) { console.error(error); alert(error.message); }
}

saveButton?.addEventListener("click", saveCategory);
list?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editCategory(button.dataset.id);
  if (button.dataset.action === "delete") deleteCategory(button.dataset.id);
});
searchInput?.addEventListener("input", renderCategories);

const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
  allCategories = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderCategories();
}, (error) => {
  console.error(error);
  if (list) list.innerHTML = `<div class="empty-state danger">${escapeHTML(error.message)}</div>`;
});

window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.refreshCategories = renderCategories;
window.clearCategoryForm = resetForm;
window.addEventListener("beforeunload", unsubscribe);

export { renderCategories as loadCategories };
