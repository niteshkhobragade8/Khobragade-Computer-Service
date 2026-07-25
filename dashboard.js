import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// Login Check
onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "admin.html";

    } else {

        console.log("Welcome :", user.email);

    }

});

// Logout

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {

    signOut(auth)
    .then(() => {

        alert("Logout Successful");

        window.location.href = "admin.html";

    })
    .catch((error) => {

        alert(error.message);

    });

});
