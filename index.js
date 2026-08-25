import { db } from "./supabase-app.js";
import {
  collection,
  onSnapshot,
  doc,
  onSnapshot as watchDoc,
  setDoc,
  increment,
  serverTimestamp
} from "./supabase-compat.js";

const $ = (id) => document.getElementById(id);
let publicServices = [];

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function timeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}
function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}
function whatsappLink(phone, text) {
  const digits = normalizePhone(phone);
  const final = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${final}?text=${encodeURIComponent(text)}`;
}

function applySettings(data) {
  const siteName = data.siteName || "Khobragade Computer Service Centre";
  if ($("publicSiteName")) $("publicSiteName").textContent = siteName;
  if ($("publicHeroTitle")) $("publicHeroTitle").textContent = data.heroTitle || siteName;
  if ($("publicHeroSubtitle")) $("publicHeroSubtitle").textContent = data.heroSubtitle || data.tagline || "CSC Digital Seva | Maharashtra Government Schemes | Online Services";
  if ($("publicFooterName")) $("publicFooterName").textContent = siteName;
  if ($("publicFooterText")) $("publicFooterText").textContent = data.footerText || "© 2026 All Rights Reserved";

  const phone = data.contactNumber || "9637832490";
  const whatsapp = data.whatsappNumber || phone;
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => link.href = `tel:+${normalizePhone(phone).length === 10 ? "91" : ""}${normalizePhone(phone)}`);
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => link.href = whatsappLink(whatsapp, "Hello, I need CSC service information."));
  if (data.youtubeChannel) {
    document.querySelectorAll('a[href*="youtube.com"]').forEach((link) => link.href = data.youtubeChannel);
  }
  document.title = siteName;
}

function renderServices() {
  const container = $("featuredServices");
  if (!container) return;
  const search = document.querySelector(".search input")?.value.trim().toLowerCase() || "";
  let services = publicServices.filter((item) => !search || `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(search));
  services = services.sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, search ? 30 : 12);
  if (!services.length) {
    container.innerHTML = `<div class="card"><h3>No matching service</h3><p>Admin Dashboard se service publish karte hi yahan dikh jayegi.</p></div>`;
    return;
  }
  container.innerHTML = services.map((item) => `
    <div class="card">
      <h3>${escapeHTML(item.icon || "📄")} ${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.description || "")}</p>
      <small style="display:block;margin-top:8px;color:#667085;">${escapeHTML(item.category || "CSC Service")}</small>
      <a class="btn whatsapp public-service-apply" href="services.html">View Service</a>
    </div>`).join("");
}

onSnapshot(collection(db, "services"), (snapshot) => {
  publicServices = snapshot.docs.map((item) => ({ id:item.id, ...item.data() })).filter((item) => (item.status || "Published") === "Published");
  renderServices();
}, (error) => console.error("Public services error:", error));

onSnapshot(collection(db, "updates"), (snapshot) => {
  const container = $("latestPublicUpdates");
  if (!container) return;
  const updates = snapshot.docs.map((item) => ({ id:item.id, ...item.data() }))
    .filter((item) => (item.status || "Published") === "Published")
    .sort((a,b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt))
    .sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 8);
  container.innerHTML = updates.length ? updates.map((item) => `
    <div class="card">
      <h3>📢 ${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description || "")}</p>
      <small style="display:block;margin-top:8px;color:#667085;">${escapeHTML(item.category || "Government Update")}</small>
    </div>`).join("") : `<div class="card"><h3>No Updates Yet</h3><p>Admin Dashboard se new update publish kijiye.</p></div>`;
}, (error) => console.error("Public updates error:", error));

