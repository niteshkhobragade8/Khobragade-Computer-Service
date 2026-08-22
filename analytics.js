import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  writeBatch,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

async function resetVisitorAnalytics({silent=false}={}) {
  const msg=$("visitorResetMessage"),btn=$("resetVisitorsBtn");
  if(btn)btn.disabled=true;
  try {
    const daily=await getDocs(collection(db,"visitorDaily"));
    const docs=daily.docs;
    for(let i=0;i<docs.length;i+=450){const batch=writeBatch(db);docs.slice(i,i+450).forEach(d=>batch.delete(d.ref));await batch.commit();}
    await setDoc(doc(db,"analytics","site"),{totalVisitors:0,updatedAt:serverTimestamp()},{merge:true});
    await setDoc(doc(db,"settings","maintenance"),{visitorResetVersion:"v25-final",visitorResetAt:serverTimestamp()},{merge:true});
    if(msg){msg.textContent="✅ Total Visitors reset to 0. Old daily visitor history cleared.";msg.className="settings-message success";}
    await loadAnalytics();
  } catch(error){console.error("Visitor reset failed",error);if(msg&&!silent){msg.textContent="Visitor reset failed: "+error.message;msg.className="settings-message error";}throw error;}
  finally{if(btn)btn.disabled=false;}
}

async function runRequestedVisitorResetOnce(){
  try{const marker=await getDoc(doc(db,"settings","maintenance"));if(marker.exists()&&marker.data().visitorResetVersion==="v25-final")return;await resetVisitorAnalytics({silent:true});}catch(e){console.warn("One-time visitor reset pending until admin access is ready.",e);}
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function drawVisitorChart(rows) {
  const canvas = $("visitorChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(canvas.clientWidth, 320);
  const cssHeight = 260;
  canvas.width = cssWidth * ratio;
  canvas.height = cssHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padding = { left: 44, right: 18, top: 22, bottom: 46 };
  const chartW = cssWidth - padding.left - padding.right;
  const chartH = cssHeight - padding.top - padding.bottom;
  const values = rows.map((row) => Number(row.count || 0));
  const max = Math.max(...values, 1);

  ctx.strokeStyle = "rgba(17,24,39,.15)";
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Segoe UI, Arial";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.stroke();
    const label = Math.round(max - (max / 4) * i);
    ctx.fillText(String(label), 8, y + 4);
  }

  if (!rows.length) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "15px Segoe UI, Arial";
    ctx.fillText("Visitor data will appear after public website visits.", padding.left, padding.top + 60);
    return;
  }

  const pointGap = rows.length > 1 ? chartW / (rows.length - 1) : chartW;
  ctx.strokeStyle = "#2979FF";
  ctx.lineWidth = 3;
  ctx.beginPath();
  rows.forEach((row, index) => {
    const x = padding.left + (rows.length > 1 ? pointGap * index : chartW / 2);
    const y = padding.top + chartH - (Number(row.count || 0) / max) * chartH;
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  rows.forEach((row, index) => {
    const x = padding.left + (rows.length > 1 ? pointGap * index : chartW / 2);
    const y = padding.top + chartH - (Number(row.count || 0) / max) * chartH;
    ctx.beginPath();
    ctx.fillStyle = "#00C853";
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#374151";
    const label = String(row.date || "").slice(5);
    ctx.save();
    ctx.translate(x - 3, cssHeight - 17);
    ctx.rotate(-0.45);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

async function loadAnalytics() {
  try {
    const [updates, services, categories, notifications, siteSnap, dailySnap, serviceAnalyticsSnap] = await Promise.all([
      getDocs(collection(db, "updates")),
      getDocs(collection(db, "services")),
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "notifications")),
      getDoc(doc(db, "analytics", "site")),
      getDocs(query(collection(db, "visitorDaily"), orderBy("date", "desc"), limit(14))),
      getDocs(collection(db, "serviceAnalytics"))
    ]);

    const site = siteSnap.exists() ? siteSnap.data() : {};
    setText("analyticsVisitors", Number(site.totalVisitors || 0));
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayRow = dailySnap.docs.map((item) => item.data()).find((row) => row.date === todayKey);
    setText("todayVisitors", Number(todayRow?.count || 0));
    setText("analyticsUpdates", updates.size);
    setText("analyticsServices", services.size);
    setText("analyticsCategories", categories.size);
    setText("analyticsNotifications", notifications.size);

    const serviceRows = serviceAnalyticsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
    const totalWhatsapp = serviceRows.reduce((sum, item) => sum + Number(item.whatsappClicks || 0), 0);
    setText("analyticsWhatsappClicks", totalWhatsapp);
    setText("analyticsTrackedServices", serviceRows.length);
    const serviceBox = $("serviceAnalyticsData");
    if (serviceBox) {
      const top = [...serviceRows].sort((a, b) => (Number(b.whatsappClicks || 0) + Number(b.views || 0)) - (Number(a.whatsappClicks || 0) + Number(a.views || 0))).slice(0, 10);
      serviceBox.innerHTML = top.length ? `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px">Service</th><th style="padding:10px">Views</th><th style="padding:10px">WhatsApp</th></tr></thead><tbody>${top.map((item) => `<tr><td style="padding:10px;border-top:1px solid #e5e7eb"><b>${String(item.name || item.id).replaceAll('&','&amp;').replaceAll('<','&lt;')}</b></td><td style="text-align:center;padding:10px;border-top:1px solid #e5e7eb">${Number(item.views || 0)}</td><td style="text-align:center;padding:10px;border-top:1px solid #e5e7eb">${Number(item.whatsappClicks || 0)}</td></tr>`).join("")}</tbody></table></div>` : "No service / WhatsApp analytics yet.";
    }

    const rows = dailySnap.docs.map((item) => item.data()).reverse();
    drawVisitorChart(rows);

    const analyticsData = $("analyticsData");
    if (analyticsData) {
      const lastUpdated = site.updatedAt?.toDate?.().toLocaleString() || "Waiting for visitor data";
      analyticsData.innerHTML = `
        <div class="analytics-summary-grid">
          <div><span>Tracked Days</span><strong>${rows.length}</strong></div>
          <div><span>Total Collections</span><strong>7+</strong></div>
          <div><span>Last Visitor Update</span><strong>${lastUpdated}</strong></div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Analytics load error:", error);
    const analyticsData = $("analyticsData");
    if (analyticsData) analyticsData.textContent = `Analytics Error: ${error.message}`;
  }
}

window.refreshAnalytics = loadAnalytics;
window.showAnalytics = loadAnalytics;
window.reloadAnalytics = loadAnalytics;
window.getAnalytics = loadAnalytics;
window.resetAnalytics = () => loadAnalytics();
window.resetVisitorAnalytics = resetVisitorAnalytics;
$("resetVisitorsBtn")?.addEventListener("click",async()=>{if(!confirm("Reset Total Visitors to 0 and clear old daily visitor history?"))return;await resetVisitorAnalytics().catch(()=>{});});
onAuthStateChanged(auth,user=>{if(user)runRequestedVisitorResetOnce();});

window.addEventListener("DOMContentLoaded", loadAnalytics);
window.addEventListener("resize", () => loadAnalytics());

export { loadAnalytics };
