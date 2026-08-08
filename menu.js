const menuItems = document.querySelectorAll("#sidebarMenu li");
const pages = document.querySelectorAll(".page");
const titleMap = {
  dashboard: "Dashboard",
  updates: "Government Updates",
  services: "Services",
  categories: "Categories",
  images: "Images Manager",
  documents: "Documents Manager",
  youtube: "YouTube Manager",
  notifications: "Notifications",
  analytics: "Analytics",
  pages: "Website Pages",
  sitebuilder: "Full Website CMS",
  settings: "Website Settings"
};

function openPage(pageName) {
  pages.forEach((page) => page.classList.remove("active"));
  menuItems.forEach((item) => item.classList.remove("active"));

  const targetPage = document.getElementById(pageName + "Page");
  const activeMenu = document.querySelector(`[data-page="${pageName}"]`);
  if (!targetPage) return;

  targetPage.classList.add("active");
  activeMenu?.classList.add("active");
  const topbarTitle = document.getElementById("topbarTitle");
  if (topbarTitle) topbarTitle.textContent = titleMap[pageName] || "Dashboard";
  localStorage.setItem("activePage", pageName);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageName === "analytics" && typeof window.refreshAnalytics === "function") window.refreshAnalytics();
  if (pageName === "dashboard" && typeof window.refreshDashboard === "function") window.refreshDashboard();
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (item.id === "logoutBtn") return;
    const page = item.dataset.page;
    if (page) openPage(page);
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const savedPage = localStorage.getItem("activePage") || "dashboard";
  openPage(document.getElementById(savedPage + "Page") ? savedPage : "dashboard");
});

window.openDashboardPage = openPage;
