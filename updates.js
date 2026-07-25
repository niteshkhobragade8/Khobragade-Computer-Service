import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveBtn = document.getElementById("saveUpdate");

async function loadUpdates() {

    const updatesList = document.getElementById("updatesList");

    updatesList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "updates"));

    querySnapshot.forEach((doc) => {

        const data = doc.data();

        updatesList.innerHTML += `

<div class="card">

<h3>${data.title}</h3>

<p>${data.description}</p>

<small>${data.category}</small>

<br><br>
<button onclick="editUpdate('${doc.id}','${data.title}','${data.description}','${data.category}')">
✏️ Edit
</button>

&nbsp;

<button onclick="deleteUpdate('${doc.id}')">
🗑 Delete
</button>

</div>

`;

    });

}

saveBtn.addEventListener("click", async () => {

    const title = document.getElementById("updateTitle").value;

    const description = document.getElementById("updateDescription").value;

    const category = document.getElementById("updateCategory").value;

    if(title==="" || description===""){

        alert("Fill all fields");

        return;

    }

    if (editId) {

    await updateDoc(doc(db, "updates", editId), {

        title,
        description,
        category

    });

    alert("Update Successfully");

    editId = null;

    document.getElementById("saveUpdate").innerText = "Save Update";

} else {

    await addDoc(collection(db, "updates"), {

        title,
        description,
        category,
        status: "Published",
        createdAt: new Date()

    });

    alert("Update Saved Successfully");

}


    document.getElementById("updateTitle").value="";
    document.getElementById("updateDescription").value="";

    loadUpdates();

});

loadUpdates();
window.deleteUpdate = async function(id){

    if(!confirm("Are you sure you want to delete this update?")){
        return;
    }

    try{

        await deleteDoc(doc(db,"updates",id));

        alert("Update Deleted Successfully");

        loadUpdates();

    }catch(error){

        alert(error.message);

    }

}
let editId = null;

window.editUpdate = function(id, title, description, category) {

    editId = id;

    document.getElementById("updateTitle").value = title;
    document.getElementById("updateDescription").value = description;
    document.getElementById("updateCategory").value = category;

    document.getElementById("saveUpdate").innerText = "Update";

}
