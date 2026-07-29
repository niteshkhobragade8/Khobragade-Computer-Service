import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const totalUpdatesElement =
    document.getElementById("totalUpdates");

const totalServicesElement =
    document.getElementById("totalServices");

const totalVisitorsElement =
    document.getElementById("totalVisitors");

const logoutButton =
    document.getElementById("logoutBtn");

let dashboardStarted = false;

function setText(element, value) {
    if (element) {
        element.innerText = value;
    }
}

async function loadDashboard() {
    try {
        const [updatesSnapshot, servicesSnapshot] =
            await Promise.all([
                getDocs(collection(db, "updates")),
                getDocs(collection(db, "services"))
            ]);

        setText(
            totalUpdatesElement,
            updatesSnapshot.size
        );

        setText(
            totalServicesElement,
            servicesSnapshot.size
        );

    } catch (error) {
        console.error(
            "Dashboard data loading error:",
            error
        );

        setText(totalUpdatesElement, "Error");
        setText(totalServicesElement, "Error");
    }
}

function loadVisitors() {
    const visitors =
        Number(localStorage.getItem("visitors")) || 0;

    setText(totalVisitorsElement, visitors);
}

function increaseVisitor() {
    const visitorAlreadyCounted =
        sessionStorage.getItem(
            "dashboardVisitorCounted"
        );

    if (visitorAlreadyCounted === "true") {
        return;
    }

    let visitors =
        Number(localStorage.getItem("visitors")) || 0;

    visitors++;

    localStorage.setItem(
        "visitors",
        visitors.toString()
    );

    sessionStorage.setItem(
        "dashboardVisitorCounted",
        "true"
    );
}

async function startDashboard() {
    if (dashboardStarted) {
        return;
    }

    dashboardStarted = true;

    increaseVisitor();

    await loadDashboard();

    loadVisitors();
}

async function logoutAdmin() {
    try {
        if (logoutButton) {
            logoutButton.style.pointerEvents = "none";
            logoutButton.style.opacity = "0.6";
        }

        await signOut(auth);

        sessionStorage.removeItem(
            "dashboardVisitorCounted"
        );

        window.location.replace("login.html");

    } catch (error) {
        console.error("Logout Error:", error);

        alert(
            "Logout failed. Please check your internet connection."
        );

        if (logoutButton) {
            logoutButton.style.pointerEvents = "";
            logoutButton.style.opacity = "";
        }
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    await startDashboard();
});

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );
}

window.refreshDashboard = async function () {
    await loadDashboard();
    loadVisitors();
};

window.reloadDashboard = async function () {
    await loadDashboard();
    loadVisitors();
};

window.resetDashboard = function () {
    setText(totalUpdatesElement, "0");
    setText(totalServicesElement, "0");
    setText(totalVisitorsElement, "0");
};

window.logout = logoutAdmin;

export {
    loadDashboard,
    loadVisitors,
    logoutAdmin
};
