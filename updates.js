import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveBtn = document.getElementById("saveUpdate");

async function loadUpdates() {

    const updatesList = document.getElementById("updatesList");

    updatesList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "updates"));

    querySnapshot.forEach((doc) => {

        const data = doc.data();

        updatesList.innerHTML += `

        <div class="card">

        <h3>${data.title}</h3>

        <p>${data.description}</p>

        <small>${data.category}</small>

        </div>

        `;

    });

}

saveBtn.addEventListener("click", async () => {

    const title = document.getElementById("updateTitle").value;

    const description = document.getElementById("updateDescription").value;

    const category = document.getElementById("updateCategory").value;

    if(title==="" || description===""){

        alert("Fill all fields");

        return;

    }

    await addDoc(collection(db,"updates"),{

        title,
        description,
        category,
        status:"Published",
        createdAt:new Date()

    });

    alert("Update Saved Successfully");

    document.getElementById("updateTitle").value="";
    document.getElementById("updateDescription").value="";

    loadUpdates();

});

loadUpdates();
