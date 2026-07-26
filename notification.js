import { db } from "./firebase-config.js";

import {

collection,
query,
orderBy,
limit,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const latestQuery=query(

collection(db,"updates"),

orderBy("createdAt","desc"),

limit(1)

);
onSnapshot(latestQuery,(snapshot)=>{

snapshot.forEach((doc)=>{

const data=doc.data();

showNotification(

data.title,

data.description

);

});

});

function showNotification(title,message){

const notify=document.createElement("div");

notify.className="live-notification";

notify.innerHTML=`

<h3>🔔 ${title}</h3>

<p>${message}</p>

`;

document.body.appendChild(notify);

setTimeout(()=>{

notify.remove();

},5000);

}
const style=document.createElement("style");

style.innerHTML=`

.live-notification{

position:fixed;

top:20px;

right:20px;

width:320px;

background:linear-gradient(135deg,#00C853,#2979FF,#FF4081);

color:#fff;

padding:18px;

border-radius:15px;

box-shadow:0 10px 25px rgba(0,0,0,.25);

z-index:99999;

animation:slideIn .5s ease;

}

.live-notification h3{

margin-bottom:8px;

font-size:18px;

}

.live-notification p{

font-size:14px;

line-height:1.5;

}

@keyframes slideIn{

from{

transform:translateX(400px);

opacity:0;

}

to{

transform:translateX(0);

opacity:1;

}

}

`;

document.head.appendChild(style);
if("Notification" in window){

Notification.requestPermission();

}

function browserNotification(title,message){

if(Notification.permission==="granted"){

new Notification(title,{

body:message,

icon:"favicon.png"

});

}

}
window.addEventListener("load",()=>{

onSnapshot(latestQuery,(snapshot)=>{

snapshot.forEach((doc)=>{

const data=doc.data();

browserNotification(

data.title,

data.description

);

});

});

});

export{

showNotification,

browserNotification

};
