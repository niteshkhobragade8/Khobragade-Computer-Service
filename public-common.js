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
#kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(ellipse at 7% 5%,#eef7df 0 12%,transparent 12.5%),radial-gradient(ellipse at 92% 5%,#d8edb4 0 18%,transparent 18.5%),linear-gradient(180deg,#fff 0%,#fbfff5 68%,#eef8e2 100%);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#12351d}
#kcscMaintenanceOverlay .kcsc-mm-box{width:min(850px,96%);background:rgba(255,255,255,.72);border:1px solid #e3eed7;border-radius:28px;padding:42px 30px;text-align:center;box-shadow:0 22px 60px rgba(46,95,42,.12)}
#kcscMaintenanceOverlay .kcsc-mm-icon{width:82px;height:82px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;font-size:36px;background:#f2f9e9;border:4px solid #dfefce}
#kcscMaintenanceOverlay .kcsc-mm-status{display:inline-flex;align-items:center;padding:6px 17px;border-radius:999px;background:#e8f5da;color:#23752c;font-weight:900;font-size:12px;letter-spacing:.8px}
#kcscMaintenanceOverlay h1{margin:16px auto 5px;max-width:760px;font-size:clamp(31px,5vw,49px);line-height:1.08;color:#124522}
#kcscMaintenanceOverlay h1:after{content:"is being updated";display:block;color:#198b2b;font-size:.52em;margin-top:5px}
#kcscMaintenanceOverlay p{max-width:680px;margin:20px auto 0;color:#334b39;font-size:17px;line-height:1.65}
#kcscMaintenanceOverlay .kcsc-mm-reopen{display:inline-flex;margin-top:22px;padding:13px 18px;border-radius:13px;background:#edf7e0;color:#1e6429;border:1px solid #dcecca;font-weight:850}
@media(max-width:640px){#kcscMaintenanceOverlay{padding:14px}#kcscMaintenanceOverlay .kcsc-mm-box{padding:30px 18px;border-radius:22px}#kcscMaintenanceOverlay p{font-size:15px}}
</style><main class="kcsc-mm-box"><div class="kcsc-mm-icon">🖥️⚙</div><div class="kcsc-mm-status">${status}</div><h1>${title}</h1><p>${message}</p>${reopen}<p style="font-size:14px;margin-top:18px">🛡️ Secure & Safe &nbsp; • &nbsp; ⚡ Fast & Reliable &nbsp; • &nbsp; ⚙️ New Features &nbsp; • &nbsp; 👥 Dedicated Support</p></main>`;
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
