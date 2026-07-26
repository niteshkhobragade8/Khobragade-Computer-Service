import { db } from "./firebase-config.js";

import {

collection,
addDoc,
getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveCategory=document.getElementById("saveCategory");

async function loadCategories(){

const categoriesList=document.getElementById("categoriesList");

categoriesList.innerHTML="";

const snapshot=await getDocs(collection(db,"categories"));

snapshot.forEach((item)=>{

const data=item.data();

categoriesList.innerHTML+=`

<div class="card">

<h3>${data.name}</h3>

</div>

`;

});

}
saveCategory.addEventListener("click", async () => {

const name = document.getElementById("categoryName").value;

if(name === ""){

alert("Enter Category Name");

return;

}

await addDoc(collection(db,"categories"),{

name,
createdAt:new Date()

});

alert("Category Saved Successfully");

document.getElementById("categoryName").value="";

loadCategories();

});
loadCategories();

window.addEventListener("DOMContentLoaded", () => {

loadCategories();

});
window.refreshCategories = function(){

loadCategories();

};

window.clearCategoryForm = function(){

document.getElementById("categoryName").value="";

};
window.addEventListener("load", () => {

loadCategories();

});

export {

loadCategories

};
