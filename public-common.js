import { db } from "./firebase-config.js";
import {
  doc,
  onSnapshot,
  setDoc,
  increment,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function applyCommonSettings(data) {
  const siteName = data.siteName || "Khobragade Computer Service Centre";
  document.querySelectorAll(".logo").forEach((el) => {
    if (!el.querySelector("img")) el.textContent = siteName.replace(" Computer Service Centre", " CSC");
  });
  const phone = data.contactNumber || "9637832490";
  const whatsapp = data.whatsappNumber || phone;

  if (document.body) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.parentElement?.closest("script,style")) return;
      node.nodeValue = node.nodeValue
        .replaceAll("9637832490", phone)
        .replaceAll("Khobragade Computer Service Centre", siteName);
    });
  }
  const phoneDigits = normalizePhone(phone);
  const whatsappDigits = normalizePhone(whatsapp);
  const tel = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const wa = whatsappDigits.length === 10 ? `91${whatsappDigits}` : whatsappDigits;
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => { link.href = `tel:+${tel}`; });
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
    const text = link.dataset.message || "Hello, I need CSC service information.";
    link.href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  });
  if (data.youtubeChannel) document.querySelectorAll('a[href*="youtube.com"]').forEach((link) => { link.href = data.youtubeChannel; });
}

onSnapshot(doc(db, "settings", "website"), (snapshot) => {
  if (snapshot.exists()) applyCommonSettings(snapshot.data());
}, (error) => console.warn("Public settings unavailable:", error.message));

async function trackVisitor() {
  if (sessionStorage.getItem("khobragadeVisitorCounted") === "yes") return;
  const today = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "analytics", "site"), { totalVisitors: increment(1), updatedAt: serverTimestamp() }, { merge:true });
    batch.set(doc(db, "visitorDaily", today), { date: today, count: increment(1), updatedAt: serverTimestamp() }, { merge:true });
    await batch.commit();
    sessionStorage.setItem("khobragadeVisitorCounted", "yes");
  } catch (error) {
    console.warn("Visitor tracking unavailable; will retry on next page load:", error.message);
  }
}

trackVisitor();
