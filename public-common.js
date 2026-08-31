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
#kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#f43f5e 0%,#b832d9 48%,#4f46e5 100%);display:grid;place-items:center;padding:22px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#111827}
#kcscMaintenanceOverlay .kcsc-mm-box{width:min(850px,96%);background:#fff;border:1px solid #ffffffaa;border-radius:27px;padding:34px;text-align:center;box-shadow:0 28px 80px rgba(59,22,73,.34)}
#kcscMaintenanceOverlay .kcsc-mm-icon{font-size:54px;line-height:1;margin-bottom:9px}
#kcscMaintenanceOverlay .kcsc-mm-status{display:inline-flex;align-items:center;gap:8px;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:999px;padding:7px 15px;font-size:12px;font-weight:950;letter-spacing:.8px}
#kcscMaintenanceOverlay .kcsc-mm-status:before{content:"";width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,.13)}
#kcscMaintenanceOverlay h1{margin:16px auto 4px;max-width:760px;font-size:clamp(29px,5vw,44px);line-height:1.08}
#kcscMaintenanceOverlay h1:after{content:"is being updated";display:block;color:#ec4899;font-size:.48em;margin-top:6px}
#kcscMaintenanceOverlay p{max-width:680px;margin:15px auto 0;color:#475569;font-size:16px;line-height:1.65}
#kcscMaintenanceOverlay .kcsc-mm-reopen{display:inline-flex;margin-top:19px;padding:12px 17px;border-radius:13px;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;font-weight:900}
#kcscMaintenanceOverlay .kcsc-live-count{margin:18px auto 0;color:#166534;font-weight:900;font-size:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:13px;padding:11px 14px;max-width:520px}
@media(max-width:640px){#kcscMaintenanceOverlay{padding:13px}#kcscMaintenanceOverlay .kcsc-mm-box{padding:27px 17px;border-radius:21px}#kcscMaintenanceOverlay p{font-size:15px}}
</style><main class="kcsc-mm-box"><div class="kcsc-mm-icon">🚧⚙️</div><div class="kcsc-mm-status">${status}</div><h1>${title}</h1><p>${message}</p>${reopen}<div class="kcsc-live-count" id="kcscLiveCountdown" style="${data.reopen?'':'display:none'}">⏱ Calculating time remaining...</div><p style="font-size:13px;margin-top:17px">🛡️ Better Security &nbsp; • &nbsp; ⚡ Faster Performance &nbsp; • &nbsp; ⭐ New Features &nbsp; • &nbsp; 🎧 24×7 Support</p></main>`;
  if(data.reopen){
    const end=new Date(data.reopen).getTime();
    const updateCount=()=>{const el=document.getElementById("kcscLiveCountdown");if(!el)return;let n=Math.max(0,end-Date.now()),x=Math.floor(n/1000),d=Math.floor(x/86400);x%=86400;let h=Math.floor(x/3600);x%=3600;let m=Math.floor(x/60),sec=x%60;el.textContent=`⏱ ${String(d).padStart(2,"0")} Days  •  ${String(h).padStart(2,"0")} Hours  •  ${String(m).padStart(2,"0")} Min  •  ${String(sec).padStart(2,"0")} Sec`;};
    updateCount();clearInterval(window.__kcscMaintenanceTimer);window.__kcscMaintenanceTimer=setInterval(updateCount,1000);
  }
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
