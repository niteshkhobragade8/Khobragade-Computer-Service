import { db } from "./firebase-config.js";
alert("services.js loaded");
import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveService = document.getElementById("saveService");

async function loadServices() {

    const servicesList = document.getElementById("servicesList");

    servicesList.innerHTML = "";

    const snapshot = await getDocs(collection(db, "services"));

    snapshot.forEach((doc) => {

        const data = doc.data();

        servicesList.innerHTML += `
        <div class="card">
            <h3>${data.icon} ${data.name}</h3>
        </div>
        `;

    });

}

saveService.addEventListener("click", async () => {

    const name = document.getElementById("serviceName").value;
    const icon = document.getElementById("serviceIcon").value;

    if(name===""){
        alert("Enter Service Name");
        return;
    }

    await addDoc(collection(db,"services"),{
        name,
        icon
    });

    alert("Service Saved");

    document.getElementById("serviceName").value="";
    document.getElementById("serviceIcon").value="";

    loadServices();

});

loadServices();
