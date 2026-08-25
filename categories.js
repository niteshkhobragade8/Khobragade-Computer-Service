import { moveToTrash } from './trash.js';
import { db } from "./supabase-app.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDocs
} from "./supabase-compat.js";


const $ = (id) => document.getElementById(id);

const saveButton = $("saveCategory");
const list = $("categoriesList");
const searchInput = $("categorySearch");

let editId = null;
let allCategories = [];


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeKey(value) {
  return normalize(value).toLocaleLowerCase();
}


/* =========================================
   RENDER CATEGORIES
========================================= */

function renderCategories() {

  if (!list) return;

  const search =
    (searchInput?.value || "")
      .trim()
      .toLowerCase();

  const filtered =
    [...allCategories]
      .sort((a, b) =>
        String(a.name || "")
          .localeCompare(
            String(b.name || "")
          )
      )
      .filter(item =>
        !search ||
        String(item.name || "")
          .toLowerCase()
          .includes(search)
      );


  if (!filtered.length) {

    list.innerHTML = `
      <div class="empty-state">
        No categories found.
      </div>
    `;

    return;
  }


  list.innerHTML =
    filtered.map((item, index) => `

      <article class="category-card">

        <div class="category-number">
          ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="category-main">

          <h3>
            ${escapeHTML(item.name)}
          </h3>

          <small>
            Service Category
          </small>

        </div>

        <div class="card-actions compact">

          <button
            class="action-btn edit"
            data-action="edit"
            data-id="${item.id}">
            ✏️ Edit
          </button>

          <button
            class="action-btn delete"
            data-action="delete"
            data-id="${item.id}">
            🗑 Delete
          </button>

        </div>

      </article>

    `).join("");
}


/* =========================================
   RESET FORM
========================================= */

function resetForm() {

  if ($("categoryName")) {
    $("categoryName").value = "";
  }

  editId = null;

  if (saveButton) {
    saveButton.textContent =
      "Save Category";
  }
}


/* =========================================
   SAVE / UPDATE CATEGORY
========================================= */

async function saveCategory() {

  const name =
    normalize(
      $("categoryName")?.value
    );


  if (!name) {

    alert(
      "Enter Category Name"
    );

    return;
  }


  const normalizedName =
    normalizeKey(name);


  const duplicate =
    allCategories.find(item =>
      item.id !== editId &&
      normalizeKey(item.name) ===
      normalizedName
    );


  if (duplicate) {

    alert(
      `Duplicate Category Not Allowed: "${duplicate.name}" already exists.`
    );

    return;
  }


  if (saveButton) {
    saveButton.disabled = true;
  }


  try {

    if (editId) {

      await updateDoc(
        doc(
          db,
          "categories",
          editId
        ),
        {
          name,
          updatedAt:
            serverTimestamp()
        }
      );


      alert(
        "Category Updated Successfully"
      );

    }

    else {

      await addDoc(
        collection(
          db,
          "categories"
        ),
        {
          name,
          createdAt:
            serverTimestamp()
        }
      );


      alert(
        "Category Saved Successfully"
      );

    }


    resetForm();

  }

  catch (error) {

    console.error(
      "Category save error:",
      error
    );

    alert(
      `Category Error: ${error.message}`
    );

  }

  finally {

    if (saveButton) {
      saveButton.disabled = false;
    }

  }
}


/* =========================================
   EDIT CATEGORY
========================================= */

