import { db } from "./firebase-config.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slug =
  new URLSearchParams(window.location.search).get("page") || "";

let pages = [];
let sections = [];
let pagesLoaded = false;
let sectionsLoaded = false;

function safeLink(value) {
  const link = String(value || "").trim();

  if (
    /^https?:\/\//i.test(link) ||
    /^[a-z0-9_-]+\.html/i.test(link) ||
    link.startsWith("#")
  ) {
    return link;
  }

  return "#";
}

function renderPage() {
  const loading = $("dynamicPageLoading");
  const sectionBox = $("dynamicPageSections");

  const page = pages.find(
    (item) =>
      item.slug === slug &&
      (item.status || "Published") === "Published"
  );

  if (!page) {
    if (pagesLoaded && loading) {
      loading.style.display = "block";
      loading.textContent =
        "Page not found or this page is not published.";
    }
    return;
  }

  document.title =
    (page.seoTitle || page.title || page.name) +
    " | Khobragade Computer Service Centre";

  const meta = document.querySelector(
    'meta[name="description"]'
  );

  if (meta && page.seoDescription) {
    meta.content = page.seoDescription;
  }

  if ($("dynamicKicker")) {
    $("dynamicKicker").textContent =
      page.kicker || "KHOBRAGADE COMPUTER SERVICE CENTRE";
  }

  if ($("dynamicTitle")) {
    $("dynamicTitle").textContent =
      page.title || page.name || "Page";
  }

  if ($("dynamicSubtitle")) {
    $("dynamicSubtitle").textContent =
      page.subtitle || "";
  }

  if (
    $("dynamicHero") &&
    page.color1 &&
    page.color2
  ) {
    $("dynamicHero").style.background =
      `linear-gradient(135deg, ${page.color1}, ${page.color2})`;
  }

  if (loading) {
    loading.style.display = "none";
  }

  const pageSections = sections
    .filter(
      (item) =>
        item.pageId === page.id &&
        item.visible !== false
    )
    .sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

  if (!sectionBox) return;

  if (!pageSections.length) {
    sectionBox.innerHTML = `
      <div class="empty">
        This page is ready. Admin Dashboard se section add karein.
      </div>
    `;
    return;
  }

  sectionBox.innerHTML = pageSections
    .map(
      (item) => `
        <section
          class="dyn-content-section"
          style="
            background:${esc(item.bg || "#ffffff")};
            color:${esc(item.color || "#132238")};
          "
        >
          <div class="dyn-content-grid">

            ${
              item.imageUrl
                ? `
                  <img
                    src="${esc(item.imageUrl)}"
                    alt="${esc(item.title || "Page image")}"
                    loading="lazy"
                  >
                `
                : ""
            }

            <div>

              <span
                class="kicker"
                style="color:${esc(
                  item.accent || "#ec4899"
                )}"
              >
                INFORMATION
              </span>

              <h2>${esc(item.title || "")}</h2>

              <p>${esc(item.text || "")}</p>

              ${
                item.buttonText &&
                item.buttonLink
                  ? `
                    <a
                      class="btn btn-blue"
                      href="${esc(
                        safeLink(item.buttonLink)
                      )}"
                    >
                      ${esc(item.buttonText)}
                    </a>
                  `
                  : ""
              }

            </div>

          </div>
        </section>
      `
    )
    .join("");
}

onSnapshot(
  collection(db, "dynamicPages"),

  (snapshot) => {
    pages = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    pagesLoaded = true;
    renderPage();
  },

  (error) => {
    console.error(
      "Dynamic page loading error:",
      error
    );

    const loading = $("dynamicPageLoading");

    if (loading) {
      loading.textContent =
        "Page loading error. Please refresh.";
    }
  }
);

onSnapshot(
  collection(db, "dynamicSections"),

  (snapshot) => {
    sections = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    sectionsLoaded = true;
    renderPage();
  },

  (error) => {
    console.error(
      "Dynamic section loading error:",
      error
    );

    const loading = $("dynamicPageLoading");

    if (loading) {
      loading.textContent =
        "Page content loading error. Please refresh.";
    }
  }
);

setTimeout(() => {
  const loading = $("dynamicPageLoading");

  if (
    loading &&
    loading.style.display !== "none" &&
    (!pagesLoaded || !sectionsLoaded)
  ) {
    loading.textContent =
      "Loading is taking longer than expected. Please refresh.";
  }
}, 8000);
