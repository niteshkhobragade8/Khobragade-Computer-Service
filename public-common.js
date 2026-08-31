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
#kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 10% 15%,rgba(34,197,94,.18),transparent 24%),radial-gradient(circle at 88% 16%,rgba(59,130,246,.22),transparent 25%),radial-gradient(circle at 82% 82%,rgba(236,72,153,.18),transparent 25%),radial-gradient(circle at 18% 82%,rgba(250,204,21,.13),transparent 25%),linear-gradient(135deg,#07111f 0%,#101c31 42%,#20162d 72%,#0b1523 100%);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#fff}
#kcscMaintenanceOverlay .kcsc-mm-box{position:relative;overflow:hidden;width:min(850px,96%);background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(19,31,52,.95) 52%,rgba(29,20,43,.95));border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:34px;text-align:center;box-shadow:0 28px 80px #0008}
#kcscMaintenanceOverlay .kcsc-mm-box:before{content:"";position:absolute;inset:0 0 auto;height:5px;background:linear-gradient(90deg,#22c55e,#facc15,#ec4899,#ef4444,#3b82f6,#fff)}
#kcscMaintenanceOverlay .kcsc-mm-icon{
width:198px;height:116px;margin:0 auto 34px;position:relative;
border:8px solid #111827;border-radius:12px;
background:linear-gradient(120deg,rgba(255,255,255,.10) 0 18%,transparent 18% 58%,rgba(255,255,255,.04) 58% 66%,transparent 66%),linear-gradient(160deg,#0b1220,#111c30 52%,#07101d);
display:flex;align-items:center;justify-content:center;font-size:0;
box-shadow:0 0 0 1px #475569,0 0 0 3px rgba(59,130,246,.18),inset 0 0 34px rgba(59,130,246,.10),0 16px 35px rgba(0,0,0,.55)}
#kcscMaintenanceOverlay .kcsc-mm-icon:before{
content:"UNDER\A MAINTENANCE\A\A UPDATE IN PROGRESS";white-space:pre;text-align:center;color:#fff;
font-size:15px;line-height:1.08;font-weight:950;letter-spacing:.45px;text-shadow:0 2px 5px #000}
#kcscMaintenanceOverlay .kcsc-mm-icon:after{
content:"";position:absolute;left:50%;transform:translateX(-50%);width:94px;height:8px;bottom:-34px;
background:linear-gradient(180deg,#475569,#1f2937);border-radius:50% 50% 6px 6px;
box-shadow:0 -11px 0 -3px #475569,0 5px 10px rgba(0,0,0,.45)}
#kcscMaintenanceOverlay .kcsc-mm-status{display:inline-flex;align-items:center;gap:8px;background:#123c25;color:#86efac;border:1px solid #22c55e;border-radius:999px;padding:7px 16px;font-size:12px;font-weight:950}
#kcscMaintenanceOverlay h1{margin:16px auto 5px;font-size:clamp(28px,5vw,43px);line-height:1.1;color:#f8fafc;text-shadow:0 2px 16px rgba(0,0,0,.30)}
#kcscMaintenanceOverlay p{max-width:680px;margin:13px auto;color:#d1d5db;font-size:16px;line-height:1.6}
#kcscMaintenanceOverlay .kcsc-mm-reopen{display:inline-flex;margin-top:12px;padding:11px 16px;border-radius:12px;background:linear-gradient(90deg,#172554cc,#3b0764cc,#4c0519cc,#14532dcc);color:#facc15;border:1px solid #ffffff30;font-weight:900}
#kcscMaintenanceOverlay .kcsc-live-count{margin:17px auto 0;background:#fff;color:#111827;border-radius:13px;padding:12px 14px;font-weight:950;max-width:570px;border-bottom:5px solid #22c55e}
@media(max-width:640px){#kcscMaintenanceOverlay{padding:12px}#kcscMaintenanceOverlay .kcsc-mm-box{padding:28px 16px}#kcscMaintenanceOverlay .kcsc-mm-icon{width:165px;height:96px}}
</style><main class="kcsc-mm-box"><div class="kcsc-mm-icon">🖥️</div><div class="kcsc-mm-status">${status}</div><h1>${title}</h1><p>${message}</p>${reopen}<div class="kcsc-live-count" id="kcscLiveCountdown" style="${data.reopen?'':'display:none'}">⏱ Loading countdown...</div><p style="font-size:13px">🟢 Secure & Safe &nbsp; • &nbsp; 🟡 Fast Service &nbsp; • &nbsp; 🩷 New Features &nbsp; • &nbsp; 🔵 Support</p></main>`;
  if(data.reopen){const end=new Date(data.reopen).getTime();const tick=()=>{const el=document.getElementById("kcscLiveCountdown");if(!el)return;let n=Math.max(0,end-Date.now()),q=Math.floor(n/1000),d=Math.floor(q/86400);q%=86400;let h=Math.floor(q/3600);q%=3600;let m=Math.floor(q/60),sec=q%60;el.textContent=`🟢 ${String(d).padStart(2,"0")} Days  •  🟡 ${String(h).padStart(2,"0")} Hours  •  🩷 ${String(m).padStart(2,"0")} Min  •  🔵 ${String(sec).padStart(2,"0")} Sec`;};tick();clearInterval(window.__kcscMaintenanceTimer);window.__kcscMaintenanceTimer=setInterval(tick,1000);}
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
