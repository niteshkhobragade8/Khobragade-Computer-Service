import { db } from "./firebase-config.js";

import {

collection,
addDoc,
getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveService=document.getElementById("saveService");

async function loadServices(){

const servicesList=document.getElementById("servicesList");

servicesList.innerHTML="";

const snapshot=await getDocs(collection(db,"services"));

snapshot.forEach((item)=>{

const data=item.data();

servicesList.innerHTML+=`

<div class="card">

<h3>${data.icon} ${data.name}</h3>

<p>${data.description}</p>

<small>${data.category}</small>

</div>

`;

});

}
saveService.addEventListener("click", async () => {

const name = document.getElementById("serviceName").value;

const description = document.getElementById("serviceDescription").value;

const category = document.getElementById("serviceCategory").value;

const icon = document.getElementById("serviceIcon").value;

if(name === ""){

alert("Enter Service Name");

return;

}

await addDoc(collection(db,"services"),{

name,
description,
category,
icon,
status:"Published",
createdAt:new Date()

});

alert("Service Saved Successfully");

document.getElementById("serviceName").value="";
document.getElementById("serviceDescription").value="";
document.getElementById("serviceIcon").value="";

loadServices();

});
loadServices();

window.addEventListener("DOMContentLoaded", () => {

loadServices();

});
window.refreshServices = function(){

loadServices();

};

window.clearServiceForm = function(){

document.getElementById("serviceName").value="";
document.getElementById("serviceDescription").value="";
document.getElementById("serviceCategory").selectedIndex=0;
document.getElementById("serviceIcon").value="";

};
window.addEventListener("load", () => {

loadServices();

});

export {

loadServices

};
