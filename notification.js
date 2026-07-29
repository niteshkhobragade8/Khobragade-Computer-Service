import { db } from "./firebase-config.js";

import {

collection,
addDoc,
getDocs,
deleteDoc,
updateDoc,
doc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveNotification =
document.getElementById("saveNotification");

const notificationList =
document.getElementById("notificationList");

const notificationPreview =
document.getElementById("notificationPreview");

const historyBox =
document.getElementById("notificationHistory");

const totalNotifications =
document.getElementById("totalNotifications");

const publishedNotifications =
document.getElementById("publishedNotifications");

const draftNotifications =
document.getElementById("draftNotifications");

let editNotificationId = null;

async function loadNotifications(){

if(!notificationList) return;

notificationList.innerHTML="";

let total=0;
let published=0;
let draft=0;

const snapshot =
await getDocs(collection(db,"notifications"));

snapshot.forEach((item)=>{

const data=item.data();

total++;

if(data.status==="Published"){
published++;
}else{
draft++;
}

notificationList.innerHTML+=`

<div class="notification-card">

<h3>${data.title}</h3>

<p>${data.description}</p>

<small>

${data.type} |
${data.priority}

</small>

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
if(totalNotifications){
totalNotifications.innerText=total;
}

if(publishedNotifications){
publishedNotifications.innerText=published;
}

if(draftNotifications){
draftNotifications.innerText=draft;
}

if(total===0){

notificationList.innerHTML=`

<div class="notification-card">

<h3>No Notifications Available</h3>

<p>Create your first notification.</p>

</div>

`;

}

}

saveNotification.addEventListener("click",async()=>{

const title=
document.getElementById("notificationTitle").value.trim();

const description=
document.getElementById("notificationDescription").value.trim();

const type=
document.getElementById("notificationType").value;

const priority=
document.getElementById("notificationPriority").value;

if(title===""||description===""){

alert("Fill all fields");

return;

}

if(editNotificationId){

await updateDoc(

doc(db,"notifications",editNotificationId),

{
title,
description,
type,
priority
}

);

alert("Notification Updated");

editNotificationId=null;

saveNotification.innerText="Save Notification";

}else{

await addDoc(

collection(db,"notifications"),

{

title,
description,
type,
priority,
status:"Published",
createdAt:new Date()

}

);

alert("Notification Saved");

}

document.getElementById("notificationTitle").value="";
document.getElementById("notificationDescription").value="";
document.getElementById("notificationType").selectedIndex=0;
document.getElementById("notificationPriority").selectedIndex=0;

loadNotifications();

});
window.deleteNotification = async function(id){

    if(!confirm("Delete this notification?")){
        return;
    }

    await deleteDoc(doc(db,"notifications",id));

    alert("Notification Deleted");

    loadNotifications();

};

window.editNotification = async function(id){

    const snapshot =
    await getDocs(collection(db,"notifications"));

    snapshot.forEach((item)=>{

        if(item.id===id){

            const data=item.data();

            editNotificationId=id;

            document.getElementById("notificationTitle").value=data.title;

            document.getElementById("notificationDescription").value=data.description;

            document.getElementById("notificationType").value=data.type;

            document.getElementById("notificationPriority").value=data.priority;

            saveNotification.innerText="Update Notification";

            if(notificationPreview){

                notificationPreview.innerHTML=`

                <h2>👁 Live Preview</h2>

                <h3>${data.title}</h3>

                <p>${data.description}</p>

                <small>${data.type} | ${data.priority}</small>

                `;

            }

        }

    });

};

const refreshBtn =
document.getElementById("refreshNotifications");

if(refreshBtn){

    refreshBtn.addEventListener("click",loadNotifications);

}

window.addEventListener("DOMContentLoaded",()=>{

    loadNotifications();

});

export{

    loadNotifications

};
