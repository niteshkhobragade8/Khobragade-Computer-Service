// ===============================
// SETTINGS MODULE - PART 1
// Khobragade Computer Service Centre
// ===============================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Firestore Reference
const settingsRef = doc(db, "settings", "website");

// Form Elements
const siteName = document.getElementById("siteName");
const adminEmail = document.getElementById("adminEmail");
const contactNumber = document.getElementById("contactNumber");
const youtubeChannel = document.getElementById("youtubeChannel");
const saveSettings = document.getElementById("saveSettings");

// Extra fields (future ready)
const whatsappNumber = document.getElementById("whatsappNumber");
const address = document.getElementById("address");
const logoUrl = document.getElementById("logoUrl");
const facebook = document.getElementById("facebook");
const instagram = document.getElementById("instagram");
const telegram = document.getElementById("telegram");
const theme = document.getElementById("theme");

// ===============================
// LOAD SETTINGS
// ===============================

async function loadSettings() {

    try {

        const snapshot = await getDoc(settingsRef);

        if (!snapshot.exists()) {
            console.log("No Settings Found");
            return;
        }

        const data = snapshot.data();

        if (siteName) siteName.value = data.siteName || "";
        if (adminEmail) adminEmail.value = data.adminEmail || "";
        if (contactNumber) contactNumber.value = data.contactNumber || "";
        if (youtubeChannel) youtubeChannel.value = data.youtubeChannel || "";

        if (whatsappNumber)
            whatsappNumber.value = data.whatsappNumber || "";

        if (address)
            address.value = data.address || "";

        if (logoUrl)
            logoUrl.value = data.logoUrl || "";

        if (facebook)
            facebook.value = data.facebook || "";

        if (instagram)
            instagram.value = data.instagram || "";

        if (telegram)
            telegram.value = data.telegram || "";

        if (theme)
            theme.value = data.theme || "Light";

        console.log("Settings Loaded");

    } catch (error) {

        console.error(error);

    }

}
// ===============================
// SAVE SETTINGS
// ===============================

async function saveWebsiteSettings() {

    try {

        const settingsData = {

            siteName: siteName?.value.trim() || "",

            adminEmail: adminEmail?.value.trim() || "",

            contactNumber: contactNumber?.value.trim() || "",

            youtubeChannel: youtubeChannel?.value.trim() || "",

            whatsappNumber: whatsappNumber?.value.trim() || "",

            address: address?.value.trim() || "",

            logoUrl: logoUrl?.value.trim() || "",

            facebook: facebook?.value.trim() || "",

            instagram: instagram?.value.trim() || "",

            telegram: telegram?.value.trim() || "",

            theme: theme?.value || "Light",

            updatedAt: serverTimestamp()

        };

        await setDoc(settingsRef, settingsData, {

            merge: true

        });

        alert("✅ Settings Saved Successfully");

        console.log("Settings Saved");

    }

    catch (error) {

        console.error(error);

        alert("❌ Failed To Save Settings");

    }

}

// ===============================
// SAVE BUTTON
// ===============================

if (saveSettings) {

    saveSettings.addEventListener(

        "click",

        saveWebsiteSettings

    );

}
// ===============================
// MODULE START
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

    await loadSettings();

});

// ===============================
// LIVE PREVIEW (Future Ready)
// ===============================

function updateSettingsPreview() {

    console.log("Settings Updated");

}

[
    siteName,
    adminEmail,
    contactNumber,
    youtubeChannel,
    whatsappNumber,
    address,
    logoUrl,
    facebook,
    instagram,
    telegram,
    theme

].forEach((element) => {

    if (!element) return;

    element.addEventListener(

        "input",

        updateSettingsPreview

    );

});

// ===============================
// EXPORT (Future Use)
// ===============================

export {

    loadSettings

};
