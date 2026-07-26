import { db } from "./firebase-config.js";

import {

collection,
getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

async function loadAnalytics(){

const updates=await getDocs(collection(db,"updates"));

const services=await getDocs(collection(db,"services"));

const categories=await getDocs(collection(db,"categories"));

console.log("Updates :",updates.size);

console.log("Services :",services.size);

console.log("Categories :",categories.size);

}
window.refreshAnalytics = async function(){

await loadAnalytics();

};

window.addEventListener("DOMContentLoaded", async ()=>{

await loadAnalytics();

});
window.showAnalytics = async function(){

await loadAnalytics();

alert("Analytics Refreshed Successfully");

};

window.reloadAnalytics = async function(){

await loadAnalytics();

};
window.resetAnalytics = function(){

console.clear();

};

window.getAnalytics = async function(){

await loadAnalytics();

};
window.addEventListener("load", async () => {

await loadAnalytics();

});

export {

loadAnalytics

};
