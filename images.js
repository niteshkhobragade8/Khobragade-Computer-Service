import { moveToTrash } from './trash.js';
import { db, storage } from "./firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const $ = id => document.getElementById(id);

const list = $("imagesList");

let cloudImages = [];
let staticImages = [];


/* ==============================
   SAFE HTML
============================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ==============================
   STATIC IMAGES
============================== */

async function loadStaticImages() {
  staticImages = [];
  renderImages();
}


/* ==============================
   RENDER
============================== */

function renderImages() {

  if (!list) return;

  const search =
    ($("searchImage")?.value || "")
      .trim()
      .toLowerCase();

  const combined = [

    ...cloudImages.map(item => ({
      ...item,
      source: "cloud"
    })),

    ...staticImages.map((item, index) => ({
      id: `static-${index}`,
      title: item.name,
      name: item.name,
      url: item.url,
      source: "static"
    }))

  ];


  const filtered = combined.filter(item => {

    const text =
      `${item.title || item.name || ""}
       ${item.category || ""}`
        .toLowerCase();

    return !search || text.includes(search);

  });


  if (!filtered.length) {

    list.innerHTML = `
      <div class="empty-state">
        No Images Available
      </div>
    `;

    return;
  }


  list.innerHTML = filtered.map(item => `

    <article class="image-card">

      <img
        src="${escapeHTML(item.url)}"
        alt="${escapeHTML(item.title || item.name || "Image")}"
        loading="lazy"
      >

      <div class="image-card-body">

        <h3>
          ${escapeHTML(item.title || item.name || "Image")}
        </h3>

        <small>
          ${escapeHTML(
            item.category ||
            (item.source === "static"
              ? "Website Asset"
              : "Gallery")
          )}
        </small>

        <div class="card-actions compact">

          <a
            class="action-link"
            href="${escapeHTML(item.url)}"
            target="_blank"
            rel="noopener">
            👁 Preview
          </a>

          <button
            class="action-btn copy"
            data-action="copy"
            data-url="${escapeHTML(item.url)}">
            📋 Copy
          </button>

          <button
            class="action-btn edit"
            data-action="use"
            data-id="${item.id}">
            🌐 Use on Website
          </button>

          ${
            item.source === "cloud"
              ? `
                <button
                  class="action-btn delete"
                  data-action="delete"
                  data-id="${item.id}">
                  🗑 Delete
                </button>
              `
              : ""
          }

        </div>

      </div>

    </article>

  `).join("");
}


/* ==============================
   UPLOAD / ADD IMAGE
============================== */

async function uploadImage() {

  const file =
    $("imageUpload")?.files?.[0];

  const externalUrl =
    $("imageUrl")?.value.trim() || "";

  const title =
    $("imageTitle")?.value.trim() ||
    file?.name ||
    "Website Image";

  const category =
    $("imageCategory")?.value ||
    "Gallery";


  if (!file && !externalUrl) {

    alert(
      "Image file select karo ya Image URL dalo."
    );

    return;
  }


  const button = $("uploadImage");

  if (button) {

    button.disabled = true;

    button.textContent =
      "Uploading...";

  }


  try {

    let url = externalUrl;

    let storagePath = "";


    if (file) {

      if (
        !file.type.startsWith("image/")
      ) {

        throw new Error(
          "Please select an image file."
        );

      }


      if (
        file.size >
        8 * 1024 * 1024
      ) {

        throw new Error(
          "Image size 8 MB se kam rakho."
        );

      }


      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


      storagePath =
        `website-images/${Date.now()}-${safeName}`;


      const storageRef =
        ref(
          storage,
          storagePath
        );


      await uploadBytes(
        storageRef,
        file,
        {
          contentType:
            file.type
        }
      );


      url =
        await getDownloadURL(
          storageRef
        );

    }


    await addDoc(
      collection(
        db,
        "images"
      ),
      {

        title,
        category,
        url,
        storagePath,

        status:
          "Published",

        createdAt:
          serverTimestamp()

      }
    );


    if ($("imageUpload")) {
      $("imageUpload").value = "";
    }

    if ($("imageUrl")) {
      $("imageUrl").value = "";
    }

    if ($("imageTitle")) {
      $("imageTitle").value = "";
    }


    alert(
      "Image Added Successfully"
    );

  }

  catch (error) {

    console.error(
      "Image Upload Error:",
      error
    );


    alert(
      `Image Upload Error: ${error.message}

Agar Firebase Storage enabled nahi hai to Image URL field use karo.`
    );

  }

  finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Upload / Add Image";

    }

  }

}


