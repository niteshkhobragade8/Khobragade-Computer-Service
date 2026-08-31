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
#kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 12% 18%,#22c55e55 0 10%,transparent 24%),radial-gradient(circle at 88% 16%,#3b82f655 0 11%,transparent 25%),radial-gradient(circle at 18% 82%,#facc1555 0 12%,transparent 27%),radial-gradient(circle at 82% 78%,#ec489955 0 12%,transparent 27%),linear-gradient(135deg,#171717 0%,#2a1645 28%,#123a5b 52%,#4b1d3f 75%,#1f2937 100%);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#fff}
#kcscMaintenanceOverlay .kcsc-mm-box{position:relative;overflow:hidden;width:min(850px,96%);background:linear-gradient(145deg,rgba(17,24,39,.95),rgba(48,20,64,.94) 42%,rgba(15,55,77,.94) 72%,rgba(44,24,24,.94));border:1px solid #ffffff30;border-radius:28px;padding:34px;text-align:center;box-shadow:0 28px 80px #0008}
#kcscMaintenanceOverlay .kcsc-mm-box:before{content:"";position:absolute;inset:0 0 auto;height:5px;background:linear-gradient(90deg,#22c55e,#facc15,#ec4899,#ef4444,#3b82f6,#fff)}
#kcscMaintenanceOverlay .kcsc-mm-icon{width:185px;height:108px;margin:0 auto 22px;border:7px solid transparent;border-radius:13px;background:linear-gradient(#0b1020,#101827) padding-box,linear-gradient(90deg,#22c55e,#facc15,#ec4899,#ef4444,#3b82f6,#fff) border-box;display:grid;place-items:center;position:relative;font-size:0}
#kcscMaintenanceOverlay .kcsc-mm-icon:before{content:"UNDER\A MAINTENANCE";white-space:pre;color:#fff;font-size:15px;line-height:1.25;font-weight:950}
#kcscMaintenanceOverlay .kcsc-mm-icon:after{content:"";position:absolute;width:86px;height:7px;background:linear-gradient(90deg,#22c55e,#facc15,#ec4899,#ef4444,#3b82f6);bottom:-24px;border-radius:9px;box-shadow:0 -9px 0 -1px #3b82f6}
#kcscMaintenanceOverlay .kcsc-mm-status{display:inline-flex;align-items:center;gap:8px;background:#123c25;color:#86efac;border:1px solid #22c55e;border-radius:999px;padding:7px 16px;font-size:12px;font-weight:950}
#kcscMaintenanceOverlay h1{margin:16px auto 5px;font-size:clamp(28px,5vw,43px);line-height:1.1;background:linear-gradient(90deg,#22c55e,#facc15,#ec4899,#ef4444,#3b82f6);-webkit-background-clip:text;color:transparent}
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
