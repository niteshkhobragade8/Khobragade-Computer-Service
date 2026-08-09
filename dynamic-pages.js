import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");


const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");


let pages = [];
let sections = [];
let menus = [];
let trash = [];

let pageEdit = null;
let sectionEdit = null;
let menuEdit = null;


/* ================================
   BASIC HELPERS
================================ */

function message(text, type = "info") {
  const box = $("dynamicPageMessage");

  if (!box) return;

  box.textContent = text;
  box.className = "settings-message " + type;
}


function boolValue(id) {
  return $(id)?.value !== "false";
}


/*
  Firestore undefined values ko accept nahi karta.
  Ye function undefined + internal id fields remove karta hai.
*/
function cleanForFirestore(value) {

  if (Array.isArray(value)) {

    return value
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item));

  }

  if (
    value &&
    typeof value === "object"
  ) {

    const cleaned = {};

    Object.entries(value).forEach(
      ([key, val]) => {

        if (
          val !== undefined &&
          key !== "id"
        ) {

          cleaned[key] =
            cleanForFirestore(val);

        }

      }
    );

    return cleaned;

  }

  return value;
}


/* ================================
   CLEAR FORMS
================================ */

function clearPage() {

  pageEdit = null;

  [
    "dynPageName",
    "dynPageSlug",
    "dynPageKicker",
    "dynPageTitle",
    "dynPageSubtitle",
    "dynPageMenuName",
    "dynPageSeoTitle",
    "dynPageSeoDescription"
  ].forEach((id) => {

    if ($(id)) {
      $(id).value = "";
    }

  });

  if ($("dynPageColor1")) {
    $("dynPageColor1").value = "#ec4899";
  }

  if ($("dynPageColor2")) {
    $("dynPageColor2").value = "#2563eb";
  }

  if ($("dynPageStatus")) {
    $("dynPageStatus").value = "Published";
  }

  if ($("dynPageInMenu")) {
    $("dynPageInMenu").value = "true";
  }

  if ($("dynPageMenuOrder")) {
    $("dynPageMenuOrder").value = "50";
  }

  if ($("saveDynamicPage")) {
    $("saveDynamicPage").textContent =
      "Save Page";
  }

}


function clearSection() {

  sectionEdit = null;

  [
    "dynSectionTitle",
    "dynSectionText",
    "dynSectionImage",
    "dynSectionButton",
    "dynSectionLink"
  ].forEach((id) => {

    if ($(id)) {
      $(id).value = "";
    }

  });

  if ($("dynSectionBg")) {
    $("dynSectionBg").value = "#ffffff";
  }

  if ($("dynSectionColor")) {
    $("dynSectionColor").value = "#132238";
  }

  if ($("dynSectionAccent")) {
    $("dynSectionAccent").value = "#ec4899";
  }

  if ($("dynSectionOrder")) {
    $("dynSectionOrder").value = "50";
  }

  if ($("dynSectionVisible")) {
    $("dynSectionVisible").value = "true";
  }

  if ($("saveDynSection")) {
    $("saveDynSection").textContent =
      "Save Section";
  }

}


function clearMenu() {

  menuEdit = null;

  if ($("extraMenuName")) {
    $("extraMenuName").value = "";
  }

  if ($("extraMenuLink")) {
    $("extraMenuLink").value = "";
  }

  if ($("extraMenuOrder")) {
    $("extraMenuOrder").value = "80";
  }

  if ($("extraMenuVisible")) {
    $("extraMenuVisible").value = "true";
  }

  if ($("extraMenuTarget")) {
    $("extraMenuTarget").value = "_self";
  }

  if ($("extraMenuStyle")) {
    $("extraMenuStyle").value = "normal";
  }

  if ($("saveExtraMenu")) {
    $("saveExtraMenu").textContent =
      "Save Menu";
  }

}


/* ================================
   PAGE AUTO SLUG
================================ */

$("dynPageName")?.addEventListener(
  "input",
  () => {

    if (pageEdit) return;

    const value =
      $("dynPageName").value;

    if ($("dynPageSlug")) {
      $("dynPageSlug").value =
        slugify(value);
    }

    if ($("dynPageMenuName")) {
      $("dynPageMenuName").value =
        value;
    }

    if ($("dynPageTitle")) {
      $("dynPageTitle").value =
        value;
    }

  }
);


