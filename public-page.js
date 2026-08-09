/* =========================================================
   KHOBRAGADE COMPUTER SERVICE CENTRE
   PUBLIC WEBSITE CONTROLLER
   public-page.js
========================================================= */

import { db } from "./firebase-config.js";

import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  DEFAULT_SERVICES,
  DEFAULT_SCHEMES,
  DEFAULT_DIVYANG,
  DOCUMENT_CHECKLISTS
} from "./catalog-data.js";


/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const norm = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const digits = (value) =>
  String(value || "").replace(/\D/g, "");


/* =========================================================
   WEBSITE DATA
========================================================= */

let settings = {};

let services = [];

let updates = [];

let docs = [];

let notifications = [];

let pages = {};

let youtubeVideos = [];

let cmsGlobal = {};

let cmsHome = {};

let siteSections = [];

let editableChecklists = [];

let dynamicPages = [];

let extraMenus = [];

let activeTheme = {};

let websiteImages = [];


/* =========================================================
   LANGUAGE
========================================================= */

let currentLang =
  localStorage.getItem("kcsLang") || "en";


const UI = {

  en: {
    home: "Home",
    services: "Services",
    yojana: "Yojana",
    divyang: "Divyang",
    documents: "Documents",
    contact: "Contact",
    youtube: "YouTube",
    whatsapp: "WhatsApp",
    search:
      "Search PAN, eShram, Maha ID, UDID, Yojana, documents...",
    apply: "WhatsApp Apply"
  },

  hi: {
    home: "होम",
    services: "सेवाएं",
    yojana: "योजनाएं",
    divyang: "दिव्यांग",
    documents: "दस्तावेज़",
    contact: "संपर्क",
    youtube: "YouTube",
    whatsapp: "WhatsApp",
    search:
      "PAN, eShram, Maha ID, UDID, योजना, दस्तावेज़ खोजें...",
    apply: "WhatsApp से आवेदन"
  },

  mr: {
    home: "मुख्यपृष्ठ",
    services: "सेवा",
    yojana: "योजना",
    divyang: "दिव्यांग",
    documents: "कागदपत्रे",
    contact: "संपर्क",
    youtube: "YouTube",
    whatsapp: "WhatsApp",
    search:
      "PAN, eShram, Maha ID, UDID, योजना, कागदपत्रे शोधा...",
    apply: "WhatsApp अर्ज"
  }

};


/* =========================================================
   LOCALIZED FIELD
========================================================= */

function localized(item, field) {

  if (!item) return "";

  const langField =
    field + currentLang.toUpperCase();

  return (
    item[langField] ||
    item[field] ||
    ""
  );

}


/* =========================================================
   APPLY LANGUAGE
========================================================= */

function applyLanguage() {

  currentLang =
    currentLang ||
    settings.defaultLanguage ||
    "en";

  localStorage.setItem(
    "kcsLang",
    currentLang
  );

  const t =
    UI[currentLang] || UI.en;


  const links = [

    ["index.html", "home"],

    ["services.html", "services"],

    ["maharashtra.html", "yojana"],

    ["divyang.html", "divyang"],

    ["documents.html", "documents"],

    ["contact.html", "contact"]

  ];


  links.forEach(([href, key]) => {

    const link =
      document.querySelector(
        `.nav-links a[href="${href}"]`
      );

    if (link) {

      link.textContent =
        t[key];

    }

  });


  const youtube =
    document.querySelector(
      ".nav-links a[data-youtube]"
    );

  if (youtube) {

    youtube.textContent =
      t.youtube;

  }


  const whatsapp =
    document.querySelector(
      ".nav-links .nav-cta"
    );

  if (whatsapp) {

    whatsapp.textContent =
      t.whatsapp;

  }


  if ($("globalSearch")) {

    $("globalSearch").placeholder =
      t.search;

  }


  if ($("langSelect")) {

    $("langSelect").value =
      currentLang;

  }

}


/* =========================================================
   DARK / LIGHT MODE
========================================================= */

function applyTheme() {

  const primary =
    settings.themePrimary ||
    activeTheme.primary ||
    "#ec4899";

  const secondary =
    settings.themeSecondary ||
    activeTheme.secondary ||
    "#2563eb";

  const menu =
    settings.menuColor ||
    activeTheme.menuBg ||
    "#172554";

  const radius =
    settings.cardRadius ||
    activeTheme.radius ||
    "20";


  document.documentElement.style.setProperty(
    "--primary",
    primary
  );

  document.documentElement.style.setProperty(
    "--pink",
    primary
  );

  document.documentElement.style.setProperty(
    "--secondary",
    secondary
  );

  document.documentElement.style.setProperty(
    "--blue",
    secondary
  );

  document.documentElement.style.setProperty(
    "--menu-bg",
    menu
  );

  document.documentElement.style.setProperty(
    "--radius",
    `${parseInt(radius) || 20}px`
  );


  let mode =
    localStorage.getItem("kcsMode") ||
    settings.defaultMode ||
    "light";


  if (mode === "system") {

    mode =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";

  }


  document.body.classList.toggle(
    "dark",
    mode === "dark"
  );


  const button =
    $("modeToggle");

  if (button) {

    button.textContent =
      mode === "dark"
        ? "☀️"
        : "🌙";

  }


  /* ---------------------------
     WEBSITE LOGO
  --------------------------- */

  const logo =
    settings.logoUrl || "";


  document
    .querySelectorAll("[data-logo]")
    .forEach((img) => {

      if (logo) {

        img.src = logo;

        img.hidden = false;

      } else {

        img.hidden = true;

      }

    });


  document
    .querySelectorAll(
      "[data-logo-letter]"
    )
    .forEach((element) => {

      element.hidden =
        Boolean(logo);

    });

}


/* =========================================================
   DARK MODE BUTTON
========================================================= */

function setupDarkMode() {

  const button =
    $("modeToggle");

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      const isDark =
        document.body.classList.contains(
          "dark"
        );


      const nextMode =
        isDark
          ? "light"
          : "dark";


      localStorage.setItem(
        "kcsMode",
        nextMode
      );


      document.body.classList.toggle(
        "dark",
        nextMode === "dark"
      );


      button.textContent =
        nextMode === "dark"
          ? "☀️"
          : "🌙";

    }
  );

}


