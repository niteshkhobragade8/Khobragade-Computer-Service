import { db } from "./firebase-config.js";

import {

collection,
getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

async function loadDashboard(){

const updates=await getDocs(collection(db,"updates"));

const services=await getDocs(collection(db,"services"));

document.getElementById("totalUpdates").innerText=updates.size;

document.getElementById("totalServices").innerText=services.size;

}
async function loadVisitors(){

const visitors=localStorage.getItem("visitors") || 0;

document.getElementById("totalVisitors").innerText=visitors;

}

function increaseVisitor(){

let visitors=Number(localStorage.getItem("visitors") || 0);

visitors++;

localStorage.setItem("visitors",visitors);

}

increaseVisitor();
window.refreshDashboard = async function(){

await loadDashboard();

await loadVisitors();

};

window.addEventListener("DOMContentLoaded", async () => {

await loadDashboard();

await loadVisitors();

});
window.resetDashboard = function(){

document.getElementById("totalUpdates").innerText="0";

document.getElementById("totalServices").innerText="0";

document.getElementById("totalVisitors").innerText="0";

};

window.reloadDashboard = async function(){

await loadDashboard();

await loadVisitors();

};
window.addEventListener("load", async () => {

await loadDashboard();

await loadVisitors();

});

export {

loadDashboard,

loadVisitors

};