/* ================================
   SAVE / UPDATE PAGE
================================ */

async function savePage() {

  const name =
    $("dynPageName")?.value.trim() || "";

  const slug =
    slugify(
      $("dynPageSlug")?.value ||
      name
    );

  const title =
    $("dynPageTitle")?.value.trim() ||
    name;


  if (!name || !slug) {

    message(
      "Page Name aur Slug required.",
      "error"
    );

    return;

  }


  const duplicate =
    pages.some(
      (item) =>
        item.id !== pageEdit &&
        item.slug === slug
    );


  if (duplicate) {

    message(
      "Ye URL slug already use ho raha hai.",
      "error"
    );

    return;

  }


  const data = {

    name,
    slug,

    kicker:
      $("dynPageKicker")?.value.trim() || "",

    title,

    subtitle:
      $("dynPageSubtitle")?.value.trim() || "",

    color1:
      $("dynPageColor1")?.value ||
      "#ec4899",

    color2:
      $("dynPageColor2")?.value ||
      "#2563eb",

    status:
      $("dynPageStatus")?.value ||
      "Published",

    inMenu:
      boolValue("dynPageInMenu"),

    menuName:
      $("dynPageMenuName")?.value.trim() ||
      name,

    menuOrder:
      Number(
        $("dynPageMenuOrder")?.value ||
        50
      ),

    seoTitle:
      $("dynPageSeoTitle")?.value.trim() ||
      "",

    seoDescription:
      $("dynPageSeoDescription")?.value.trim() ||
      "",

    updatedAt:
      serverTimestamp()

  };


  try {

    if (pageEdit) {

      await updateDoc(
        doc(
          db,
          "dynamicPages",
          pageEdit
        ),
        cleanForFirestore(data)
      );

      message(
        "Page updated successfully.",
        "success"
      );

    }

    else {

      await addDoc(
        collection(
          db,
          "dynamicPages"
        ),
        {
          ...cleanForFirestore(data),
          createdAt:
            serverTimestamp()
        }
      );

      message(
        "New page created successfully.",
        "success"
      );

    }

    clearPage();

  }

  catch (error) {

    console.error(
      "Page save error:",
      error
    );

    message(
      error.message,
      "error"
    );

  }

}


/* ================================
   EDIT PAGE
================================ */