/* =========================================================
   LANGUAGE SELECT
========================================================= */

function setupLanguage() {

  const select =
    $("langSelect");

  if (!select) return;


  select.value =
    currentLang;


  select.addEventListener(
    "change",
    () => {

      currentLang =
        select.value || "en";


      localStorage.setItem(
        "kcsLang",
        currentLang
      );


      applyLanguage();

      renderServices();

      renderFeatured();

      renderDocs();

    }
  );

}


/* =========================================================
   DATE / TIME
========================================================= */

function time(value) {

  if (!value) return 0;


  if (
    value?.toDate &&
    typeof value.toDate ===
      "function"
  ) {

    return value
      .toDate()
      .getTime();

  }


  if (value?.seconds) {

    return (
      Number(value.seconds) *
      1000
    );

  }


  const result =
    new Date(value).getTime();


  return Number.isFinite(result)
    ? result
    : 0;

}


/* =========================================================
   WHATSAPP
========================================================= */

function wa(
  name = "Digital service"
) {

  let number =
    digits(
      settings.whatsappNumber ||
      settings.contactNumber ||
      "9637832490"
    );


  if (number.length === 10) {

    number =
      "91" + number;

  }


  const message =
    `Namaste, mujhe ${name} ke liye ` +
    `jankari/apply assistance chahiye. ` +
    `Required documents aur process bataiye.`;


  return (
    `https://wa.me/${number}` +
    `?text=${encodeURIComponent(message)}`
  );

}


/* =========================================================
   APPLY SETTINGS
========================================================= */

function applySettings() {

  const name =
    settings.siteName ||
    "Khobragade Computer Service Centre";


  document
    .querySelectorAll(
      "[data-site-name]"
    )
    .forEach((element) => {

      element.textContent =
        name;

    });


  document
    .querySelectorAll(
      "[data-tagline]"
    )
    .forEach((element) => {

      element.textContent =
        settings.tagline ||
        "Digital Seva & Government Service Assistance";

    });


  document
    .querySelectorAll(
      "[data-address]"
    )
    .forEach((element) => {

      element.textContent =
        settings.address ||
        "Nagpur, Maharashtra, India";

    });


  document
    .querySelectorAll(
      "[data-phone]"
    )
    .forEach((element) => {

      element.textContent =
        settings.contactNumber ||
        "9637832490";

    });


  /* WHATSAPP BUTTONS */

  document
    .querySelectorAll("[data-wa]")
    .forEach((element) => {

      element.href =
        wa(
          element.dataset.message ||
          "Digital service"
        );

      element.target =
        "_blank";

      element.rel =
        "noopener";

    });


  /* CALL BUTTON */

  document
    .querySelectorAll(
      "[data-call]"
    )
    .forEach((element) => {

      let number =
        digits(
          settings.contactNumber ||
          "9637832490"
        );


      if (
        number.length === 10
      ) {

        number =
          "+91" + number;

      }


      element.href =
        "tel:" + number;

    });


  /* YOUTUBE */

  const youtubeURL =
    settings.youtubeChannel ||
    "https://youtube.com/@niteshkhobragade8";


  document
    .querySelectorAll(
      "[data-youtube]"
    )
    .forEach((element) => {

      element.href =
        youtubeURL;

      element.target =
        "_blank";

      element.rel =
        "noopener";

    });


  /* HERO TEXT */

  if ($("heroTitle")) {

    $("heroTitle").textContent =
      settings.heroTitle ||
      name;

  }


  if ($("heroSubtitle")) {

    $("heroSubtitle").textContent =
      settings.heroSubtitle ||
      "Online citizen services, government schemes and document assistance at one place.";

  }


  if ($("homeAboutTitle")) {

    $("homeAboutTitle").textContent =
      settings.homeAboutTitle ||
      name;

  }


  if ($("homeAboutText")) {

    $("homeAboutText").textContent =
      settings.homeAboutText ||
      "Digital applications, government schemes, citizen services and document guidance ke liye professional assistance.";

  }


  if ($("footerText")) {

    $("footerText").textContent =
      settings.footerText ||
      "© 2026 All Rights Reserved";

  }

}


/* =========================================================
   WEBSITE IMAGES FROM ADMIN
========================================================= */

function getImageByCategory(
  category
) {

  const wanted =
    norm(category);


  const rows =
    websiteImages
      .filter((item) => {

        return (
          (item.status ||
            "Published") ===
            "Published" &&
          norm(item.category) ===
            wanted &&
          item.url
        );

      })
      .sort(
        (a, b) =>
          time(
            b.updatedAt ||
            b.createdAt
          ) -
          time(
            a.updatedAt ||
            a.createdAt
          )
      );


  return rows[0] || null;

}


/* =========================================================
   APPLY ADMIN IMAGES
========================================================= */

function applyWebsiteImages() {

  /* HEADER LOGO */

  const logo =
    getImageByCategory(
      "Header Logo"
    );


  if (logo?.url) {

    document
      .querySelectorAll(
        "[data-logo]"
      )
      .forEach((img) => {

        img.src =
          logo.url;

        img.hidden =
          false;

      });


    document
      .querySelectorAll(
        "[data-logo-letter]"
      )
      .forEach((element) => {

        element.hidden =
          true;

      });

  }


  /* HOME BANNER */

  const homeBanner =
    getImageByCategory(
      "Home Banner"
    );


  const hero =
    document.querySelector(
      ".hero"
    );


  if (
    hero &&
    homeBanner?.url
  ) {

    const imageBox =
      hero.querySelector(
        ".hero-panel"
      ) ||
      hero.querySelector(
        ".computer-visual"
      );


    if (imageBox) {

      imageBox.style.backgroundImage =
        `linear-gradient(
          rgba(23,37,84,.12),
          rgba(236,72,153,.08)
        ),
        url("${homeBanner.url}")`;


      imageBox.style.backgroundSize =
        "cover";

      imageBox.style.backgroundPosition =
        "center";

      imageBox.style.backgroundRepeat =
        "no-repeat";

      imageBox.style.minHeight =
        "300px";

      imageBox.style.borderRadius =
        "24px";

      imageBox.style.overflow =
        "hidden";


      Array
        .from(imageBox.children)
        .forEach((child) => {

          child.style.display =
            "none";

        });

    }

  }


  /* PAGE BANNERS */

  const page =
    document.body.dataset.page ||
    document.body.dataset.catalog ||
    "";


  const categoryMap = {

    services:
      "Services Banner",

    yojana:
      "Yojana Banner",

    maharashtra:
      "Yojana Banner",

    divyang:
      "Divyang Banner",

    documents:
      "Documents Banner",

    contact:
      "Contact Banner"

  };


  const category =
    categoryMap[page];


  if (category) {

    const banner =
      getImageByCategory(
        category
      );


    if (banner?.url) {

      const pageHero =
        document.querySelector(
          ".page-hero"
        );


      if (pageHero) {

        pageHero.style.backgroundImage =
          `linear-gradient(
            rgba(23,37,84,.72),
            rgba(37,99,235,.60)
          ),
          url("${banner.url}")`;


        pageHero.style.backgroundSize =
          "cover";

        pageHero.style.backgroundPosition =
          "center";

        pageHero.style.backgroundRepeat =
          "no-repeat";

      }

    }

  }

}


