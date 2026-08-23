import { db, auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  getDoc
} from './supabase-firestore.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const logoutBtn = $("logoutBtn");
const topbarTitle = $("topbarTitle");
const adminIdentity = $("adminIdentity");

const collectionMap = {
  totalUsers: "users",
  totalServices: "services",
  totalCategories: "categories",
  totalNotifications: "notifications",
  totalVideos: "youtube"
};

let dashboardUnsubscribers = [];

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function renderMiniList(containerId, items, emptyText) {
  const container = $(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${escapeHTML(emptyText)}</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="mini-feed-item">
      <div class="mini-feed-dot"></div>
      <div>
        <strong>${escapeHTML(item.title || item.name || "Untitled")}</strong>
        <p>${escapeHTML(item.description || item.category || "")}</p>
      </div>
    </article>
  `).join("");
}

function watchCollectionCount(elementId, collectionName) {
  const unsubscribe = onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      if (collectionName === "users" && elementId === "totalUsers") {
        setText(elementId, snapshot.docs.filter((item) => item.data()?.isCommissionUser !== true).length);
        return;
      }
      setText(elementId, snapshot.size);
    },
    (error) => {
      console.error(`${collectionName} count error:`, error);
      setText(elementId, "—");
    }
  );
  dashboardUnsubscribers.push(unsubscribe);
}

async function loadRecentContent() {
  try {
    const notificationsSnapshot = await getDocs(collection(db, "notifications"));
    const notifications = notificationsSnapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => (item.status || "Published") === "Published")
      .sort((a, b) => timestampToMs(b.createdAt || b.updatedAt) - timestampToMs(a.createdAt || a.updatedAt))
      .slice(0, 5);

    renderMiniList("latestNotifications", notifications, "No notifications yet");

    const breaking = notifications.find((item) => item.type === "breaking");
    if ($("breakingNews") && breaking) {
      $("breakingNews").textContent = `${breaking.title}${breaking.description ? " — " + breaking.description : ""}`;
    }

    setText("notificationCount", notificationsSnapshot.size);
    const dropdown = $("notificationDropdownList");
    if (dropdown) {
      dropdown.innerHTML = notifications.length
        ? notifications.map((item) => `<div class="notification-item"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.description || "")}</p></div>`).join("")
        : "No Notifications";
    }
  } catch (error) {
    console.error("Recent content load error:", error);
  }
}

function watchVisitorSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const unsubSite = onSnapshot(doc(db, "analytics", "site"), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {};
    setText("totalVisitors", Number(data.totalVisitors || 0));
  }, (error) => {
    console.error("Visitor total error:", error);
    setText("totalVisitors", "—");
  });

  const unsubToday = onSnapshot(doc(db, "visitorDaily", today), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {};
    setText("dashboardTodayVisitors", Number(data.count || 0));
  }, (error) => {
    console.error("Today visitor error:", error);
    setText("dashboardTodayVisitors", "—");
  });

  dashboardUnsubscribers.push(unsubSite, unsubToday);
}

async function loadDashboard() {
  Object.entries(collectionMap).forEach(([elementId, collectionName]) => {
    watchCollectionCount(elementId, collectionName);
  });
  watchVisitorSummary();
  await loadRecentContent();
}

function cleanupDashboardListeners() {
  dashboardUnsubscribers.forEach((unsubscribe) => {
    try { unsubscribe(); } catch (_) {}
  });
  dashboardUnsubscribers = [];
}

const bell = $("notificationBell");
const notificationDropdown = $("notificationDropdown");
if (bell && notificationDropdown) {
  bell.addEventListener("click", () => {
    notificationDropdown.style.display = notificationDropdown.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", (event) => {
    if (!bell.contains(event.target) && !notificationDropdown.contains(event.target)) {
      notificationDropdown.style.display = "none";
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    cleanupDashboardListeners();
    window.location.replace("login.html");
    return;
  }

  const ADMIN_EMAIL = "niteshkhobragade8@gmail.com";
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    cleanupDashboardListeners();
    await signOut(auth);
    alert("Admin access required.");
    window.location.replace("login.html");
    return;
  }
  if (adminIdentity) adminIdentity.textContent = user.email || "Administrator";
  await loadDashboard();
});

logoutBtn?.addEventListener("click", async () => {
  if (!confirm("Logout karna chahte ho?")) return;
  try {
    localStorage.setItem("activePage", "dashboard");
    cleanupDashboardListeners();
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout Failed");
  }
});

window.refreshDashboard = async () => {
  cleanupDashboardListeners();
  await loadDashboard();
};
window.reloadDashboard = window.refreshDashboard;

window.addEventListener("beforeunload", cleanupDashboardListeners);

export { loadDashboard };
