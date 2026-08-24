import { moveToTrash } from './trash.js';
import { db } from "./supabase-app.js";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot
} from './supabase-db.js';


/* =========================================
   CLOUDINARY SETTINGS
========================================= */

const CLOUD_NAME = "jkia38fa";
const UPLOAD_PRESET = "khobragade_csc";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


/* =========================================
   BASIC VARIABLES
========================================= */

const $ = (id) => document.getElementById(id);

const list = $("imagesList");

let cloudImages = [];


/* =========================================
   SAFE HTML
========================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   SHOW IMAGES
========================================= */

function renderImages() {

  if (!list) return;


  const search =
    ($("searchImage")?.value || "")
      .trim()
      .toLowerCase();


  const filtered =
    cloudImages.filter((item) => {

      const text =
        `${item.title || ""}
         ${item.category || ""}
         ${item.publicId || ""}`
          .toLowerCase();

      return (
        !search ||
        text.includes(search)
      );

    });


  if (!filtered.length) {

    list.innerHTML = `
      <div class="empty-state">
        No Images Available
      </div>
    `;

    return;
  }


  list.innerHTML =
    filtered.map((item) => `

      <article class="image-card">

        <img
          src="${escapeHTML(item.url)}"
          alt="${escapeHTML(item.title || "Website Image")}"
          loading="lazy"
        >

        <div class="image-card-body">

          <h3>
            ${escapeHTML(item.title || "Website Image")}
          </h3>

          <small>
            ${escapeHTML(item.category || "Gallery")}
          </small>

          <div class="card-actions compact">

            <a
              class="action-link"
              href="${escapeHTML(item.url)}"
              target="_blank"
              rel="noopener"
            >
              👁 Preview
            </a>

            <button
              class="action-btn copy"
              data-action="copy"
              data-url="${escapeHTML(item.url)}"
            >
              📋 Copy URL
            </button>

            <button
              class="action-btn edit"
              data-action="use"
              data-id="${item.id}"
            >
              🌐 Use on Website
            </button>

            <button
              class="action-btn delete"
              data-action="delete"
              data-id="${item.id}"
            >
              🗑 Delete
            </button>

          </div>

        </div>

      </article>

    `).join("");
}


/* =========================================
   UPLOAD IMAGE TO CLOUDINARY
========================================= */

async function uploadImage() {

  const file =
    $("imageUpload")?.files?.[0];


  const externalUrl =
    $("imageUrl")?.value.trim() || "";


  const title =
    $("imageTitle")?.value.trim()
    || file?.name
    || "Website Image";


  const category =
    $("imageCategory")?.value
    || "Gallery";


  if (!file && !externalUrl) {

    alert(
      "Image select karo ya Image URL dalo."
    );

    return;
  }


  const button =
    $("uploadImage");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Uploading... Please Wait";
  }


  try {

    let imageUrl =
      externalUrl;

    let publicId = "";


    /* =====================================
       LOCAL FILE → CLOUDINARY
    ===================================== */

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
        10 * 1024 * 1024
      ) {

        throw new Error(
          "Image size 10 MB se kam rakho."
        );
      }


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "upload_preset",
        UPLOAD_PRESET
      );


      /*
        Folder Cloudinary me
        Khobragade CSC images ke liye
      */

      formData.append(
        "folder",
        "khobragade-csc"
      );


      const response =
        await fetch(
          CLOUDINARY_UPLOAD_URL,
          {
            method: "POST",
            body: formData
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result?.error?.message
          || "Cloudinary upload failed."
        );
      }


      imageUrl =
        result.secure_url;


      publicId =
        result.public_id || "";
    }


    /* =====================================
       SAVE IMAGE IN FIRESTORE
    ===================================== */

    await addDoc(
      collection(
        db,
        "images"
      ),
      {

        title,

        category,

        url:
          imageUrl,

        publicId,

        provider:
          file
            ? "cloudinary"
            : "external",

        status:
          "Published",

        createdAt:
          serverTimestamp()

      }
    );


    /* =====================================
       CLEAR FORM
    ===================================== */

    if ($("imageUpload")) {

      $("imageUpload").value =
        "";
    }


    if ($("imageUrl")) {

      $("imageUrl").value =
        "";
    }


    if ($("imageTitle")) {

      $("imageTitle").value =
        "";
    }


    alert(
      "✅ Image Uploaded Successfully"
    );

  }

  catch (error) {

    console.error(
      "Image Upload Error:",
      error
    );


    alert(
      `❌ Image Upload Error:

${error.message}`
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Upload / Add Image";
    }
  }
}


