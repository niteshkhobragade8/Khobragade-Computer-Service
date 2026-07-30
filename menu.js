const menuItems = document.querySelectorAll("#sidebarMenu li");
const pages = document.querySelectorAll(".page");

function openPage(pageName) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    menuItems.forEach(item => {
        item.classList.remove("active");
    });

    const targetPage =
        document.getElementById(pageName + "Page");

    if (targetPage) {
        targetPage.classList.add("active");
    }

    const activeMenu =
        document.querySelector(
            `[data-page="${pageName}"]`
        );

    if (activeMenu) {
        activeMenu.classList.add("active");
    }

    // Last Open Page Save
    localStorage.setItem("activePage", pageName);

}

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        if (item.id === "logoutBtn") {
            return;
        }

        const page = item.dataset.page;

        if (!page) return;

        openPage(page);

    });

});

// Page Refresh ke baad wahi page open hoga
window.addEventListener("DOMContentLoaded", () => {

    const savedPage =
        localStorage.getItem("activePage");

    if (savedPage) {
        openPage(savedPage);
    } else {
        openPage("dashboard");
    }

});

window.openDashboardPage = openPage;
