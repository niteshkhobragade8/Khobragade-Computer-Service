import { db } from "./app-backend.js";
import {
  doc,
  onSnapshot,
  setDoc,
  increment,
  serverTimestamp
} from "./supabase-db.js";


function kcscMaintenanceOverlay(data={}){
  const id="kcscMaintenanceOverlay";
  let box=document.getElementById(id);
  if(!data.enabled){
    box?.remove();
    document.documentElement.style.overflow="";
    return;
  }
  if(!box){
    box=document.createElement("div");
    box.id=id;
    document.body.appendChild(box);
  }
  const title=data.title||"Khobragade Computer Service Centre is being updated";
  const message=data.message||"New improvements are being added. Please check back shortly.";
  const status=data.statusText||"UPDATE IN PROGRESS";
  const reopen=data.reopen?`<div class="kcsc-mm-reopen">Expected Reopen: ${new Date(data.reopen).toLocaleString()}</div>`:"";
  box.innerHTML=`<style>
  #kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 12% 18%,rgba(37,99,235,.18),transparent 28%),radial-gradient(circle at 88% 12%,rgba(236,72,153,.16),transparent 30%),linear-gradient(135deg,#eef4ff 0%,#fff8ef 52%,#f8fafc 100%);display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a}
  #kcscMaintenanceOverlay .kcsc-mm-box{width:min(780px,100%);background:rgba(255,255,255,.97);border:1px solid #e2e8f0;border-radius:28px;padding:44px 34px;text-align:center;box-shadow:0 28px 80px rgba(15,23,42,.16);backdrop-filter:blur(10px)}
  #kcscMaintenanceOverlay .kcsc-mm-icon{width:76px;height:76px;border-radius:22px;margin:0 auto 16px;display:grid;place-items:center;font-size:36px;background:linear-gradient(135deg,#dbeafe,#fce7f3);box-shadow:inset 0 0 0 1px #e2e8f0}
  #kcscMaintenanceOverlay .kcsc-mm-status{display:inline-flex;align-items:center;gap:8px;margin:4px 0 8px;padding:8px 14px;border-radius:999px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;font-size:12px;font-weight:900;letter-spacing:.9px;text-transform:uppercase}
  #kcscMaintenanceOverlay .kcsc-mm-status:before{content:"";width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 5px rgba(245,158,11,.14)}
  #kcscMaintenanceOverlay h1{margin:16px auto 10px;max-width:720px;font-size:clamp(30px,5vw,48px);line-height:1.08}
  #kcscMaintenanceOverlay p{max-width:660px;margin:0 auto;color:#64748b;font-size:18px;line-height:1.7}
  #kcscMaintenanceOverlay .kcsc-mm-reopen{display:inline-flex;align-items:center;gap:8px;margin-top:24px;padding:12px 16px;border-radius:14px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:850}
  @media(max-width:640px){#kcscMaintenanceOverlay{padding:16px}#kcscMaintenanceOverlay .kcsc-mm-box{padding:32px 20px;border-radius:22px}#kcscMaintenanceOverlay p{font-size:16px}}
  </style><main class="kcsc-mm-box"><div class="kcsc-mm-icon">🛠️</div><div class="kcsc-mm-status">${status}</div><h1>${title}</h1><p>${message}</p>${reopen}</main>`;
  document.documentElement.style.overflow="hidden";
}

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
  sessionStorage.setItem("khobragadeVisitorCounted", "yes");
  const today = new Date().toISOString().slice(0, 10);
  try {
    await Promise.all([
      setDoc(doc(db, "analytics", "site"), { totalVisitors: increment(1), updatedAt: serverTimestamp() }, { merge:true }),
      setDoc(doc(db, "visitorDaily", today), { date: today, count: increment(1), updatedAt: serverTimestamp() }, { merge:true })
    ]);
  } catch (error) {
    console.warn("Visitor tracking unavailable:", error.message);
  }
}

trackVisitor();


onSnapshot(doc(db, "settings", "maintenance"), (snapshot) => {
  kcscMaintenanceOverlay(snapshot.exists() ? snapshot.data() : { enabled:false });
}, (error) => {
  console.warn("Maintenance status unavailable:", error.message);
  kcscMaintenanceOverlay({ enabled:false });
});
