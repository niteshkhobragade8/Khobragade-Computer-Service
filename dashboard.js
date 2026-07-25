import { db } from "./firebase-config.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const saveBtn = document.getElementById("saveUpdate");

saveBtn.addEventListener("click", async () => {

    const title = document.getElementById("updateTitle").value;
    const description = document.getElementById("updateDescription").value;
    const category = document.getElementById("updateCategory").value;

    if(title === "" || description === ""){
        alert("Please fill all fields");
        return;
    }

    try{

        await addDoc(collection(db,"updates"),{

            title:title,
            description:description,
            category:category,
            status:"Published",
            createdAt:new Date()

        });

        alert("Update Saved Successfully");

        document.getElementById("updateTitle").value="";
        document.getElementById("updateDescription").value="";

    }catch(error){

        alert(error.message);

    }

});
