const titleMap = {
  dashboard: "Dashboard", admineditor: "Admin Editor", updates: "Government Updates", services: "Services",
  categories: "Categories", images: "Images Manager", documents: "Documents Manager", youtube: "YouTube Manager",
  notifications: "Notifications", analytics: "Analytics", seo: "SEO Manager", pages: "Website Pages",
  sitebuilder: "Full Website CMS", dynamicpages: "Page & Menu Builder", recyclebin: "Recycle Bin",
  themes: "Theme Manager", userportalcms: "User Portal CMS", settings: "Website Settings"
};
function openPage(pageName) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.querySelectorAll("#sidebarMenu li").forEach(item => item.classList.remove("active"));
  const targetPage=document.getElementById(pageName+"Page");
  const activeMenu=document.querySelector(`[data-page="${CSS.escape(pageName)}"]`);
  if(!targetPage)return;
  targetPage.classList.add("active"); activeMenu?.classList.add("active");
  const topbarTitle=document.getElementById("topbarTitle");
  if(topbarTitle)topbarTitle.textContent=activeMenu?.querySelector("span")?.textContent || titleMap[pageName] || "Dashboard";
  localStorage.setItem("activePage",pageName); window.scrollTo({top:0,behavior:"smooth"});
  if(pageName==="analytics"&&typeof window.refreshAnalytics==="function")window.refreshAnalytics();
  if(pageName==="dashboard"&&typeof window.refreshDashboard==="function")window.refreshDashboard();
}
document.getElementById("sidebarMenu")?.addEventListener("click",event=>{
  const item=event.target.closest("li[data-page]"); if(!item||item.id==="logoutBtn")return;
  openPage(item.dataset.page);
});
window.addEventListener("DOMContentLoaded",()=>{
  const saved=localStorage.getItem("activePage")||"dashboard";
  openPage(document.getElementById(saved+"Page")?saved:"dashboard");
});
window.openDashboardPage=openPage;
