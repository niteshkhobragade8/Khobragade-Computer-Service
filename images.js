import { moveToTrash } from './trash.js';
import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

  const filtered = cloudImages.filter((item) => {

    const text =
      `${item.title || ""}
       ${item.category || ""}
       ${item.publicId || ""}`
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


  list.innerHTML = filtered.map((item) => `

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

    alert("Image select karo.");

    return;
  }


  const button = $("uploadImage");

  if (button) {

    button.disabled = true;

    button.textContent =
      "Uploading... Please Wait";

  }


  try {

    let imageUrl = externalUrl;

    let publicId = "";


    /* -------------------------------------
       LOCAL FILE SELECTED
    ------------------------------------- */

    if (file) {

      if (!file.type.startsWith("image/")) {

        throw new Error(
          "Please select an image file."
        );

      }


      if (file.size > 10 * 1024 * 1024) {

        throw new Error(
          "Image size 10 MB se kam rakho."
        );

      }


      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        UPLOAD_PRESET
      );

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
        result.public_id;

    }


    /* -------------------------------------
       SAVE IMAGE INFORMATION IN FIRESTORE
    ------------------------------------- */

    await addDoc(
      collection(db, "images"),
      {

        title,

        category,

        url: imageUrl,

        publicId,

        provider:
          file
            ? "cloudinary"
            : "external",

        status: "Published",

        createdAt:
          serverTimestamp()

      }
    );


    /* -------------------------------------
       CLEAR FORM
    ------------------------------------- */

    if ($("imageUpload"))
      $("imageUpload").value = "";

    if ($("imageUrl"))
      $("imageUrl").value = "";

    if ($("imageTitle"))
      $("imageTitle").value = "";


    alert(
      "✅ Image Uploaded Successfully"
    );


  } catch (error) {

    console.error(
      "Image Upload Error:",
      error
    );

    alert(
      `❌ Image Upload Error:\n${error.message}`
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Upload / Add Image";

    }

  }

}


/* =========================================
   MOVE IMAGE RECORD TO RECYCLE BIN
========================================= */

async function deleteImage(id) {

  const item =
    cloudImages.find(
      (image) =>
        image.id === id
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


  } catch (error) {

    console.error(error);

    alert(
      `Delete Error: ${error.message}`
    );

  }

}


/* =========================================
   COPY IMAGE URL
========================================= */

async function copyUrl(url) {

  try {

    await navigator.clipboard
      .writeText(url);


  } catch (error) {

    const area =
      document.createElement(
        "textarea"
      );

    area.value = url;

    document.body
      .appendChild(area);

    area.select();

    document.execCommand(
      "copy"
    );

    area.remove();

  }


  alert(
    "✅ Image URL Copied"
  );

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


list?.addEventListener(
  "click",
  (event) => {

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

  }
);


/* =========================================
   FIRESTORE REAL-TIME IMAGE LIST
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
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );


      renderImages();

    },

    (error) => {

      console.error(
        "Images Firestore Error:",
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


window.addEventListener(
  "beforeunload",
  () => unsubscribe()
);