function editCategory(id) {

  const item =
    allCategories.find(
      category =>
        category.id === id
    );


  if (!item) return;


  editId = id;


  if ($("categoryName")) {
    $("categoryName").value =
      item.name || "";
  }


  if (saveButton) {
    saveButton.textContent =
      "Update Category";
  }


  document
    .querySelector(
      ".category-form"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


/* =========================================
   DELETE → RECYCLE BIN
========================================= */

async function deleteCategory(id) {

  const item =
    allCategories.find(
      x => x.id === id
    );


  if (
    !item ||
    !confirm(
      "Move this category to Recycle Bin?"
    )
  ) {
    return;
  }


  try {

    await moveToTrash(
      "categories",
      id,
      item
    );


    alert(
      "Category moved to Recycle Bin"
    );

  }

  catch (error) {

    console.error(
      "Category delete error:",
      error
    );

    alert(
      error.message
    );

  }
}


/* =========================================
   FIND CATEGORY FROM SERVICE
========================================= */

function extractCategory(data) {

  const possibleValues = [

    data.category,
    data.categoryName,
    data.serviceCategory,
    data.group,
    data.section,
    data.type

  ];


  for (
    const value
    of possibleValues
  ) {

    const cleaned =
      normalize(value);


    if (
      cleaned &&
      cleaned.length <= 100
    ) {

      /*
        Generic service record type values
        ko category mat banao.
      */

      const blocked = [
        "service",
        "services",
        "published",
        "draft",
        "active",
        "inactive"
      ];


      if (
        !blocked.includes(
          cleaned.toLowerCase()
        )
      ) {

        return cleaned;

      }

    }

  }


  return "";
}


/* =========================================
   RECOVER OLD CATEGORIES
========================================= */

async function recoverExistingCategories() {

  const button =
    $("recoverCategoriesButton");


  if (button) {

    button.disabled = true;

    button.textContent =
      "⏳ Recovering...";

  }


  try {

    /*
      Existing website ka main imported
      content services collection me hai.
    */

    const snapshot =
      await getDocs(
        collection(
          db,
          "services"
        )
      );


    const found =
      new Map();


    snapshot.forEach(item => {

      const data =
        item.data();


      const category =
        extractCategory(data);


      if (category) {

        found.set(
          normalizeKey(category),
          category
        );

      }

    });


    /*
      Existing Categories ko duplicate
      hone se bachao.
    */

    const existing =
      new Set(
        allCategories.map(item =>
          normalizeKey(item.name)
        )
      );


    let added = 0;
    let skipped = 0;


    for (
      const [
        key,
        categoryName
      ]
      of found.entries()
    ) {

      if (
        existing.has(key)
      ) {

        skipped++;

        continue;
      }


      await addDoc(
        collection(
          db,
          "categories"
        ),
        {

          name:
            categoryName,

          recovered:
            true,

          recoveredFrom:
            "services",

          createdAt:
            serverTimestamp()

        }
      );


      existing.add(key);

      added++;

    }


    alert(
      `✅ Category Recovery Complete

Recovered: ${added}
Already Existing / Skipped: ${skipped}
Unique Categories Found: ${found.size}`
    );

  }

  catch (error) {

    console.error(
      "Category recovery error:",
      error
    );


    alert(
      "Category Recovery Failed: " +
      error.message
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "♻ Recover Existing Categories";

    }

  }
}


/* =========================================
   AUTO CREATE RECOVERY BUTTON
========================================= */

function addRecoveryButton() {

  if (
    $("recoverCategoriesButton")
  ) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "recoverCategoriesButton";

  button.type =
    "button";

  button.className =
    "secondary-btn";

  button.textContent =
    "♻ Recover Existing Categories";


  button.style.marginTop =
    "10px";

  button.style.marginLeft =
    "8px";


  button.addEventListener(
    "click",
    recoverExistingCategories
  );


  /*
    Save Category button ke paas
    recovery button lagao.
  */

  if (
    saveButton &&
    saveButton.parentElement
  ) {

    saveButton
      .parentElement
      .appendChild(button);

  }

  else {

    const form =
      document.querySelector(
        ".category-form"
      );


    if (form) {
      form.appendChild(button);
    }

  }

}


/* =========================================
   EVENTS
========================================= */

saveButton
  ?.addEventListener(
    "click",
    saveCategory
  );


list
  ?.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "button[data-action]"
        );


      if (!button) return;


      if (
        button.dataset.action ===
        "edit"
      ) {

        editCategory(
          button.dataset.id
        );

      }


      if (
        button.dataset.action ===
        "delete"
      ) {

        deleteCategory(
          button.dataset.id
        );

      }

    }
  );


searchInput
  ?.addEventListener(
    "input",
    renderCategories
  );


/* =========================================
   SUPABASE LIVE CATEGORIES
========================================= */

const unsubscribe =
  onSnapshot(

    collection(
      db,
      "categories"
    ),

    snapshot => {

      allCategories =
        snapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));


      renderCategories();

      addRecoveryButton();

    },

    error => {

      console.error(
        "Category listener error:",
        error
      );


      if (list) {

        list.innerHTML = `
          <div class="empty-state danger">
            ${escapeHTML(error.message)}
          </div>
        `;

      }


      addRecoveryButton();

    }

  );


/* =========================================
   GLOBAL FUNCTIONS
========================================= */

window.editCategory =
  editCategory;

window.deleteCategory =
  deleteCategory;

window.refreshCategories =
  renderCategories;

window.clearCategoryForm =
  resetForm;

window.recoverExistingCategories =
  recoverExistingCategories;


window.addEventListener(
  "DOMContentLoaded",
  addRecoveryButton
);


window.addEventListener(
  "beforeunload",
  unsubscribe
);


export {
  renderCategories as loadCategories
};