function editPage(id) {

  const item =
    pages.find(
      (page) =>
        page.id === id
    );

  if (!item) return;


  pageEdit = id;


  $("dynPageName").value =
    item.name || "";

  $("dynPageSlug").value =
    item.slug || "";

  $("dynPageKicker").value =
    item.kicker || "";

  $("dynPageTitle").value =
    item.title || "";

  $("dynPageSubtitle").value =
    item.subtitle || "";

  $("dynPageColor1").value =
    item.color1 ||
    "#ec4899";

  $("dynPageColor2").value =
    item.color2 ||
    "#2563eb";

  $("dynPageStatus").value =
    item.status ||
    "Published";

  $("dynPageInMenu").value =
    String(
      item.inMenu !== false
    );

  $("dynPageMenuName").value =
    item.menuName ||
    item.name ||
    "";

  $("dynPageMenuOrder").value =
    item.menuOrder ?? 50;

  $("dynPageSeoTitle").value =
    item.seoTitle || "";

  $("dynPageSeoDescription").value =
    item.seoDescription || "";

  $("saveDynamicPage").textContent =
    "Update Page";


  document
    .querySelector(
      "#dynamicpagesPage"
    )
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


/* ================================
   RECYCLE BIN CORE
================================ */

async function trashItem(
  type,
  id,
  data
) {

  try {

    const cleanData =
      cleanForFirestore(
        data || {}
      );


    await addDoc(
      collection(
        db,
        "recycleBin"
      ),
      {

        type,

        sourceId: id,

        data:
          cleanData,

        deletedAt:
          serverTimestamp()

      }
    );


    await deleteDoc(
      doc(
        db,
        type,
        id
      )
    );


    return true;

  }

  catch (error) {

    console.error(
      "Recycle Bin error:",
      error
    );

    alert(
      "Delete failed: " +
      error.message
    );

    return false;

  }

}


/* ================================
   DELETE PAGE
================================ */

async function deletePage(id) {

  const item =
    pages.find(
      (page) =>
        page.id === id
    );


  if (!item) return;


  const ok =
    confirm(
      `"${item.name}" page Recycle Bin me bhejna hai?`
    );


  if (!ok) return;


  try {

    /*
      Page ke saare sections
      pehle recycle bin me jayenge.
    */

    const relatedSections =
      sections.filter(
        (section) =>
          section.pageId === id
      );


    for (
      const section
      of relatedSections
    ) {

      const success =
        await trashItem(
          "dynamicSections",
          section.id,
          section
        );


      if (!success) {
        return;
      }

    }


    const success =
      await trashItem(
        "dynamicPages",
        id,
        item
      );


    if (success) {

      message(
        "Page Recycle Bin me move ho gaya.",
        "success"
      );

    }

  }

  catch (error) {

    console.error(
      "Page delete error:",
      error
    );

    alert(
      error.message
    );

  }

}


/* ================================
   RENDER PAGES
================================ */

function renderPages() {

  const box =
    $("dynamicPagesList");

  if (!box) return;


  const query =
    (
      $("dynamicPageSearch")?.value ||
      ""
    )
      .toLowerCase();


  const rows =
    pages
      .filter(
        (item) =>
          !query ||
          `${item.name || ""} ${item.slug || ""}`
            .toLowerCase()
            .includes(query)
      )
      .sort(
        (a, b) =>
          Number(
            a.menuOrder || 50
          ) -
          Number(
            b.menuOrder || 50
          )
      );


  box.innerHTML =
    rows.length
      ? rows.map(
          (item) => `

<article class="content-card">

  <span
    class="status-badge ${(item.status || "Published").toLowerCase()}">
    ${esc(item.status || "Published")}
  </span>

  <h3>${esc(item.name)}</h3>

  <p>
    URL:
    dynamic-page.html?page=${encodeURIComponent(item.slug || "")}
  </p>

  <small>
    ${item.inMenu !== false ? "Menu ON" : "Menu OFF"}
    ·
    Order ${Number(item.menuOrder || 0)}
  </small>

  <div class="card-actions">

    <a
      class="action-btn copy"
      target="_blank"
      href="dynamic-page.html?page=${encodeURIComponent(item.slug || "")}">
      👁 Open
    </a>

    <button
      class="action-btn edit"
      data-p="edit"
      data-id="${item.id}">
      ✏ Edit
    </button>

    <button
      class="action-btn delete"
      data-p="delete"
      data-id="${item.id}">
      🗑 Delete
    </button>

  </div>

</article>

`
        ).join("")
      : `
<div class="empty-state">
  No custom pages.
</div>
`;


  fillPageSelects();

}


/* ================================
   PAGE SELECTS
================================ */

function fillPageSelects() {

  const options =

    '<option value="">Select Page</option>' +

    pages
      .map(
        (item) =>
          `<option value="${item.id}">
            ${esc(item.name)}
          </option>`
      )
      .join("");


  const select =
    $("dynSectionPage");

  const filter =
    $("dynSectionFilter");


  const oldSelect =
    select?.value;

  const oldFilter =
    filter?.value;


  if (select) {

    select.innerHTML =
      options;

    if (oldSelect) {
      select.value =
        oldSelect;
    }

  }


  if (filter) {

    filter.innerHTML =
      '<option value="all">All Custom Pages</option>' +

      pages
        .map(
          (item) =>
            `<option value="${item.id}">
              ${esc(item.name)}
            </option>`
        )
        .join("");


    if (oldFilter) {
      filter.value =
        oldFilter;
    }

  }

}


/* ================================
   SAVE SECTION
================================ */

async function saveSection() {

  const pageId =
    $("dynSectionPage")?.value || "";

  const title =
    $("dynSectionTitle")?.value.trim() || "";


  if (
    !pageId ||
    !title
  ) {

    alert(
      "Page aur Section Title select/dalo."
    );

    return;

  }


  const data = {

    pageId,

    title,

    text:
      $("dynSectionText")?.value.trim() ||
      "",

    imageUrl:
      $("dynSectionImage")?.value.trim() ||
      "",

    buttonText:
      $("dynSectionButton")?.value.trim() ||
      "",

    buttonLink:
      $("dynSectionLink")?.value.trim() ||
      "",

    bg:
      $("dynSectionBg")?.value ||
      "#ffffff",

    color:
      $("dynSectionColor")?.value ||
      "#132238",

    accent:
      $("dynSectionAccent")?.value ||
      "#ec4899",

    order:
      Number(
        $("dynSectionOrder")?.value ||
        50
      ),

    visible:
      boolValue(
        "dynSectionVisible"
      ),

    updatedAt:
      serverTimestamp()

  };


  try {

    if (sectionEdit) {

      await updateDoc(
        doc(
          db,
          "dynamicSections",
          sectionEdit
        ),
        cleanForFirestore(data)
      );

    }

    else {

      await addDoc(
        collection(
          db,
          "dynamicSections"
        ),
        {
          ...cleanForFirestore(data),
          createdAt:
            serverTimestamp()
        }
      );

    }


    clearSection();

  }

  catch (error) {

    console.error(
      "Section save error:",
      error
    );

    alert(
      error.message
    );

  }

}


/* ================================
   EDIT SECTION
================================ */

function editSection(id) {

  const item =
    sections.find(
      (section) =>
        section.id === id
    );


  if (!item) return;


  sectionEdit = id;


  $("dynSectionPage").value =
    item.pageId || "";

  $("dynSectionTitle").value =
    item.title || "";

  $("dynSectionText").value =
    item.text || "";

  $("dynSectionImage").value =
    item.imageUrl || "";

  $("dynSectionButton").value =
    item.buttonText || "";

  $("dynSectionLink").value =
    item.buttonLink || "";

  $("dynSectionBg").value =
    item.bg ||
    "#ffffff";

  $("dynSectionColor").value =
    item.color ||
    "#132238";

  $("dynSectionAccent").value =
    item.accent ||
    "#ec4899";

  $("dynSectionOrder").value =
    item.order ?? 50;

  $("dynSectionVisible").value =
    String(
      item.visible !== false
    );


  $("saveDynSection").textContent =
    "Update Section";

}


/* ================================
   DELETE SECTION
================================ */

async function deleteSection(id) {

  const item =
    sections.find(
      (section) =>
        section.id === id
    );


  if (!item) return;


  const ok =
    confirm(
      "Section Recycle Bin me bhejna hai?"
    );


  if (!ok) return;


  await trashItem(
    "dynamicSections",
    id,
    item
  );

}


/* ================================
   RENDER SECTIONS
================================ */

function renderSections() {

  const box =
    $("dynSectionsList");

  if (!box) return;


  const filter =
    $("dynSectionFilter")?.value ||
    "all";


  const rows =
    sections
      .filter(
        (item) =>
          filter === "all" ||
          item.pageId === filter
      )
      .sort(
        (a, b) =>
          Number(
            a.order || 0
          ) -
          Number(
            b.order || 0
          )
      );


  box.innerHTML =
    rows.length
      ? rows.map(
          (item) => `

<article class="content-card">

  <span
    class="status-badge ${item.visible === false ? "draft" : "published"}">
    ${item.visible === false ? "Hidden" : "Visible"}
  </span>

  <h3>${esc(item.title)}</h3>

  <small>
    ${esc(
      pages.find(
        (page) =>
          page.id === item.pageId
      )?.name ||
      "Unknown Page"
    )}
    ·
    Order ${Number(item.order || 0)}
  </small>

  <p>
    ${esc(item.text || "")}
  </p>

  <div class="card-actions">

    <button
      class="action-btn edit"
      data-s="edit"
      data-id="${item.id}">
      ✏ Edit
    </button>

    <button
      class="action-btn delete"
      data-s="delete"
      data-id="${item.id}">
      🗑 Delete
    </button>

  </div>

</article>

`
        ).join("")
      : `
<div class="empty-state">
  No sections.
</div>
`;

}


/* ================================
   SAVE MENU
================================ */

async function saveMenu() {

  const name =
    $("extraMenuName")?.value.trim() ||
    "";

  const link =
    $("extraMenuLink")?.value.trim() ||
    "";


  if (
    !name ||
    !link
  ) {

    alert(
      "Menu Name aur Link required."
    );

    return;

  }


  const duplicate =
    menus.some(
      (item) =>
        item.id !== menuEdit &&
        String(
          item.name || ""
        ).toLowerCase() ===
        name.toLowerCase()
    );


  if (duplicate) {

    alert(
      "Duplicate menu name not allowed."
    );

    return;

  }


  const data = {

    name,

    link,

    order:
      Number(
        $("extraMenuOrder")?.value ||
        80
      ),

    visible:
      boolValue(
        "extraMenuVisible"
      ),

    target:
      $("extraMenuTarget")?.value ||
      "_self",

    style:
      $("extraMenuStyle")?.value ||
      "normal",

    updatedAt:
      serverTimestamp()

  };


  try {

    if (menuEdit) {

      await updateDoc(
        doc(
          db,
          "menuItems",
          menuEdit
        ),
        cleanForFirestore(data)
      );

    }

    else {

      await addDoc(
        collection(
          db,
          "menuItems"
        ),
        {
          ...cleanForFirestore(data),
          createdAt:
            serverTimestamp()
        }
      );

    }


    clearMenu();

  }

  catch (error) {

    console.error(
      "Menu save error:",
      error
    );

    alert(
      error.message
    );

  }

}


/* ================================
   EDIT MENU
================================ */

function editMenu(id) {

  const item =
    menus.find(
      (menu) =>
        menu.id === id
    );


  if (!item) return;


  menuEdit = id;


  $("extraMenuName").value =
    item.name || "";

  $("extraMenuLink").value =
    item.link || "";

  $("extraMenuOrder").value =
    item.order ?? 80;

  $("extraMenuVisible").value =
    String(
      item.visible !== false
    );

  $("extraMenuTarget").value =
    item.target ||
    "_self";

  $("extraMenuStyle").value =
    item.style ||
    "normal";


  $("saveExtraMenu").textContent =
    "Update Menu";

}


/* ================================
   DELETE MENU
================================ */

async function deleteMenu(id) {

  const item =
    menus.find(
      (menu) =>
        menu.id === id
    );


  if (!item) return;


  const ok =
    confirm(
      "Menu Recycle Bin me bhejna hai?"
    );


  if (!ok) return;


  await trashItem(
    "menuItems",
    id,
    item
  );

}


/* ================================
   RENDER MENUS
================================ */

function renderMenus() {

  const box =
    $("extraMenuList");

  if (!box) return;


  const rows =
    [...menus]
      .sort(
        (a, b) =>
          Number(
            a.order || 0
          ) -
          Number(
            b.order || 0
          )
      );


  box.innerHTML =
    rows.length
      ? rows.map(
          (item) => `

<article class="content-card">

  <span
    class="status-badge ${item.visible === false ? "draft" : "published"}">
    ${item.visible === false ? "Hidden" : "Visible"}
  </span>

  <h3>
    ${esc(item.name)}
  </h3>

  <p>
    ${esc(item.link)}
  </p>

  <small>
    Order ${Number(item.order || 0)}
    ·
    ${esc(item.style || "normal")}
  </small>

  <div class="card-actions">

    <button
      class="action-btn edit"
      data-m="edit"
      data-id="${item.id}">
      ✏ Edit
    </button>

    <button
      class="action-btn delete"
      data-m="delete"
      data-id="${item.id}">
      🗑 Delete
    </button>

  </div>

</article>

`
        ).join("")
      : `
<div class="empty-state">
  No extra menu.
</div>
`;

}


/* ================================
   RESTORE TRASH
================================ */

async function restoreTrash(id) {

  const item =
    trash.find(
      (row) =>
        row.id === id
    );


  if (!item) return;


  try {

    const restoredData =
      cleanForFirestore(
        item.data || {}
      );


    restoredData.restoredAt =
      serverTimestamp();


    await setDoc(
      doc(
        db,
        item.type,
        item.sourceId
      ),
      restoredData,
      {
        merge: true
      }
    );


    await deleteDoc(
      doc(
        db,
        "recycleBin",
        id
      )
    );

  }

  catch (error) {

    console.error(
      "Restore error:",
      error
    );

    alert(
      "Restore failed: " +
      error.message
    );

  }

}


/* ================================
   PERMANENT DELETE
================================ */

async function permanentDelete(id) {

  const ok =
    confirm(
      "Permanently delete? Restore nahi hoga."
    );


  if (!ok) return;


  try {

    await deleteDoc(
      doc(
        db,
        "recycleBin",
        id
      )
    );

  }

  catch (error) {

    alert(
      error.message
    );

  }

}


/* ================================
   RENDER TRASH
================================ */

function renderTrash() {

  const box =
    $("recycleBinList");

  if (!box) return;


  box.innerHTML =
    trash.length
      ? trash.map(
          (item) => `

<article class="content-card">

  <h3>
    ♻
    ${esc(
      item.data?.name ||
      item.data?.title ||
      item.type
    )}
  </h3>

  <small>
    ${esc(item.type)}
  </small>

  <div class="card-actions">

    <button
      class="action-btn edit"
      data-r="restore"
      data-id="${item.id}">
      ↩ Restore
    </button>

    <button
      class="action-btn delete"
      data-r="delete"
      data-id="${item.id}">
      🗑 Permanent
    </button>

  </div>

</article>

`
        ).join("")
      : `
<div class="empty-state">
  Recycle Bin empty.
</div>
`;

}


/* ================================
   CMS BACKUP
================================ */

function backup() {

  const payload = {

    version: 1,

    exportedAt:
      new Date().toISOString(),

    dynamicPages:
      pages,

    dynamicSections:
      sections,

    menuItems:
      menus

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const link =
    document.createElement("a");


  link.href =
    URL.createObjectURL(blob);


  link.download =
    "khobragade-cms-backup-" +
    new Date()
      .toISOString()
      .slice(0, 10) +
    ".json";


  link.click();


  setTimeout(
    () =>
      URL.revokeObjectURL(
        link.href
      ),
    1000
  );

}


/* ================================
   BUTTON EVENTS
================================ */

$("saveDynamicPage")
  ?.addEventListener(
    "click",
    savePage
  );


$("clearDynamicPage")
  ?.addEventListener(
    "click",
    clearPage
  );


$("dynamicPageSearch")
  ?.addEventListener(
    "input",
    renderPages
  );


$("dynamicPagesList")
  ?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button[data-p]"
        );

      if (!button) return;


      if (
        button.dataset.p ===
        "edit"
      ) {

        editPage(
          button.dataset.id
        );

      }

      else {

        deletePage(
          button.dataset.id
        );

      }

    }
  );


