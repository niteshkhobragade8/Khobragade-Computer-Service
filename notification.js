import { db } from "./firebase-config.js";

import {

collection,
addDoc,
getDocs,
deleteDoc,
updateDoc,
doc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveNotification=document.getElementById("saveNotification");

let editNotificationId=null;

async function loadNotifications(){

const notificationList=document.getElementById("notificationList");

notificationList.innerHTML="";

const snapshot=await getDocs(collection(db,"notifications"));

document.getElementById("totalNotifications").innerText=snapshot.size;

snapshot.forEach((item)=>{

const data=item.data();

notificationList.innerHTML+=`

<div class="notification-card">

<h3>${data.title}</h3>

<p>${data.description}</p>

<small>${data.type}</small>

<div class="actions">

<button onclick="editNotification('${item.id}')">

✏️ Edit

</button>

<button onclick="deleteNotification('${item.id}')">

🗑 Delete

</button>

</div>

</div>

`;

});

}
saveNotification.addEventListener("click",async()=>{

const title=document.getElementById("notificationTitle").value;

const description=document.getElementById("notificationDescription").value;

const type=document.getElementById("notificationType").value;

const priority=document.getElementById("notificationPriority").value;

if(title===""||description===""){

alert("Fill all fields");

return;

}

if(editNotificationId){

await updateDoc(doc(db,"notifications",editNotificationId),{

title,
description,
type,
priority

});

alert("Notification Updated");

editNotificationId=null;

saveNotification.innerText="Save Notification";

}else{

await addDoc(collection(db,"notifications"),{

title,
description,
type,
priority,
status:"Published",
createdAt:new Date()

});

alert("Notification Saved");

}

document.getElementById("notificationTitle").value="";

document.getElementById("notificationDescription").value="";

document.getElementById("notificationType").selectedIndex=0;

document.getElementById("notificationPriority").selectedIndex=0;

loadNotifications();

});
