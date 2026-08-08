import { db } from "./firebase-config.js";
import { collection, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const container = document.getElementById("liveServices");
const search = document.getElementById("liveServiceSearch");
let services = [];
let whatsappNumber = "9637832490";

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function render() {
  if (!container) return;
  const q = (search?.value || "").trim().toLowerCase();
  const rows = services.filter((item) => !q || `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(q));
  container.innerHTML = rows.length ? rows.map((item) => `
    <div class="card">
      <h3>${escapeHTML(item.icon || "📄")} ${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.description || "")}</p>
      <p style="font-size:12px;color:#667085;margin-top:8px;">${escapeHTML(item.category || "CSC Service")}</p>
      <a class="btn" href="https://wa.me/${whatsappNumber.length === 10 ? "91" + whatsappNumber : whatsappNumber}?text=${encodeURIComponent("I want " + (item.name || "CSC") + " service")}">Apply Now</a>
    </div>`).join("") : '<div class="card"><h3>No Service Found</h3></div>';
}

onSnapshot(collection(db, "services"), (snapshot) => {
  services = snapshot.docs.map((item) => ({ id:item.id, ...item.data() })).filter((item) => (item.status || "Published") === "Published");
  services.sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(a.name || "").localeCompare(String(b.name || "")));
  render();
}, (error) => {
  console.error(error);
  if (container) container.innerHTML = `<div class="card"><h3>Services unavailable</h3><p>${escapeHTML(error.message)}</p></div>`;
});
search?.addEventListener("input", render);


onSnapshot(doc(db, "settings", "website"), (snapshot) => {
  if (snapshot.exists()) {
    whatsappNumber = String(snapshot.data().whatsappNumber || snapshot.data().contactNumber || "9637832490").replace(/\D/g, "");
    render();
  }
});
