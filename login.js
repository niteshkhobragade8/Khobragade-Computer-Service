import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

function showMessage(message, color = "red") {
    loginMessage.innerText = message;
    loginMessage.style.color = color;
}

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {
        password.type = "text";
        togglePassword.innerText = "🙈";
    } else {
        password.type = "password";
        togglePassword.innerText = "👁";
    }

});

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const userEmail = email.value.trim();
    const userPassword = password.value;

    if (!userEmail || !userPassword) {
        showMessage("Please enter Email & Password.");
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerText = "Logging in...";

    try {

        await signInWithEmailAndPassword(
            auth,
            userEmail,
            userPassword
        );

        localStorage.setItem("activePage", "dashboard");

        showMessage(
            "Login Successful...",
            "green"
        );

        setTimeout(() => {

            window.location.replace("dashboard.html");

        }, 700);

    } catch (error) {

        let msg = "Login Failed";

        switch (error.code) {

            case "auth/invalid-email":
                msg = "Invalid Email Address";
                break;

            case "auth/invalid-credential":
                msg = "Wrong Email or Password";
                break;

            case "auth/network-request-failed":
                msg = "Check Internet Connection";
                break;

            case "auth/too-many-requests":
                msg = "Too many attempts. Try later.";
                break;

            default:
                msg = error.message;

        }

        showMessage(msg);

    }

    loginBtn.disabled = false;
    loginBtn.innerText = "Login";

});

onAuthStateChanged(auth, (user) => {

    if (user) {

        localStorage.setItem("activePage", "dashboard");
        window.location.replace("dashboard.html");

    }

});
