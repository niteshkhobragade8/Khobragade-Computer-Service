import { db } from "./supabase-app.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "./supabase-compat.js";

const settingsRef = doc(db, "settings", "website");
const $ = (id) => document.getElementById(id);

const fieldIds = [
  "siteName",
  "tagline",
  "adminEmail",
  "contactNumber",
  "whatsappNumber",
  "address",
  "youtubeChannel",
  "facebook",
  "instagram",
  "telegram",
  "logoUrl",
  "heroTitle",
  "heroSubtitle",
  "homeAboutTitle",
  "homeAboutText",
  "footerText",
  "themePrimary",
  "themeSecondary",
  "menuColor",
  "cardRadius",
  "defaultMode",
  "defaultLanguage",
  "heroImageUrl"
];

function getValue(id) {
  return $(id)?.value?.trim() || "";
}

function setValue(id, value) {
  if ($(id)) $(id).value = value || "";
}

function setStatus(message, type = "success") {
  const box = $("settingsMessage");
  if (!box) return;
  box.className = `settings-message ${type}`;
  box.textContent = message;
}

async function loadSettings() {
  try {
    const snapshot = await getDoc(settingsRef);
    if (!snapshot.exists()) {
      setValue("siteName", "Khobragade Computer Service Centre");
      setValue("contactNumber", "9637832490");
      setValue("whatsappNumber", "9637832490");
      setValue("youtubeChannel", "https://youtube.com/@niteshkhobragade8");
      setValue("themePrimary", "#ec4899"); setValue("themeSecondary", "#2563eb"); setValue("menuColor", "#172554");
      setValue("cardRadius", "20"); setValue("defaultMode", "light"); setValue("defaultLanguage", "en");
      setStatus("Default settings loaded. Save once to publish them.", "info");
      return;
    }
    const data = snapshot.data();
    fieldIds.forEach((id) => setValue(id, data[id]));
    setValue("logoUrlCms", data.logoUrl);
    setStatus("Settings loaded from Supabase.", "success");
  } catch (error) {
    console.error(error);
    setStatus(`Settings load error: ${error.message}`, "error");
  }
}

async function saveWebsiteSettings() {
  const button = $("saveSettings");
  const siteName = getValue("siteName");
  const contactNumber = getValue("contactNumber");
  if (!siteName) {
    alert("Website Name required hai.");
    return;
  }
  if (contactNumber && !/^\+?\d{10,13}$/.test(contactNumber.replace(/\s/g, ""))) {
    alert("Contact Number check karo.");
    return;
  }

  const settingsData = {};
  if ($("logoUrlCms")?.value.trim()) setValue("logoUrl", $("logoUrlCms").value.trim());
  fieldIds.forEach((id) => { settingsData[id] = getValue(id); });
  settingsData.updatedAt = serverTimestamp();

  button.disabled = true;
  button.textContent = "Saving...";
  try {
    await setDoc(settingsRef, settingsData, { merge: true });
    setStatus("Settings Saved Successfully. Public website par automatically update hongi.", "success");
    alert("Settings Saved Successfully");
  } catch (error) {
    console.error(error);
    setStatus(`Save failed: ${error.message}`, "error");
    alert(`Settings Save Failed: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "Save Website Settings";
  }
}

function resetSettingsForm() {
  if (!confirm("Form ko default values par reset karna hai? Supabase data tab tak delete nahi hoga jab tak Save nahi karoge.")) return;
  fieldIds.forEach((id) => setValue(id, ""));
  setValue("siteName", "Khobragade Computer Service Centre");
  setValue("contactNumber", "9637832490");
  setValue("whatsappNumber", "9637832490");
  setValue("youtubeChannel", "https://youtube.com/@niteshkhobragade8");
  setValue("themePrimary", "#ec4899"); setValue("themeSecondary", "#2563eb"); setValue("menuColor", "#172554");
  setValue("cardRadius", "20"); setValue("defaultMode", "light"); setValue("defaultLanguage", "en");
  setStatus("Default values loaded. Save to apply.", "info");
}

$("saveSettings")?.addEventListener("click", saveWebsiteSettings);
$("resetSettings")?.addEventListener("click", resetSettingsForm);
window.addEventListener("DOMContentLoaded", loadSettings);

export { loadSettings };
