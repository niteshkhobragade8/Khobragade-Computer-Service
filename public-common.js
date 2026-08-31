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
#kcscMaintenanceOverlay{position:fixed;inset:0;z-index:2147483647;background:#fff;overflow:auto;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#111827}
#kcscMaintenanceOverlay *{box-sizing:border-box}
#kcscMaintenanceOverlay .mm-page{min-height:100vh;background:#fff;display:flex;align-items:center;justify-content:center;padding:22px;position:relative;overflow:hidden}
#kcscMaintenanceOverlay .mm-page:before{content:"";position:absolute;width:330px;height:330px;left:-150px;bottom:-170px;border-radius:999px;background:linear-gradient(135deg,#facc15 0 25%,#ec4899 25% 55%,#2563eb 55% 100%)}
#kcscMaintenanceOverlay .mm-page:after{content:"";position:absolute;width:270px;height:270px;right:-145px;top:-130px;border-radius:999px;background:linear-gradient(135deg,#22c55e,#2563eb 45%,#ec4899)}
#kcscMaintenanceOverlay .mm-shell{width:1120px;max-width:1120px;min-height:680px;background:#fff;border:1px solid #edf0f5;border-radius:28px;box-shadow:0 28px 80px rgba(15,23,42,.12);padding:28px 34px 22px;position:relative;z-index:2}
#kcscMaintenanceOverlay .mm-top{display:grid;grid-template-columns:250px 1fr 250px;gap:26px;align-items:center;margin-top:8px}
#kcscMaintenanceOverlay .mm-brand{text-align:left}
#kcscMaintenanceOverlay .mm-brand-logo{font-size:42px;line-height:1;margin-bottom:10px}
#kcscMaintenanceOverlay .mm-brand h2{margin:0;font-size:25px;line-height:1.15}
#kcscMaintenanceOverlay .g{color:#22c55e}#kcscMaintenanceOverlay .y{color:#f59e0b}#kcscMaintenanceOverlay .p{color:#ec4899}#kcscMaintenanceOverlay .b{color:#2563eb}
#kcscMaintenanceOverlay .mm-sub{font-size:23px;font-weight:900;margin-top:4px}
#kcscMaintenanceOverlay .mm-brand p{font-size:14px;line-height:1.6;color:#4b5563;margin:22px 0 0}
#kcscMaintenanceOverlay .mm-line{width:82px;height:4px;border-radius:99px;background:linear-gradient(90deg,#22c55e,#facc15,#ec4899,#2563eb);margin:14px 0 0}
#kcscMaintenanceOverlay .mm-monitor-wrap{text-align:center}
#kcscMaintenanceOverlay .mm-monitor{width:520px;height:300px;margin:auto;border:14px solid #16181d;border-bottom-width:20px;border-radius:16px;background:radial-gradient(circle at 22% 22%,rgba(0,210,255,.55),transparent 20%),radial-gradient(circle at 78% 74%,rgba(255,0,110,.45),transparent 28%),linear-gradient(135deg,#03172b,#063c76 30%,#11153b 58%,#4b093d 78%,#ff5a00);position:relative;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 38px rgba(0,0,0,.24)}
#kcscMaintenanceOverlay .mm-monitor:before{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:-78px;width:68px;height:58px;background:linear-gradient(#b9bcc3,#7e828b);clip-path:polygon(28% 0,72% 0,84% 100%,16% 100%)}
#kcscMaintenanceOverlay .mm-monitor:after{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:-88px;width:180px;height:14px;border-radius:60%;background:linear-gradient(#a7aab2,#6b7280);box-shadow:0 6px 12px rgba(0,0,0,.22)}
#kcscMaintenanceOverlay .mm-screen{width:88%;position:relative;z-index:2}
#kcscMaintenanceOverlay .mm-under{font-size:48px;line-height:1;font-weight:1000;color:#fff;letter-spacing:.5px}
#kcscMaintenanceOverlay .mm-maint{font-size:45px;line-height:1.02;font-weight:1000;color:#ffd329;margin-top:8px}
#kcscMaintenanceOverlay .mm-status{margin:22px auto 0;display:inline-flex;align-items:center;justify-content:center;border:3px solid #22c55e;border-radius:999px;color:#fff;background:#14391f;padding:10px 24px;font-size:20px;font-weight:950}
#kcscMaintenanceOverlay .mm-side{display:grid;gap:11px}
#kcscMaintenanceOverlay .mm-card{display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center;padding:12px 14px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.06);text-align:left}
#kcscMaintenanceOverlay .mm-ico{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:20px;font-weight:900}
#kcscMaintenanceOverlay .mm-card:nth-child(1) .mm-ico{background:#22c55e}#kcscMaintenanceOverlay .mm-card:nth-child(2) .mm-ico{background:#f59e0b}#kcscMaintenanceOverlay .mm-card:nth-child(3) .mm-ico{background:#ec4899}#kcscMaintenanceOverlay .mm-card:nth-child(4) .mm-ico{background:#2563eb}
#kcscMaintenanceOverlay .mm-card b{display:block;font-size:14px}#kcscMaintenanceOverlay .mm-card span{font-size:12px;color:#6b7280}
#kcscMaintenanceOverlay .mm-reopen{width:620px;max-width:100%;margin:82px auto 16px;border:2px solid transparent;border-radius:14px;padding:12px 18px;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#22c55e,#facc15,#ec4899,#2563eb) border-box;text-align:center;font-weight:900}
#kcscMaintenanceOverlay .mm-reopen strong{color:#ec4899}
#kcscMaintenanceOverlay .mm-count{width:760px;max-width:100%;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 12px 28px rgba(15,23,42,.08);overflow:hidden}
#kcscMaintenanceOverlay .mm-unit{padding:14px 8px;text-align:center}#kcscMaintenanceOverlay .mm-unit+.mm-unit{border-left:1px solid #e5e7eb}
#kcscMaintenanceOverlay .mm-unit b{display:block;font-size:35px;line-height:1;font-weight:1000}#kcscMaintenanceOverlay .mm-unit span{font-size:12px;font-weight:800;color:#4b5563}
#kcscMaintenanceOverlay .mm-unit:nth-child(1) b{color:#22c55e}#kcscMaintenanceOverlay .mm-unit:nth-child(2) b{color:#f59e0b}#kcscMaintenanceOverlay .mm-unit:nth-child(3) b{color:#ec4899}#kcscMaintenanceOverlay .mm-unit:nth-child(4) b{color:#2563eb}
#kcscMaintenanceOverlay .mm-bottom{width:760px;max-width:100%;margin:16px auto 0;border:1px solid #e5e7eb;border-radius:14px;padding:12px 16px;text-align:center;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.05);font-size:14px}
#kcscMaintenanceOverlay .mm-bottom strong{display:block;color:#22c55e;font-size:18px;margin-top:3px}
#kcscMaintenanceOverlay .mm-footer{text-align:center;color:#9ca3af;font-size:11px;margin-top:10px}
@media(max-width:900px){
#kcscMaintenanceOverlay .mm-page{padding:10px;align-items:flex-start}
#kcscMaintenanceOverlay .mm-shell{width:100%;max-width:100%;min-height:0;border-radius:20px;padding:20px 14px 18px;margin:8px 0}
#kcscMaintenanceOverlay .mm-top{grid-template-columns:1fr;gap:18px;margin-top:0}
#kcscMaintenanceOverlay .mm-brand{text-align:center;order:2}#kcscMaintenanceOverlay .mm-line{margin:12px auto}#kcscMaintenanceOverlay .mm-brand p{margin-top:12px}
#kcscMaintenanceOverlay .mm-monitor-wrap{order:1}
#kcscMaintenanceOverlay .mm-monitor{width:min(92vw,430px);height:248px;border-width:11px;border-bottom-width:16px}
#kcscMaintenanceOverlay .mm-monitor:before{bottom:-62px;height:46px;width:58px}#kcscMaintenanceOverlay .mm-monitor:after{bottom:-70px;width:145px;height:11px}
#kcscMaintenanceOverlay .mm-under{font-size:clamp(30px,9vw,42px)}#kcscMaintenanceOverlay .mm-maint{font-size:clamp(28px,8vw,39px)}
#kcscMaintenanceOverlay .mm-status{font-size:15px;padding:8px 17px;margin-top:16px}
#kcscMaintenanceOverlay .mm-side{grid-template-columns:1fr 1fr;order:3}
#kcscMaintenanceOverlay .mm-reopen{margin-top:72px}
}
@media(max-width:520px){
#kcscMaintenanceOverlay .mm-page{padding:6px}#kcscMaintenanceOverlay .mm-shell{border-radius:16px;padding:14px 10px}
#kcscMaintenanceOverlay .mm-monitor{width:94vw;max-width:360px;height:208px;border-width:9px;border-bottom-width:14px}
#kcscMaintenanceOverlay .mm-monitor:before{bottom:-54px;height:40px;width:48px}#kcscMaintenanceOverlay .mm-monitor:after{bottom:-61px;width:122px;height:10px}
#kcscMaintenanceOverlay .mm-under{font-size:31px}#kcscMaintenanceOverlay .mm-maint{font-size:29px}#kcscMaintenanceOverlay .mm-status{font-size:13px;padding:7px 13px}
#kcscMaintenanceOverlay .mm-brand h2{font-size:22px}#kcscMaintenanceOverlay .mm-sub{font-size:20px}
#kcscMaintenanceOverlay .mm-side{grid-template-columns:1fr 1fr;gap:8px}#kcscMaintenanceOverlay .mm-card{grid-template-columns:36px 1fr;padding:9px}#kcscMaintenanceOverlay .mm-ico{width:34px;height:34px}
#kcscMaintenanceOverlay .mm-reopen{margin-top:62px;font-size:13px;padding:10px}
#kcscMaintenanceOverlay .mm-unit{padding:10px 3px}#kcscMaintenanceOverlay .mm-unit b{font-size:25px}#kcscMaintenanceOverlay .mm-unit span{font-size:9px}
#kcscMaintenanceOverlay .mm-bottom{font-size:12px}#kcscMaintenanceOverlay .mm-bottom strong{font-size:15px}
}</style>
<div class="mm-page"><main class="mm-shell">
<section class="mm-top">
<div class="mm-brand"><div class="mm-brand-logo">🖥️⚙️</div><h2><span class="g">Khobragade</span><br><span class="y">Computer</span> <span class="p">Service</span><br><span class="b">Centre</span></h2><div class="mm-sub">is being updated</div><div class="mm-line"></div><p>${message}</p></div>
<div class="mm-monitor-wrap"><div class="mm-monitor"><div class="mm-screen"><div class="mm-under">UNDER</div><div class="mm-maint">MAINTENANCE</div><div class="mm-status">${status}</div></div></div></div>
<div class="mm-side"><div class="mm-card"><div class="mm-ico">🛡</div><div><b>Secure & Safe</b><span>Your security is our priority</span></div></div><div class="mm-card"><div class="mm-ico">⚡</div><div><b>Fast Service</b><span>Better performance</span></div></div><div class="mm-card"><div class="mm-ico">★</div><div><b>New Features</b><span>More powerful than before</span></div></div><div class="mm-card"><div class="mm-ico">🎧</div><div><b>Support</b><span>We are here to help</span></div></div></div>
</section>
<div class="mm-reopen">📅 Expected Reopen: <strong>${data.reopen ? new Date(data.reopen).toLocaleString() : "Time will be announced"}</strong></div>
<div class="mm-count" id="kcscLiveCountdown" style="${data.reopen?'':'display:none'}"><div class="mm-unit"><b id="mmD">00</b><span>DAYS</span></div><div class="mm-unit"><b id="mmH">00</b><span>HOURS</span></div><div class="mm-unit"><b id="mmM">00</b><span>MINUTES</span></div><div class="mm-unit"><b id="mmS">00</b><span>SECONDS</span></div></div>
<div class="mm-bottom">💡 We are working hard to bring you a better, faster and more secure experience.<strong>Thank you for your patience!</strong></div>
<div class="mm-footer">© 2026 Khobragade Computer Service Centre. All rights reserved.</div>
</main></div>`;
  if(data.reopen){
    const end=new Date(data.reopen).getTime();
    const tick=()=>{let n=Math.max(0,end-Date.now()),q=Math.floor(n/1000);
      const d=document.getElementById("mmD"),h=document.getElementById("mmH"),m=document.getElementById("mmM"),sec=document.getElementById("mmS");
      if(!d)return;
      d.textContent=String(Math.floor(q/86400)).padStart(2,"0");q%=86400;
      h.textContent=String(Math.floor(q/3600)).padStart(2,"0");q%=3600;
      m.textContent=String(Math.floor(q/60)).padStart(2,"0");
      sec.textContent=String(q%60).padStart(2,"0");
    };
    tick();clearInterval(window.__kcscMaintenanceTimer);window.__kcscMaintenanceTimer=setInterval(tick,1000);
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
