import { db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

async function loadSchemeUpdates() {

    const container = document.getElementById("schemeUpdates");

    container.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "updates"));

    querySnapshot.forEach((doc) => {

        const data = doc.data();

        container.innerHTML += `
        <div class="card">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            <a class="btn whatsapp" href="#">View Details</a>
        </div>
        `;

    });

}

loadSchemeUpdates();
