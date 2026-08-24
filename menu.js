const titleMap = {
  dashboard: "Dashboard", commissionpanel: "Commission Panel", admineditor: "Admin Editor", updates: "Government Updates", services: "Services",
  categories: "Service Categories", images: "Images Manager", documents: "Documents Manager", youtube: "YouTube Manager",
  notifications: "Notifications", analytics: "Analytics", seo: "SEO Manager", pages: "Website Pages",
  sitebuilder: "Full Website CMS", dynamicpages: "Page & Menu Builder", recyclebin: "Recycle Bin",
  themes: "Theme Manager", userportalcms: "Website CMS", settings: "Portal Settings", servicesmanager: "Services", actionsmanager: "Actions", formsmanager: "Forms", servicecharges: "Service Charges", allcharge: "All Charge"
};
let currentPage='';
function openPage(pageName) {
  const targetPage=document.getElementById(pageName+"Page");
  if(!targetPage)return;

  // Paint the clicked page first. Avoid expensive work before the UI changes.
  if(currentPage!==pageName){
    document.querySelector(".page.active")?.classList.remove("active");
    document.querySelector("#sidebarMenu li.active")?.classList.remove("active");
    targetPage.classList.add("active");
    const activeMenu=document.querySelector(`[data-page="${CSS.escape(pageName)}"]`);
    activeMenu?.classList.add("active");
    const topbarTitle=document.getElementById("topbarTitle");
    if(topbarTitle)topbarTitle.textContent=activeMenu?.querySelector("span")?.textContent || titleMap[pageName] || "Dashboard";
    localStorage.setItem("activePage",pageName);
    currentPage=pageName;
    window.scrollTo(0,0);
  }

  // Heavy refreshes happen after paint, not in the click handler.
  requestAnimationFrame(()=>setTimeout(()=>{
    if(pageName==="analytics"&&typeof window.refreshAnalytics==="function")window.refreshAnalytics();
  },0));
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
