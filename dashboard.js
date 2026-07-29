import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const totalUpdates = document.getElementById("totalUpdates");
const totalServices = document.getElementById("totalServices");
const totalVisitors = document.getElementById("totalVisitors");
const logoutBtn = document.getElementById("logoutBtn");

async function loadDashboard() {

    try {

        const updates = await getDocs(collection(db, "updates"));
        const services = await getDocs(collection(db, "services"));

        if (totalUpdates)
            totalUpdates.innerText = updates.size;

        if (totalServices)
            totalServices.innerText = services.size;

    } catch (error) {

        console.error(error);

    }

}

function loadVisitors() {

    let visitors =
        Number(localStorage.getItem("visitors") || 0);

    visitors++;

    localStorage.setItem("visitors", visitors);

    if (totalVisitors)
        totalVisitors.innerText = visitors;

}

async function startDashboard() {

    await loadDashboard();

    loadVisitors();

}

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;

    }

    await startDashboard();

});

logoutBtn?.addEventListener("click", async () => {

    const ok =
        confirm("Logout karna chahte ho?");

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.replace("login.html");

    } catch (e) {

        alert("Logout Failed");

        console.error(e);

    }

});

window.refreshDashboard = startDashboard;
window.reloadDashboard = startDashboard;

export {
    loadDashboard
};
