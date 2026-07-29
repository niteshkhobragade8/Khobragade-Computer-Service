const loginBtn = document.getElementById("loginBtn");
const username = document.getElementById("username");
const password = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";

// अगर पहले से Login है तो सीधे Dashboard
window.addEventListener("DOMContentLoaded", () => {

    const isLoggedIn =
        sessionStorage.getItem("adminLoggedIn");

    if (isLoggedIn === "true") {

        window.location.href = "dashboard.html";

    }

});

// Login Button
loginBtn.addEventListener("click", () => {

    const user = username.value.trim();
    const pass = password.value.trim();

    if (user === "" || pass === "") {

        loginMessage.style.color = "red";
        loginMessage.innerText =
            "Please enter Username and Password.";

        return;

    }

    if (
        user === ADMIN_USERNAME &&
        pass === ADMIN_PASSWORD
    ) {

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        loginMessage.style.color = "green";
        loginMessage.innerText =
            "Login Successful...";

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1000);

    } else {

        loginMessage.style.color = "red";
        loginMessage.innerText =
            "Invalid Username or Password.";

    }

});

// Enter Key Login
document.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        loginBtn.click();

    }

});

// Dashboard Protection
function checkLogin() {

    const isLoggedIn =
        sessionStorage.getItem("adminLoggedIn");

    if (
        !window.location.pathname.includes("login.html") &&
        isLoggedIn !== "true"
    ) {

        window.location.href = "login.html";

    }

}

// Logout
function logout() {

    sessionStorage.removeItem("adminLoggedIn");

    window.location.href = "login.html";

}

// Clear Form
function clearLoginForm() {

    username.value = "";
    password.value = "";
    loginMessage.innerText = "";

}

window.checkLogin = checkLogin;
window.logout = logout;
window.clearLoginForm = clearLoginForm;

export {
    checkLogin,
    logout
};
