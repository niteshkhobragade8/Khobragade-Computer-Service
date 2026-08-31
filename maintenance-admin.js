import { db } from "./app-backend.js";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "./supabase-db.js";

const $ = (id) => document.getElementById(id);
const ref = doc(db, "settings", "maintenance");

const defaults = {
  title: "Khobragade Computer Service Centre is being updated",
  reopen: "",
  message: "New improvements are being added. Please check back shortly.",
  statusText: "UPDATE IN PROGRESS",
  enabled: false
};

function setMessage(text, type = "info") {
  const box = $("maintenanceMessageBox");
  if (!box) return;
  box.className = `settings-message ${type}`;
  box.textContent = text;
}

function values() {
  return {
    title: $("maintenanceTitle")?.value.trim() || defaults.title,
    reopen: $("maintenanceReopen")?.value || "",
    message: $("maintenanceMessage")?.value.trim() || defaults.message,
    statusText: $("maintenanceStatusText")?.value.trim() || defaults.statusText,
    enabled: $("maintenanceStatus")?.value === "on"
  };
}

function paint(data = defaults) {
  if (!$("maintenanceModeCard")) return;
  $("maintenanceTitle").value = data.title || defaults.title;
  $("maintenanceReopen").value = data.reopen || "";
  $("maintenanceMessage").value = data.message || defaults.message;
  $("maintenanceStatusText").value = data.statusText || defaults.statusText;
  $("maintenanceStatus").value = data.enabled ? "on" : "off";
  const badge = $("maintenanceBadge");
  badge.textContent = data.enabled ? "ON" : "OFF";
  badge.className = `maintenance-status-badge ${data.enabled ? "on" : "off"}`;
}

async function load() {
  if (!$("maintenanceModeCard")) return;
  try {
    const snap = await getDoc(ref);
    paint(snap.exists() ? { ...defaults, ...snap.data() } : defaults);
    setMessage(snap.exists() ? "Maintenance settings loaded from Supabase." : "Maintenance Mode is OFF. Ready.", "info");
  } catch (error) {
    console.error("Maintenance load:", error);
    paint(defaults);
    setMessage(`Load failed: ${error.message}`, "error");
  }
}

async function save() {
  const button = $("maintenanceSave");
  const data = { ...values(), updatedAt: serverTimestamp() };
  button.disabled = true;
  try {
    await setDoc(ref, data, { merge: true });
    paint(data);
    setMessage(data.enabled ? "Saved ✓ Website Maintenance Mode is ON." : "Saved ✓ Website Maintenance Mode is OFF.", "success");
  } catch (error) {
    console.error("Maintenance save:", error);
    setMessage(`Save failed: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

async function remove() {
  if (!confirm("Maintenance details delete karke Website Status OFF karna hai?")) return;
  const button = $("maintenanceDelete");
  button.disabled = true;
  try {
    await deleteDoc(ref);
    paint(defaults);
    setMessage("Maintenance details deleted. Website is normal / OFF.", "success");
  } catch (error) {
    console.error("Maintenance delete:", error);
    setMessage(`Delete failed: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

function preview() {
  const data = values();
  const w = window.open("", "_blank", "noopener");
  if (!w) {
    setMessage("Preview popup blocked. Browser popup allow karein.", "error");
    return;
  }
  const reopen = data.reopen
    ? `<div class="reopen">Expected Reopen: ${new Date(data.reopen).toLocaleString()}</div>`
    : "";
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data.title}</title><style>
  *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(135deg,#eef4ff,#fff8ec);color:#0f172a;min-height:100vh;display:grid;place-items:center;padding:24px}
  .box{width:min(680px,100%);background:#fff;padding:36px 28px;border-radius:24px;box-shadow:0 24px 70px rgba(15,23,42,.15);text-align:center;border:1px solid #e2e8f0}
  .icon{font-size:48px}.status{display:inline-block;margin:12px 0 6px;padding:7px 14px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:900;letter-spacing:.8px}
  h1{margin:12px 0;font-size:clamp(25px,5vw,38px)}p{color:#475569;font-size:17px;line-height:1.65}.reopen{margin-top:18px;font-weight:800;color:#1d4ed8}
  </style></head><body><main class="box"><div class="icon">🛠️</div><div class="status">${data.statusText}</div><h1>${data.title}</h1><p>${data.message}</p>${reopen}</main></body></html>`);
  w.document.close();
}

window.addEventListener("DOMContentLoaded", () => {
  if (!$("maintenanceModeCard")) return;
  load();
  $("maintenanceSave")?.addEventListener("click", save);
  $("maintenancePreview")?.addEventListener("click", preview);
  $("maintenanceDelete")?.addEventListener("click", remove);
  $("maintenanceStatus")?.addEventListener("change", () => {
    const badge = $("maintenanceBadge");
    const enabled = $("maintenanceStatus").value === "on";
    badge.textContent = enabled ? "ON" : "OFF";
    badge.className = `maintenance-status-badge ${enabled ? "on" : "off"}`;
  });
});
