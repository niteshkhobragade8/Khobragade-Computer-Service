import { db } from "./firebase-config.js";

import {
collection,
addDoc,
getDocs,
doc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveService = document.getElementById("saveService");

let editId = null;

async function loadServices(){

const servicesList=document.getElementById("servicesList");

servicesList.innerHTML="";

const snapshot=await getDocs(collection(db,"services"));

if(snapshot.empty){
servicesList.innerHTML="No Services Available";
return;
}

snapshot.forEach((item)=>{

const data=item.data();

servicesList.innerHTML+=`

<div class="card">

<h3>${data.icon || ""} ${data.name}</h3>

<p>${data.description}</p>

<small>${data.category}</small>

<br><br>

<button onclick="editService('${item.id}')">
✏️ Edit
</button>

<button onclick="deleteService('${item.id}')"
style="background:#dc2626;margin-left:8px;">
🗑 Delete
</button>

</div>

`;

});

}

saveService.addEventListener("click", async ()=>{

const name=document.getElementById("serviceName").value.trim();
const description=document.getElementById("serviceDescription").value.trim();
const category=document.getElementById("serviceCategory").value;
const icon=document.getElementById("serviceIcon").value.trim();

if(name===""){
alert("Enter Service Name");
return;
}

if(editId){

await updateDoc(doc(db,"services",editId),{

name,
description,
category,
icon

});

alert("Service Updated Successfully");

editId=null;

saveService.innerText="Save Service";

}else{

await addDoc(collection(db,"services"),{

name,
description,
category,
icon,
status:"Published",
createdAt:new Date()

});

alert("Service Saved Successfully");

}

clearServiceForm();

loadServices();

});

window.editService = async function(id){

const snapshot=await getDocs(collection(db,"services"));

snapshot.forEach((item)=>{

if(item.id===id){

const data=item.data();

document.getElementById("serviceName").value=data.name;
document.getElementById("serviceDescription").value=data.description;
document.getElementById("serviceCategory").value=data.category;
document.getElementById("serviceIcon").value=data.icon;

editId=id;

saveService.innerText="Update Service";

}

});

};

window.deleteService = async function(id){

if(!confirm("Delete this service?")){
return;
}

await deleteDoc(doc(db,"services",id));

alert("Service Deleted Successfully");

loadServices();

};

window.clearServiceForm=function(){

document.getElementById("serviceName").value="";
document.getElementById("serviceDescription").value="";
document.getElementById("serviceCategory").selectedIndex=0;
document.getElementById("serviceIcon").value="";

};

window.refreshServices=function(){
loadServices();
};

window.addEventListener("DOMContentLoaded",()=>{
loadServices();
});

export{
loadServices
};
