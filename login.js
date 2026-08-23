import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");
const forgotAdminPassword = document.getElementById("forgotAdminPassword");

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


forgotAdminPassword?.addEventListener("click", async () => {
    const userEmail = email.value.trim();
    if (!userEmail) {
        showMessage("Admin Email enter karein, phir Forgot Password dabayein.");
        email.focus();
        return;
    }
    forgotAdminPassword.disabled = true;
    try {
        await sendPasswordResetEmail(auth, userEmail);
        showMessage("Password reset email sent. Inbox / Spam check karein.", "green");
    } catch (error) {
        let msg = "Password reset email send nahi hua.";
        if (error.code === "auth/invalid-email") msg = "Invalid Admin Email.";
        else if (error.code === "auth/too-many-requests") msg = "Too many requests. Thodi der baad try karein.";
        else if (error.code === "auth/network-request-failed") msg = "Internet connection check karein.";
        showMessage(msg);
    } finally {
        forgotAdminPassword.disabled = false;
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

        const credential = await signInWithEmailAndPassword(
            auth,
            userEmail,
            userPassword
        );
        const ADMIN_EMAIL = "niteshkhobragade8@gmail.com";
        if ((credential.user.email || "").toLowerCase() !== ADMIN_EMAIL) {
            await signOut(auth);
            throw new Error("This account is not an administrator.");
        }

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

            case "auth/user-not-found":
            case "auth/wrong-password":
                msg = "Incorrect email or password";
                break;
            case "auth/user-disabled":
                msg = "This account is disabled";
                break;
            default:
                msg = error.message === "This account is not an administrator." ? error.message : "Login failed. Please check your details and try again.";

        }

        showMessage(msg);

    }

    loginBtn.disabled = false;
    loginBtn.innerText = "Login";

});

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const ADMIN_EMAIL = "niteshkhobragade8@gmail.com";
    if ((user.email || "").toLowerCase() === ADMIN_EMAIL) {
        localStorage.setItem("activePage", "dashboard");
        window.location.replace("dashboard.html");
    }
});
