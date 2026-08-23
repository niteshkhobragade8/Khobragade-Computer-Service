import { db } from "./firebase-config.js";
import { collection, onSnapshot } from './supabase-firestore.js';

const container = document.getElementById("liveDocuments");
function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

onSnapshot(collection(db, "documents"), (snapshot) => {
  if (!container) return;
  const docs = snapshot.docs.map((item) => ({ id:item.id, ...item.data() })).filter((item) => (item.status || "Published") === "Published");
  if (!docs.length) {
    container.innerHTML = '<div class="card"><h3>No Public Documents Yet</h3><p>Admin Dashboard se document add karte hi yahan dikh jayega.</p></div>';
    return;
  }
  container.innerHTML = docs.map((item) => `
    <div class="card">
      <h3>📄 ${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.category || "Document")}</p>
      <a class="btn" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">Open / Download</a>
    </div>`).join("");
}, (error) => console.error("Public documents error:", error));