$("saveDynSection")
  ?.addEventListener(
    "click",
    saveSection
  );


$("clearDynSection")
  ?.addEventListener(
    "click",
    clearSection
  );


$("dynSectionFilter")
  ?.addEventListener(
    "change",
    renderSections
  );


$("dynSectionsList")
  ?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button[data-s]"
        );

      if (!button) return;


      if (
        button.dataset.s ===
        "edit"
      ) {

        editSection(
          button.dataset.id
        );

      }

      else {

        deleteSection(
          button.dataset.id
        );

      }

    }
  );


$("saveExtraMenu")
  ?.addEventListener(
    "click",
    saveMenu
  );


$("clearExtraMenu")
  ?.addEventListener(
    "click",
    clearMenu
  );


$("extraMenuList")
  ?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button[data-m]"
        );

      if (!button) return;


      if (
        button.dataset.m ===
        "edit"
      ) {

        editMenu(
          button.dataset.id
        );

      }

      else {

        deleteMenu(
          button.dataset.id
        );

      }

    }
  );


$("downloadCmsBackup")
  ?.addEventListener(
    "click",
    backup
  );


$("refreshRecycleBin")
  ?.addEventListener(
    "click",
    renderTrash
  );


$("recycleBinList")
  ?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button[data-r]"
        );

      if (!button) return;


      if (
        button.dataset.r ===
        "restore"
      ) {

        restoreTrash(
          button.dataset.id
        );

      }

      else {

        permanentDelete(
          button.dataset.id
        );

      }

    }
  );


/* ================================
   FIREBASE LIVE LISTENERS
================================ */

onSnapshot(
  collection(
    db,
    "dynamicPages"
  ),

  (snapshot) => {

    pages =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

    renderPages();
    renderSections();

  }
);


onSnapshot(
  collection(
    db,
    "dynamicSections"
  ),

  (snapshot) => {

    sections =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

    renderSections();

  }
);


onSnapshot(
  collection(
    db,
    "menuItems"
  ),

  (snapshot) => {

    menus =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

    renderMenus();

  }
);


onSnapshot(
  collection(
    db,
    "recycleBin"
  ),

  (snapshot) => {

    trash =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

    renderTrash();

  },

  (error) => {

    console.error(
      "Recycle Bin listener error:",
      error
    );

  }
);