/* =========================================================
   MERGE DEFAULT + FIREBASE SERVICES
========================================================= */

function mergeUnique(
  base,
  live
) {

  const map =
    new Map();


  base.forEach((item) => {

    map.set(
      norm(item.name),
      {
        ...item,
        status:
          "Published"
      }
    );

  });


  live.forEach((item) => {

    const key =
      norm(item.name);


    if (!key) return;


    if (
      (item.status ||
        "Published") ===
      "Published"
    ) {

      map.set(
        key,
        item
      );

    } else {

      map.delete(key);

    }

  });


  return [
    ...map.values()
  ];

}


/* =========================================================
   RELEVANT SERVICES
========================================================= */

function relevant(kind) {

  if (kind === "yojana") {

    return services.filter(
      (item) =>
        /yojana|scheme|scholarship|farmer|agriculture|pension|women|health|housing|employment|labour|food|maharashtra/i.test(
          `${item.category || ""} ${item.name || ""} ${item.description || ""}`
        )
    );

  }


  if (kind === "divyang") {

    return services.filter(
      (item) =>
        /divyang|udid|disability|handicap/i.test(
          `${item.category || ""} ${item.name || ""} ${item.description || ""}`
        )
    );

  }


  return services;

}


/* =========================================================
   DEFAULT CATALOG
========================================================= */

function base(kind) {

  if (
    settings.catalogMode ===
    "firebase"
  ) {

    return [];

  }


  if (kind === "yojana") {

    return DEFAULT_SCHEMES;

  }


  if (kind === "divyang") {

    return DEFAULT_DIVYANG;

  }


  return DEFAULT_SERVICES;

}


/* =========================================================
   SERVICE CARD
========================================================= */

function card(item) {

  const name =
    localized(
      item,
      "name"
    ) ||
    item.name;


  const description =
    localized(
      item,
      "description"
    ) ||
    item.description;


  const id =
    "item-" +
    norm(item.name)
      .replace(
        /[^a-z0-9]+/g,
        "-"
      );


  const t =
    UI[currentLang] ||
    UI.en;


  return `

    <article
      class="pro-card"
      id="${id}"
    >

      <div class="card-icon">
        ${esc(item.icon || "📄")}
      </div>

      <span class="tag">
        ${esc(item.category || "Digital Service")}
      </span>

      <h3>
        ${esc(name)}
      </h3>

      <p>
        ${esc(
          description ||
          "Online application aur document guidance assistance available."
        )}
      </p>

      <div class="card-actions">

        <a
          class="btn btn-wa"
          target="_blank"
          rel="noopener"
          href="${wa(name)}"
        >
          ${esc(t.apply)}
        </a>

      </div>

    </article>

  `;

}


/* =========================================================
   RENDER SERVICES
========================================================= */

function renderServices() {

  const container =
    $("serviceGrid");


  if (!container) return;


  const kind =
    document.body.dataset.catalog ||
    "services";


  const params =
    new URLSearchParams(
      location.search
    );


  const q =
    norm(
      $("serviceSearch")?.value ||
      params.get("q") ||
      ""
    );


  let rows =
    mergeUnique(
      base(kind),
      relevant(kind)
    );


  if (q) {

    rows =
      rows.filter((item) =>

        norm(
          `${item.name || ""} ${item.category || ""} ${item.description || ""}`
        ).includes(q)

      );

  }


  rows.sort(
    (a, b) =>
      Number(Boolean(b.featured)) -
        Number(Boolean(a.featured)) ||
      String(a.name || "")
        .localeCompare(
          String(b.name || "")
        )
  );


  container.innerHTML =
    rows.length

      ? rows
          .map(card)
          .join("")

      : `
        <div class="empty">
          No matching result found.
        </div>
      `;

}


/* =========================================================
   FEATURED SERVICES
========================================================= */

function renderFeatured() {

  const container =
    $("featuredServiceGrid");


  if (!container) return;


  const preferred = [

    "eShram Card",

    "PAN Card",

    "Voter ID",

    "ABHA Card",

    "Ayushman Card",

    "Maha ID",

    "Income Certificate",

    "UDID Card"

  ];


  const all =
    mergeUnique(
      DEFAULT_SERVICES,
      services
    );


  let rows =
    preferred
      .map((name) =>
        all.find((item) =>
          norm(item.name).includes(
            norm(name)
          )
        )
      )
      .filter(Boolean);


  if (rows.length < 8) {

    rows = [

      ...rows,

      ...all
        .filter(
          (item) =>
            !rows.includes(item)
        )
        .slice(
          0,
          8 - rows.length
        )

    ];

  }


  container.innerHTML =
    rows
      .slice(0, 8)
      .map(
        (item) => `

          <a
            class="pro-card service-link"
            href="services.html?q=${encodeURIComponent(item.name)}"
          >

            <div class="card-icon">
              ${esc(item.icon || "📄")}
            </div>

            <span class="tag">
              ${esc(item.category || "Service")}
            </span>

            <h3>
              ${esc(item.name)}
            </h3>

            <p>
              ${esc(
                item.description ||
                "Digital service assistance"
              )}
            </p>

            <div class="arrow">
              View service →
            </div>

          </a>

        `
      )
      .join("");

}
/* =========================================================
   GOVERNMENT UPDATES
========================================================= */

