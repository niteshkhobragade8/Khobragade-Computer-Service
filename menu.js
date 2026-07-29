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

}

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        if (item.id === "logoutBtn") {

            // Logout dashboard.js handle karega
            return;

        }

        const page = item.dataset.page;

        if (!page) return;

        openPage(page);

    });

});

window.openDashboardPage = openPage;