/* =========================================
   USE IMAGE ON WEBSITE
========================================= */

async function useOnWebsite(id) {

  const item =
    cloudImages.find(
      image =>
        image.id === id
    );


  if (
    !item ||
    !item.url
  ) {

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


  /* =====================================
     OPTION 1
     HOME HERO / BANNER
  ===================================== */

  if (choice === "1") {

    const confirmApply =
      confirm(
        "Is image ko Home Hero / Banner me lagana hai?"
      );


    if (!confirmApply) {
      return;
    }


    try {

      await setDoc(
  doc(
    db,
    "settings",
    "website"
  ),
  {
    heroImageUrl: item.url,
    bannerUrl: item.url,
    heroImage: item.url,
    updatedAt: serverTimestamp()
  },
  {
    merge: true
  }
);


      alert(
        "✅ Hero / Banner image successfully updated."
      );

    }

    catch (error) {

      console.error(
        "Hero image error:",
        error
      );


      alert(
        "Hero image update failed: " +
        error.message
      );
    }


    return;
  }


  /* =====================================
     OPTION 2
     CUSTOM SECTION
  ===================================== */

  if (choice === "2") {

    try {

      await copyUrl(
        item.url,
        false
      );


      localStorage.setItem(
        "cmsSelectedImageUrl",
        item.url
      );


      localStorage.setItem(
        "cmsSelectedImageTitle",
        item.title || ""
      );


      alert(
`✅ Image ready hai.

Ab:

Full Website CMS
→ Add / Edit Custom Section
→ Image URL field me Paste karo.

URL already Copy ho chuka hai.`
      );

    }

    catch (error) {

      console.error(
        error
      );


      alert(
        "Image URL copy nahi hua."
      );
    }


    return;
  }


  if (
    choice !== null
  ) {

    alert(
      "Please 1 ya 2 likho."
    );
  }
}


/* =========================================
   DELETE IMAGE → RECYCLE BIN
========================================= */

async function deleteImage(id) {

  const item =
    cloudImages.find(
      image =>
        image.id === id
    );


  if (!item) {
    return;
  }


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
      "✅ Image moved to Recycle Bin"
    );

  }

  catch (error) {

    console.error(
      "Image delete error:",
      error
    );


    alert(
      `Delete Error: ${error.message}`
    );
  }
}


/* =========================================
   COPY IMAGE URL
========================================= */

async function copyUrl(
  url,
  showAlert = true
) {

  try {

    await navigator
      .clipboard
      .writeText(url);

  }

  catch (error) {

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


  if (showAlert) {

    alert(
      "✅ Image URL Copied"
    );
  }
}


/* =========================================
   BUTTON EVENTS
========================================= */

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
    (event) => {

      const button =
        event.target.closest(
          "button[data-action]"
        );


      if (!button) {
        return;
      }


      /* DELETE */

      if (
        button.dataset.action ===
        "delete"
      ) {

        deleteImage(
          button.dataset.id
        );
      }


      /* COPY */

      if (
        button.dataset.action ===
        "copy"
      ) {

        copyUrl(
          button.dataset.url
        );
      }


      /* USE ON WEBSITE */

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


/* =========================================
   FIRESTORE LIVE IMAGE LIST
========================================= */

const unsubscribe =
  onSnapshot(

    collection(
      db,
      "images"
    ),

    (snapshot) => {

      cloudImages =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );


      renderImages();
    },

    (error) => {

      console.error(
        "Images database Error:",
        error
      );


      if (list) {

        list.innerHTML = `
          <div class="empty-state danger">
            ${escapeHTML(error.message)}
          </div>
        `;
      }
    }
  );


/* =========================================
   GLOBAL FUNCTIONS
========================================= */

window.refreshImages =
  renderImages;


window.useImageOnWebsite =
  useOnWebsite;


window.addEventListener(
  "beforeunload",
  () => {

    unsubscribe();

  }
);