onSnapshot(collection(db, "notifications"), (snapshot) => {
  const published = snapshot.docs.map((item) => ({ id:item.id, ...item.data() }))
    .filter((item) => (item.status || "Published") === "Published")
    .sort((a,b) => timeValue(b.createdAt || b.updatedAt) - timeValue(a.createdAt || a.updatedAt));
  const breaking = published.find((item) => item.type === "breaking");
  const popup = published.find((item) => item.type === "popup");
  const bar = $("publicBreakingBar");
  const text = $("publicBreakingText");
  if (bar && text && breaking) {
    text.textContent = `${breaking.title}${breaking.description ? " — " + breaking.description : ""}`;
    bar.style.display = "block";
  } else if (bar) {
    bar.style.display = "none";
  }

  if (popup && sessionStorage.getItem(`popup-${popup.id}`) !== "seen") {
    sessionStorage.setItem(`popup-${popup.id}`, "seen");
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;background:rgba(17,24,39,.55);z-index:99999;display:grid;place-items:center;padding:20px;";
    box.innerHTML = `<div style="width:min(480px,100%);background:#fff;border-radius:20px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.3);border-top:7px solid #2979FF;"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><h3 style="font-size:21px;color:#111827;">${escapeHTML(popup.title)}</h3><button type="button" data-close-popup style="border:0;background:#f2f4f7;border-radius:50%;width:34px;height:34px;cursor:pointer;">✕</button></div><p style="margin-top:10px;color:#475467;white-space:pre-line;">${escapeHTML(popup.description || "")}</p></div>`;
    box.querySelector("[data-close-popup]").addEventListener("click", () => box.remove());
    box.addEventListener("click", (event) => { if (event.target === box) box.remove(); });
    document.body.appendChild(box);
  }
}, (error) => console.error("Public notifications error:", error));

watchDoc(doc(db, "settings", "website"), (snapshot) => {
  if (snapshot.exists()) applySettings(snapshot.data());
}, (error) => console.error("Public settings error:", error));


onSnapshot(collection(db, "images"), (snapshot) => {
  const container = $("publicMediaGrid");
  if (!container) return;
  const images = snapshot.docs.map((item) => ({ id:item.id, ...item.data() }))
    .filter((item) => (item.status || "Published") === "Published")
    .slice(0, 4);
  container.dataset.images = JSON.stringify(images.map((item) => ({ title:item.title, url:item.url, category:item.category })));
  renderMedia(container);
}, (error) => console.error("Public images error:", error));

let publicVideos = [];
onSnapshot(collection(db, "youtube"), (snapshot) => {
  const container = $("publicMediaGrid");
  if (!container) return;
  publicVideos = snapshot.docs.map((item) => ({ id:item.id, ...item.data() }))
    .filter((item) => (item.status || "Published") === "Published")
    .slice(0, 4);
  renderMedia(container);
}, (error) => console.error("Public videos error:", error));

function renderMedia(container) {
  let images = [];
  try { images = JSON.parse(container.dataset.images || "[]"); } catch (_) {}
  const imageCards = images.map((item) => `
    <div class="card">
      <img src="${escapeHTML(item.url || "")}" alt="${escapeHTML(item.title || "Image")}" style="width:100%;height:180px;object-fit:cover;border-radius:14px;margin-bottom:12px;" loading="lazy">
      <h3>🖼️ ${escapeHTML(item.title || "Website Image")}</h3>
      <small style="color:#667085;">${escapeHTML(item.category || "Gallery")}</small>
    </div>`);
  const videoCards = publicVideos.map((item) => `
    <div class="card">
      <h3>▶️ ${escapeHTML(item.title || "YouTube Video")}</h3>
      <p>${escapeHTML(item.description || "")}</p>
      <a class="btn call" href="${escapeHTML(item.link || "#")}" target="_blank" rel="noopener">Watch Video</a>
    </div>`);
  const cards = [...imageCards, ...videoCards];
  container.innerHTML = cards.length ? cards.join("") : '<div class="card"><h3>No Media Yet</h3><p>Admin Dashboard se image/video publish karte hi yahan dikh jayega.</p></div>';
}

async function trackVisitor() {
  if (sessionStorage.getItem("khobragadeVisitorCounted") === "yes") return;
  sessionStorage.setItem("khobragadeVisitorCounted", "yes");
  const today = new Date().toISOString().slice(0,10);
  try {
    await Promise.all([
      setDoc(doc(db, "analytics", "site"), { totalVisitors: increment(1), updatedAt: serverTimestamp() }, { merge:true }),
      setDoc(doc(db, "visitorDaily", today), { date: today, count: increment(1), updatedAt: serverTimestamp() }, { merge:true })
    ]);
  } catch (error) {
    console.warn("Visitor tracking error:", error.message);
  }
}

const searchInput = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");
searchInput?.addEventListener("input", renderServices);
searchButton?.addEventListener("click", renderServices);
searchInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") renderServices(); });

trackVisitor();
