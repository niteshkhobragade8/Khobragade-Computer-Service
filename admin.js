import { auth } from "./supabase-app.js";
import { signInWithEmailAndPassword } from './supabase-auth.js';

const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {

        window.location.href = "dashboard.html";

    })
    .catch((error) => {

        message.innerHTML = error.message;

    });

});
