import { db } from "./firebase-config.js";

import {
collection,
addDoc,
getDocs,
doc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveCategory = document.getElementById("saveCategory");

let editId = null;

async function loadCategories(){

const categoriesList = document.getElementById("categoriesList");

categoriesList.innerHTML = "";

const snapshot = await getDocs(collection(db,"categories"));

if(snapshot.empty){

categoriesList.innerHTML = "No Categories Available";

return;

}

snapshot.forEach((item)=>{

const data = item.data();

categoriesList.innerHTML += `

<div class="card">

<h3>${data.name}</h3>

<br>

<button onclick="editCategory('${item.id}')">
✏️ Edit
</button>

<button
onclick="deleteCategory('${item.id}')"
style="background:#dc2626;margin-left:8px;">
🗑 Delete
</button>

</div>

`;

});

}

saveCategory.addEventListener("click", async ()=>{

const name = document.getElementById("categoryName").value.trim();

if(name===""){

alert("Enter Category Name");

return;

}

if(editId){

await updateDoc(doc(db,"categories",editId),{

name

});

alert("Category Updated Successfully");

editId = null;

saveCategory.innerText = "Save Category";

}else{

await addDoc(collection(db,"categories"),{

name,
createdAt:new Date()

});

alert("Category Saved Successfully");

}

clearCategoryForm();

loadCategories();

});

window.editCategory = async function(id){

const snapshot = await getDocs(collection(db,"categories"));

snapshot.forEach((item)=>{

if(item.id===id){

const data=item.data();

document.getElementById("categoryName").value=data.name;

editId=id;

saveCategory.innerText="Update Category";

}

});

};

window.deleteCategory = async function(id){

if(!confirm("Delete this category?")){

return;

}

await deleteDoc(doc(db,"categories",id));

alert("Category Deleted Successfully");

loadCategories();

};

window.refreshCategories = function(){

loadCategories();

};

window.clearCategoryForm = function(){

document.getElementById("categoryName").value="";

};

window.addEventListener("DOMContentLoaded",()=>{

loadCategories();

});

export{

loadCategories

};
