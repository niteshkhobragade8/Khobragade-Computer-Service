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
  try {
    sessionStorage.setItem("kcsc_maintenance_preview_v1", JSON.stringify(data));
  } catch (error) {
    console.warn("Preview data save failed:", error);
  }
  window.location.href = "maintenance-preview.html";
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
