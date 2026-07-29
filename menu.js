const menuItems = document.querySelectorAll("#sidebarMenu li");
const pages = document.querySelectorAll(".page");

menuItems.forEach((item) => {

    item.addEventListener("click", () => {

        // Logout dashboard.js handle karega
        if (item.id === "logoutBtn") return;

        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        pages.forEach(p => p.classList.remove("active"));

        const page = item.dataset.page;

        const target = document.getElementById(page + "Page");

        if (target) {
            target.classList.add("active");
        }

    });

});