/* ==============================
   USE IMAGE ON WEBSITE
============================== */

async function useOnWebsite(id) {

  const item =
    cloudImages.find(
      image =>
        image.id === id
    ) ||
    staticImages.find(
      image =>
        image.id === id
    );


  if (!item || !item.url) {

    alert(
      "Image URL nahi mila."
    );

    return;
  }


  const choice =
    prompt(
`Image kaha use karna hai?

1 = Home Hero / Banner
2 = Custom Section

1 ya 2 likho:`
    );


  /* ------------------------------
     HERO / BANNER
  ------------------------------ */

  if (choice === "1") {

    const ok =
      confirm(
        "Is image ko Home Hero / Banner banana hai?"
      );


    if (!ok) return;


    try {

      /*
        Existing website settings document
        ko preserve karte hue banner update.
      */

      await setDoc(
        doc(
          db,
          "settings",
          "website"
        ),
        {

          bannerUrl:
            item.url,

          heroImage:
            item.url,

          updatedAt:
            serverTimestamp()

        },
        {
          merge: true
        }
      );


      alert(
        "✅ Home Hero / Banner image updated."
      );

    }

    catch (error) {

      console.error(
        "Banner update error:",
        error
      );


      alert(
        "Banner update failed: " +
        error.message
      );

    }


    return;
  }


  /* ------------------------------
     CUSTOM SECTION
  ------------------------------ */

  if (choice === "2") {

    /*
      Image URL temporary browser storage
      me rakhenge.

      CMS page open hone ke baad
      custom-section code ise use kar
      sakta hai.
    */

    localStorage.setItem(
      "cmsSelectedImageUrl",
      item.url
    );


    localStorage.setItem(
      "cmsSelectedImageTitle",
      item.title ||
      item.name ||
      ""
    );


    alert(
      `✅ Image selected.

Ab Full Website CMS → Custom Section kholo.

Image URL ready hai.`
    );


    /*
      Agar CMS isi admin SPA me hai to
      automatically sidebar/menu click
      karne ki koshish nahi karenge,
      taaki existing navigation na toote.
    */

    return;
  }


  if (
    choice !== null
  ) {

    alert(
      "Please 1 ya 2 select karo."
    );

  }

}


/* ==============================
   DELETE → RECYCLE BIN
============================== */

async function deleteImage(id) {

  const item =
    cloudImages.find(
      x => x.id === id
    );


  if (!item) return;


  if (
    !confirm(
      "Move this image to Recycle Bin?"
    )
  ) {

    return;
  }


  try {

    await moveToTrash(
      "images",
      id,
      item
    );


    alert(
      "Image moved to Recycle Bin"
    );

  }

  catch (error) {

    console.error(
      "Image delete error:",
      error
    );


    alert(
      error.message
    );

  }

}


/* ==============================
   COPY URL
============================== */

async function copyUrl(url) {

  try {

    await navigator
      .clipboard
      .writeText(url);

  }

  catch (_) {

    const area =
      document.createElement(
        "textarea"
      );

    area.value =
      url;

    document.body
      .appendChild(area);

    area.select();

    document.execCommand(
      "copy"
    );

    area.remove();

  }


  alert(
    "Image Link Copied"
  );

}


/* ==============================
   EVENTS
============================== */

$("uploadImage")
  ?.addEventListener(
    "click",
    uploadImage
  );


$("searchImage")
  ?.addEventListener(
    "input",
    renderImages
  );


$("searchImageBtn")
  ?.addEventListener(
    "click",
    renderImages
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
        "delete"
      ) {

        deleteImage(
          button.dataset.id
        );

      }


      if (
        button.dataset.action ===
        "copy"
      ) {

        copyUrl(
          button.dataset.url
        );

      }


      if (
        button.dataset.action ===
        "use"
      ) {

        useOnWebsite(
          button.dataset.id
        );

      }

    }
  );


/* ==============================
   FIRESTORE LIVE IMAGES
============================== */

const unsubscribe =
  onSnapshot(

    collection(
      db,
      "images"
    ),

    snapshot => {

      cloudImages =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );


      renderImages();

    },

    error => {

      console.error(
        "Images Firestore error:",
        error
      );


      renderImages();

    }

  );


loadStaticImages();


window.refreshImages =
  renderImages;


window.useImageOnWebsite =
  useOnWebsite;


window.addEventListener(
  "beforeunload",
  unsubscribe
);