function renderUpdates() {

  const box =
    $("latestPublicUpdates");

  if (!box) return;


  const rows =
    updates
      .filter(
        item =>
          (item.status || "Published") ===
          "Published"
      )
      .sort(
        (a, b) =>
          time(
            b.createdAt ||
            b.updatedAt
          ) -
          time(
            a.createdAt ||
            a.updatedAt
          )
      );


  box.innerHTML =
    rows.length
      ? rows.map(item => `

          <article class="pro-card">

            <div class="card-icon">
              📢
            </div>

            <h3>
              ${esc(item.title || "Government Update")}
            </h3>

            <p>
              ${esc(item.description || "")}
            </p>

            <small>
              ${esc(item.category || "Government Update")}
            </small>

          </article>

        `).join("")

      : `
        <div class="empty">
          No updates yet.
        </div>
      `;

}


/* =========================================================
   POPUP NOTIFICATION
========================================================= */

function renderPopup() {

  const item =
    notifications
      .filter(
        row =>
          (row.status || "Published") ===
            "Published" &&
          row.type === "popup"
      )
      .sort(
        (a, b) =>
          time(
            b.createdAt ||
            b.updatedAt
          ) -
          time(
            a.createdAt ||
            a.updatedAt
          )
      )[0];


  if (!item) return;


  const key =
    "popup-" + item.id;


  if (
    sessionStorage.getItem(key) ===
    "seen"
  ) {
    return;
  }


  sessionStorage.setItem(
    key,
    "seen"
  );


  const overlay =
    document.createElement(
      "div"
    );


  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    z-index:99999;
    display:grid;
    place-items:center;
    padding:20px;
  `;


  overlay.innerHTML = `

    <div style="
      width:min(480px,100%);
      background:#fff;
      color:#132238;
      border-radius:20px;
      padding:24px;
      box-shadow:0 25px 70px rgba(0,0,0,.3);
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:flex-start;
      ">

        <h3>
          ${esc(item.title || "Notification")}
        </h3>

        <button
          type="button"
          data-close-popup
          style="
            border:0;
            background:#eee;
            border-radius:50%;
            width:34px;
            height:34px;
            cursor:pointer;
          "
        >
          ✕
        </button>

      </div>

      <p style="margin-top:10px">
        ${esc(item.description || "")}
      </p>

    </div>

  `;


  overlay
    .querySelector(
      "[data-close-popup]"
    )
    ?.addEventListener(
      "click",
      () => overlay.remove()
    );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    }
  );


  document.body
    .appendChild(
      overlay
    );

}


/* =========================================================
   DYNAMIC + EXTRA MENU
========================================================= */

function renderDynamicMenu() {

  const host =
    $("dynamicMenuItems");

  if (!host) return;


  const pageMenus =
    dynamicPages
      .filter(
        item =>
          (item.status || "Published") ===
            "Published" &&
          item.inMenu !== false
      )
      .map(item => ({

        name:
          item.menuName ||
          item.name ||
          "Page",

        link:
          "dynamic-page.html?page=" +
          encodeURIComponent(
            item.slug || ""
          ),

        order:
          Number(
            item.order ??
            item.menuOrder ??
            50
          ),

        target:
          "_self"

      }));


  const manualMenus =
    extraMenus
      .filter(
        item =>
          item.visible !== false
      )
      .map(item => ({

        name:
          item.name ||
          "Menu",

        link:
          item.link ||
          "#",

        order:
          Number(
            item.order ||
            80
          ),

        target:
          item.target ||
          "_self"

      }));


  host.innerHTML =
    [
      ...pageMenus,
      ...manualMenus
    ]
      .sort(
        (a, b) =>
          a.order - b.order
      )
      .map(item => `

        <a
          class="dynamic-nav-link"
          href="${esc(item.link)}"
          target="${esc(item.target)}"
          ${item.target === "_blank"
            ? 'rel="noopener"'
            : ""}
        >
          ${esc(item.name)}
        </a>

      `)
      .join("");

}


/* =========================================================
   MAIN MENU SHOW/HIDE + ORDER
========================================================= */

function applyMainMenuControl(
  global = {}
) {

  const nav =
    document.querySelector(
      ".nav-links"
    );

  if (!nav) return;


  const rows = [

    [
      "navHome",
      "navHomeVisible",
      "navHomeOrder",
      10
    ],

    [
      "navServices",
      "navServicesVisible",
      "navServicesOrder",
      20
    ],

    [
      "navYojana",
      "navYojanaVisible",
      "navYojanaOrder",
      30
    ],

    [
      "navDivyang",
      "navDivyangVisible",
      "navDivyangOrder",
      40
    ],

    [
      "navDocuments",
      "navDocumentsVisible",
      "navDocumentsOrder",
      50
    ],

    [
      "navContact",
      "navContactVisible",
      "navContactOrder",
      60
    ],

    [
      "navYoutube",
      "navYoutubeVisible",
      "navYoutubeOrder",
      70
    ],

    [
      "navWhatsapp",
      "navWhatsappVisible",
      "navWhatsappOrder",
      80
    ]

  ];


  rows.forEach(
    ([
      id,
      visibleKey,
      orderKey,
      defaultOrder
    ]) => {

      const element =
        nav.querySelector(
          "#" + id
        );


      if (!element) return;


      element.style.display =
        global[visibleKey] === false
          ? "none"
          : "";


      element.dataset.cmsOrder =
        String(
          Number(
            global[orderKey] ??
            defaultOrder
          )
        );

    }
  );


  const anchor =
    nav.querySelector(
      "#dynamicMenuItems"
    ) ||
    nav.querySelector(
      "#langSelect"
    );


  rows
    .map(([id]) =>
      nav.querySelector(
        "#" + id
      )
    )
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(
          a.dataset.cmsOrder ||
          0
        ) -
        Number(
          b.dataset.cmsOrder ||
          0
        )
    )
    .forEach(element => {

      if (anchor) {

        nav.insertBefore(
          element,
          anchor
        );

      } else {

        nav.appendChild(
          element
        );

      }

    });

}


/* =========================================================
   FULL WEBSITE CMS
========================================================= */

function applyFullCms() {

  const global =
    cmsGlobal || {};

  const home =
    cmsHome || {};


  const text = (
    id,
    value
  ) => {

    const element =
      $(id);

    if (
      element &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {

      element.textContent =
        value;

    }

  };


  text(
    "cmsTopLeftPublic",
    global.topLeft
  );

  text(
    "navHome",
    global.navHome
  );

  text(
    "navServices",
    global.navServices
  );

  text(
    "navYojana",
    global.navYojana
  );

  text(
    "navDivyang",
    global.navDivyang
  );

  text(
    "navDocuments",
    global.navDocuments
  );

  text(
    "navContact",
    global.navContact
  );

  text(
    "navYoutube",
    global.navYoutube
  );

  text(
    "navWhatsapp",
    global.navWhatsapp
  );


  if (
    $("globalSearch") &&
    global.searchPlaceholder
  ) {

    $("globalSearch").placeholder =
      global.searchPlaceholder;

  }


  text(
    "globalSearchButton",
    global.searchButton
  );


  if (
    $("globalSearchSection")
  ) {

    $("globalSearchSection")
      .style.display =
        global.searchVisible === false
          ? "none"
          : "";

  }


  text(
    "footerQuickTitle",
    global.footerQuickTitle
  );

  text(
    "footerSupportTitle",
    global.footerSupportTitle
  );


  if (
    $("footerText") &&
    global.copyright
  ) {

    $("footerText").textContent =
      global.copyright;

  }


  if (
    global.menuBg &&
    !activeTheme.menuBg
  ) {

    document.documentElement
      .style
      .setProperty(
        "--menu-bg",
        global.menuBg
      );

  }


  if (
    global.menuText
  ) {

    document.documentElement
      .style
      .setProperty(
        "--menu-text",
        global.menuText
      );

  }


  if (
    global.menuActive
  ) {

    document.documentElement
      .style
      .setProperty(
        "--menu-active",
        global.menuActive
      );

  }


  if (
    $("siteFooter") &&
    global.footerBg &&
    !activeTheme.footer
  ) {

    $("siteFooter").style.background =
      global.footerBg;

  }


  applyMainMenuControl(
    global
  );


  /* HOME CONTROLS */

  if (
    document.body.dataset.page ===
    "home"
  ) {

    text(
      "homeHeroEyebrow",
      home.heroEyebrow
    );


    if (
      $("heroTitle") &&
      home.heroTitle
    ) {

      $("heroTitle").textContent =
        home.heroTitle;

    }


    if (
      $("heroSubtitle") &&
      home.heroText
    ) {

      $("heroSubtitle").textContent =
        home.heroText;

    }


    text(
      "homeHeroBtn1",
      home.heroBtn1
    );

    text(
      "homeHeroBtn2",
      home.heroBtn2
    );


    if (
      $("homeHeroSection")
    ) {

      $("homeHeroSection")
        .style.display =
          home.heroVisible === false
            ? "none"
            : "";


      if (
        home.heroColor1 &&
        home.heroColor2
      ) {

        $("homeHeroSection")
          .style.background =
            `linear-gradient(
              135deg,
              ${home.heroColor1},
              ${home.heroColor2}
            )`;

      }

    }


    text(
      "homeYoutubeTitle",
      home.youtubeTitle
    );

    text(
      "homeYoutubeText",
      home.youtubeText
    );


    if (
      $("youtubeHomeSection")
    ) {

      $("youtubeHomeSection")
        .style.display =
          home.youtubeVisible === false
            ? "none"
            : "";

    }


    text(
      "homeQuickTitle",
      home.quickTitle
    );

    text(
      "homeQuickText",
      home.quickText
    );

    text(
      "homeQuickButton",
      home.quickButton
    );


    if (
      $("homeQuickSection")
    ) {

      $("homeQuickSection")
        .style.display =
          home.quickVisible === false
            ? "none"
            : "";

    }


    text(
      "homeAboutKicker",
      home.aboutKicker
    );


    if (
      $("homeAboutTitle") &&
      home.aboutTitle
    ) {

      $("homeAboutTitle")
        .textContent =
          home.aboutTitle;

    }


    if (
      $("homeAboutText") &&
      home.aboutText
    ) {

      $("homeAboutText")
        .textContent =
          home.aboutText;

    }


    if (
      $("homeAboutSection")
    ) {

      $("homeAboutSection")
        .style.display =
          home.aboutVisible === false
            ? "none"
            : "";

    }

  }


  renderCustomSections();

}


/* =========================================================
   SAFE LINK
========================================================= */

function safeLink(value) {

  const link =
    String(value || "")
      .trim();


  if (
    /^https?:\/\//i.test(link) ||
    /^[a-z0-9_-]+\.html/i.test(link) ||
    link.startsWith("#")
  ) {

    return link;

  }


  return "#";

}


/* =========================================================
   CUSTOM SECTION HTML
========================================================= */

function customSectionHtml(
  item
) {

  return `

    <section
      class="section cms-custom-section"
      data-cms-generated="1"
      style="
        background:${esc(item.bgColor || "#ffffff")};
        color:${esc(item.textColor || "#132238")};
      "
    >

      <div class="section-inner">

        <div class="cms-custom-grid">

          ${
            item.imageUrl
              ? `
                <img
                  src="${esc(item.imageUrl)}"
                  alt="${esc(item.title || "Section image")}"
                  loading="lazy"
                >
              `
              : ""
          }

          <div>

            <span
              class="kicker"
              style="
                color:${esc(item.accentColor || "#ec4899")}
              "
            >
              CUSTOM
            </span>

            <h2>
              ${esc(item.title || "")}
            </h2>

            <p>
              ${esc(item.description || "")}
            </p>

            ${
              item.buttonText &&
              item.buttonLink
                ? `
                  <a
                    class="btn btn-blue"
                    href="${esc(safeLink(item.buttonLink))}"
                    ${
                      /^https?:/i.test(
                        item.buttonLink
                      )
                        ? 'target="_blank" rel="noopener"'
                        : ""
                    }
                  >
                    ${esc(item.buttonText)}
                  </a>
                `
                : ""
            }

          </div>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   CUSTOM SECTION POSITION / ORDER
========================================================= */

function renderCustomSections() {

  document
    .querySelectorAll(
      '.cms-custom-section[data-cms-generated="1"]'
    )
    .forEach(
      element =>
        element.remove()
    );


  const page =
    document.body.dataset.page ||
    document.body.dataset.catalog ||
    "home";


  const rows =
    siteSections
      .filter(
        item =>
          item.page === page &&
          item.visible !== false
      )
      .sort(
        (a, b) =>
          Number(a.order || 50) -
          Number(b.order || 50)
      );


  if (
    page !== "home"
  ) {

    const host =
      $("customSectionsHost");


    if (host) {

      host.innerHTML =
        rows
          .map(
            customSectionHtml
          )
          .join("");

    }


    return;
  }


  const builtins = [

    [
      $("homeHeroSection"),
      10
    ],

    [
      $("homeUpdatesSection"),
      20
    ],

    [
      $("youtubeHomeSection"),
      30
    ],

    [
      $("homeQuickSection"),
      40
    ],

    [
      $("homeAboutSection"),
      50
    ]

  ].filter(
    row => row[0]
  );


  rows.forEach(
    item => {

      const wrapper =
        document.createElement(
          "div"
        );


      wrapper.innerHTML =
        customSectionHtml(
          item
        );


      const node =
        wrapper.firstElementChild;


      const order =
        Number(
          item.order ||
          50
        );


      const target =
        builtins.find(
          ([, value]) =>
            value > order
        )?.[0];


      if (target) {

        target.parentNode
          .insertBefore(
            node,
            target
          );

      } else {

        const footer =
          $("siteFooter");


        if (
          footer &&
          footer.parentNode
        ) {

          footer.parentNode
            .insertBefore(
              node,
              footer
            );

        }

      }

    }
  );

}


/* =========================================================
   APPLY WEBSITE PAGE CONTENT
========================================================= */

function applyPage() {

  const key =
    document.body.dataset.page ||
    document.body.dataset.catalog ||
    "home";


  const page =
    pages[key];


  if (
    !page ||
    page.status ===
      "Draft"
  ) {

    return;

  }


  if (
    $("pageHeroTitle") &&
    page.title
  ) {

    $("pageHeroTitle")
      .textContent =
        page.title;

  }


  if (
    $("pageHeroSubtitle") &&
    page.subtitle
  ) {

    $("pageHeroSubtitle")
      .textContent =
        page.subtitle;

  }


  if (
    $("pageDescription") &&
    page.description
  ) {

    $("pageDescription")
      .textContent =
        page.description;

  }

}


/* =========================================================
   DOCUMENTS
========================================================= */

function renderDocs() {

  const container =
    $("documentGrid");

  if (!container) return;


  const params =
    new URLSearchParams(
      location.search
    );


  const query =
    norm(
      $("documentSearchPublic")?.value ||
      params.get("q") ||
      ""
    );


  const source =
    settings.documentsMode ===
    "firebase"
      ? editableChecklists
          .filter(
            item =>
              (item.status || "Published") ===
              "Published"
          )
      : DOCUMENT_CHECKLISTS;


  const checklists =
    source
      .filter(
        item =>
          !query ||
          norm(
            `${item.title || ""}
             ${item.category || ""}
             ${(item.items || []).join(" ")}`
          ).includes(query)
      )
      .map(item => `

        <article class="pro-card">

          <div class="card-icon">
            📋
          </div>

          <span class="tag">
            ${esc(item.category || "Documents")}
          </span>

          <h3>
            ${esc(item.title || "Documents")}
          </h3>

          <ol>

            ${(item.items || [])
              .map(
                row =>
                  `<li>${esc(row)}</li>`
              )
              .join("")}

          </ol>

          <div class="card-actions">

            <a
              class="btn btn-wa"
              target="_blank"
              rel="noopener"
              href="${wa(item.title)}"
            >
              WhatsApp Confirm
            </a>

          </div>

        </article>

      `);


  const uploaded =
    docs
      .filter(
        item =>
          (item.status || "Published") ===
            "Published" &&
          (
            !query ||
            norm(
              `${item.title || ""}
               ${item.category || ""}`
            ).includes(query)
          )
      )
      .map(item => `

        <article class="pro-card">

          <div class="card-icon">
            📄
          </div>

          <h3>
            ${esc(item.title || "Document")}
          </h3>

          ${
            item.url
              ? `
                <a
                  class="btn btn-blue"
                  target="_blank"
                  rel="noopener"
                  href="${esc(item.url)}"
                >
                  Open Document
                </a>
              `
              : ""
          }

        </article>

      `);


  container.innerHTML =
    [
      ...checklists,
      ...uploaded
    ].join("") ||
    `
      <div class="empty">
        No matching documents found.
      </div>
    `;

}


/* =========================================================
   YOUTUBE ID
========================================================= */

function youtubeId(url) {

  try {

    const parsed =
      new URL(url);


    if (
      parsed.hostname ===
      "youtu.be"
    ) {

      return (
        parsed.pathname
          .split("/")[1] ||
        ""
      );

    }


    if (
      parsed.pathname
        .startsWith(
          "/shorts/"
        )
    ) {

      return (
        parsed.pathname
          .split("/")[2] ||
        ""
      );

    }


    return (
      parsed.searchParams
        .get("v") ||
      ""
    );

  }

  catch (_) {

    return "";

  }

}


/* =========================================================
   YOUTUBE VIDEOS
========================================================= */

function renderYoutube() {

  const container =
    $("homeYoutubeGrid");

  if (!container) return;


  const rows =
    youtubeVideos
      .filter(
        item =>
          (item.status || "Published") ===
          "Published"
      )
      .sort(
        (a, b) =>
          time(
            b.createdAt ||
            b.updatedAt
          ) -
          time(
            a.createdAt ||
            a.updatedAt
          )
      )
      .slice(
        0,
        6
      );


  container.innerHTML =
    rows.length
      ? rows.map(item => {

          const id =
            youtubeId(
              item.link || ""
            );


          const thumb =
            id
              ? `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
              : "";


          return `

            <article class="youtube-public-card">

              ${
                thumb
                  ? `
                    <img
                      class="youtube-thumb"
                      src="${thumb}"
                      alt="${esc(item.title || "YouTube video")}"
                      loading="lazy"
                    >
                  `
                  : `
                    <div
                      class="youtube-thumb"
                      style="
                        display:grid;
                        place-items:center;
                        color:#fff;
                        font-size:50px;
                      "
                    >
                      ▶
                    </div>
                  `
              }

              <div class="youtube-public-body">

                <h3>
                  ${esc(item.title || "YouTube Video")}
                </h3>

                <p>
                  ${esc(
                    item.description ||
                    "Watch latest video from our YouTube channel."
                  )}
                </p>

                <a
                  class="btn btn-blue"
                  href="${esc(
                    item.link ||
                    settings.youtubeChannel ||
                    "#"
                  )}"
                  target="_blank"
                  rel="noopener"
                >
                  ▶ Watch Video
                </a>

              </div>

            </article>

          `;

        }).join("")

      : `
        <div class="empty">
          Admin Dashboard → YouTube me Published video add karein.
        </div>
      `;

}


/* =========================================================
   NOTIFICATION / BREAKING BAR
========================================================= */

function renderNotice() {

  const latest =
    notifications
      .filter(
        item =>
          (item.status || "Published") ===
          "Published"
      )
      .sort(
        (a, b) =>
          time(
            b.createdAt ||
            b.updatedAt
          ) -
          time(
            a.createdAt ||
            a.updatedAt
          )
      )[0];


  const box =
    $("homeNotification");


  if (
    latest &&
    box
  ) {

    box.innerHTML = `

      <strong>
        📢 ${esc(latest.title || "")}
      </strong>

      <p>
        ${esc(latest.description || "")}
      </p>

    `;

  }


  const breaking =
    notifications
      .filter(
        item =>
          (item.status || "Published") ===
            "Published" &&
          item.type ===
            "breaking"
      )
      .sort(
        (a, b) =>
          time(b.createdAt) -
          time(a.createdAt)
      )[0];


  const bar =
    $("breakingBar");


  if (
    breaking &&
    bar
  ) {

    if (
      $("breakingText")
    ) {

      $("breakingText")
        .textContent =
          breaking.title +
          (
            breaking.description
              ? " — " +
                breaking.description
              : ""
          );

    }


    bar.style.display =
      "block";

  }

  else if (bar) {

    bar.style.display =
      "none";

  }

}


/* =========================================================
   GLOBAL SEARCH INDEX
========================================================= */

function searchIndex() {

  const output = [];


  mergeUnique(
    DEFAULT_SERVICES,
    services
  )
    .forEach(item => {

      output.push({

        name:
          item.name,

        meta:
          item.category ||
          "Service",

        url:
          "services.html?q=" +
          encodeURIComponent(
            item.name
          ),

        text:
          `${item.name || ""}
           ${item.category || ""}
           ${item.description || ""}`

      });

    });


  mergeUnique(
    DEFAULT_SCHEMES,
    relevant("yojana")
  )
    .forEach(item => {

      output.push({

        name:
          item.name,

        meta:
          "Government Yojana",

        url:
          "maharashtra.html?q=" +
          encodeURIComponent(
            item.name
          ),

        text:
          `${item.name || ""}
           ${item.category || ""}
           ${item.description || ""}`

      });

    });


  mergeUnique(
    DEFAULT_DIVYANG,
    relevant("divyang")
  )
    .forEach(item => {

      output.push({

        name:
          item.name,

        meta:
          "Divyang",

        url:
          "divyang.html?q=" +
          encodeURIComponent(
            item.name
          ),

        text:
          `${item.name || ""}
           ${item.category || ""}
           ${item.description || ""}`

      });

    });


  const checklistSource =
    settings.documentsMode ===
    "firebase"
      ? editableChecklists
      : DOCUMENT_CHECKLISTS;


  checklistSource
    .filter(
      item =>
        (item.status || "Published") ===
        "Published"
    )
    .forEach(item => {

      output.push({

        name:
          `${item.title} Documents`,

        meta:
          "Documents",

        url:
          "documents.html?q=" +
          encodeURIComponent(
            item.title
          ),

        text:
          `${item.title || ""}
           ${item.category || ""}
           ${(item.items || []).join(" ")}`

      });

    });


  return output;

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function globalSearch() {

  const query =
    norm(
      $("globalSearch")?.value
    );


  const box =
    $("globalSearchResults");


  if (!box) return;


  if (
    query.length < 2
  ) {

    box.style.display =
      "none";

    return;
  }


  const rows =
    searchIndex()
      .filter(
        item =>
          norm(item.text)
            .includes(query)
      )
      .slice(
        0,
        12
      );


  box.innerHTML =
    rows.length
      ? rows.map(item => `

          <a
            class="search-result"
            href="${esc(item.url)}"
          >

            <strong>
              ${esc(item.name)}
            </strong>

            <small>
              ${esc(item.meta)}
              · Open page →
            </small>

          </a>

        `).join("")

      : `
        <div class="search-result">

          <strong>
            No matching result found
          </strong>

          <small>
            Try another keyword.
          </small>

        </div>
      `;


  box.style.display =
    "block";

}


/* =========================================================
   ACTIVE MENU
========================================================= */

function markActiveMenu() {

  const current =
    location.pathname
      .split("/")
      .pop() ||
    "index.html";


  document
    .querySelectorAll(
      ".nav-links a"
    )
    .forEach(link => {

      const href =
        link.getAttribute(
          "href"
        );


      if (
        href === current
      ) {

        link.classList.add(
          "active"
        );

      }

    });

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

  $("globalSearch")
    ?.addEventListener(
      "input",
      globalSearch
    );


  $("globalSearchButton")
    ?.addEventListener(
      "click",
      globalSearch
    );


  document
    .querySelector(
      ".global-search-box button"
    )
    ?.addEventListener(
      "click",
      globalSearch
    );


  document.addEventListener(
    "click",
    event => {

      if (
        !event.target.closest(
          ".global-search-inner"
        ) &&
        $("globalSearchResults")
      ) {

        $("globalSearchResults")
          .style.display =
            "none";

      }

    }
  );


  $("serviceSearch")
    ?.addEventListener(
      "input",
      renderServices
    );


  $("documentSearchPublic")
    ?.addEventListener(
      "input",
      renderDocs
    );


  setupLanguage();

  setupDarkMode();

}


/* =========================================================
   INITIAL RENDER
========================================================= */

function refreshPublicWebsite() {

  applySettings();

  applyTheme();

  applyLanguage();

  applyFullCms();

  applyPage();

  renderDynamicMenu();

  renderServices();

  renderFeatured();

  renderDocs();

  renderYoutube();

  renderNotice();

  renderUpdates();

  renderCustomSections();

  applyWebsiteImages();

}


/* =========================================================
   FIRESTORE LIVE LISTENERS
========================================================= */

/* WEBSITE SETTINGS */

onSnapshot(

  doc(
    db,
    "settings",
    "website"
  ),

  snapshot => {

    settings =
      snapshot.exists()
        ? snapshot.data()
        : {};


    if (
      !currentLang
    ) {

      currentLang =
        settings.defaultLanguage ||
        "en";

    }


    refreshPublicWebsite();

  },

  error => {

    console.error(
      "Website settings error:",
      error
    );

  }

);


/* ACTIVE THEME */

onSnapshot(

  doc(
    db,
    "settings",
    "activeTheme"
  ),

  snapshot => {

    activeTheme =
      snapshot.exists()
        ? snapshot.data()
        : {};


    applyTheme();

    applyFullCms();

  },

  error => {

    console.error(
      "Active theme error:",
      error
    );

  }

);


/* SERVICES */

onSnapshot(

  collection(
    db,
    "services"
  ),

  snapshot => {

    services =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderServices();

    renderFeatured();

  },

  error => {

    console.error(
      "Services error:",
      error
    );

  }

);


/* GOVERNMENT UPDATES */

onSnapshot(

  collection(
    db,
    "updates"
  ),

  snapshot => {

    updates =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderUpdates();

  },

  error => {

    console.error(
      "Updates error:",
      error
    );

  }

);


/* DOCUMENTS */

onSnapshot(

  collection(
    db,
    "documents"
  ),

  snapshot => {

    docs =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderDocs();

  },

  error => {

    console.error(
      "Documents error:",
      error
    );

  }

);


/* NOTIFICATIONS */

onSnapshot(

  collection(
    db,
    "notifications"
  ),

  snapshot => {

    notifications =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderNotice();

    renderPopup();

  },

  error => {

    console.error(
      "Notifications error:",
      error
    );

  }

);


/* PAGE CONTENT */

onSnapshot(

  collection(
    db,
    "pageContent"
  ),

  snapshot => {

    pages = {};


    snapshot.docs
      .forEach(item => {

        pages[item.id] =
          item.data();

      });


    applyPage();

  },

  error => {

    console.error(
      "Page Content error:",
      error
    );

  }

);


/* YOUTUBE */

onSnapshot(

  collection(
    db,
    "youtube"
  ),

  snapshot => {

    youtubeVideos =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderYoutube();

  },

  error => {

    console.error(
      "YouTube error:",
      error
    );

  }

);


/* GLOBAL CMS */

onSnapshot(

  doc(
    db,
    "settings",
    "cmsGlobal"
  ),

  snapshot => {

    cmsGlobal =
      snapshot.exists()
        ? snapshot.data()
        : {};


    applyFullCms();

  },

  error => {

    console.error(
      "CMS Global error:",
      error
    );

  }

);


/* HOME CMS */

onSnapshot(

  doc(
    db,
    "settings",
    "cmsHome"
  ),

  snapshot => {

    cmsHome =
      snapshot.exists()
        ? snapshot.data()
        : {};


    applyFullCms();

  },

  error => {

    console.error(
      "CMS Home error:",
      error
    );

  }

);


/* CUSTOM SECTIONS */

onSnapshot(

  collection(
    db,
    "siteSections"
  ),

  snapshot => {

    siteSections =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderCustomSections();

  },

  error => {

    console.error(
      "Site Sections error:",
      error
    );

  }

);


/* DOCUMENT CHECKLISTS */

onSnapshot(

  collection(
    db,
    "documentChecklists"
  ),

  snapshot => {

    editableChecklists =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderDocs();

  },

  error => {

    console.error(
      "Document Checklist error:",
      error
    );

  }

);


/* DYNAMIC PAGES */

onSnapshot(

  collection(
    db,
    "dynamicPages"
  ),

  snapshot => {

    dynamicPages =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderDynamicMenu();

  },

  error => {

    console.error(
      "Dynamic Pages error:",
      error
    );

  }

);


/* EXTRA MENU */

onSnapshot(

  collection(
    db,
    "menuItems"
  ),

  snapshot => {

    extraMenus =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderDynamicMenu();

  },

  error => {

    console.error(
      "Menu Items error:",
      error
    );

  }

);


/* =========================================================
   IMAGES — CLOUDINARY/FIRESTORE IMAGE MANAGER
========================================================= */

onSnapshot(

  collection(
    db,
    "images"
  ),

  snapshot => {

    websiteImages =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    /*
      Latest Home Banner / Header Logo /
      Services Banner etc. automatically apply.
    */

    applyWebsiteImages();

  },

  error => {

    console.error(
      "Website Images error:",
      error
    );

  }

);


/* =========================================================
   VISITOR ANALYTICS
========================================================= */

function countVisitor() {

  if (
    sessionStorage.getItem(
      "khobragadeVisitorCounted"
    )
  ) {

    return;

  }


  sessionStorage.setItem(
    "khobragadeVisitorCounted",
    "yes"
  );


  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  Promise.all([

    setDoc(
      doc(
        db,
        "analytics",
        "site"
      ),
      {

        totalVisitors:
          increment(1),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    ),


    setDoc(
      doc(
        db,
        "visitorDaily",
        today
      ),
      {

        date:
          today,

        count:
          increment(1),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    )

  ]).catch(
    error =>
      console.warn(
        "Analytics count error:",
        error
      )
  );

}


/* =========================================================
   START WEBSITE
========================================================= */

markActiveMenu();

setupEvents();

refreshPublicWebsite();

countVisitor();


console.log(
  "✅ Khobragade Public Website JS Loaded Successfully"
);
