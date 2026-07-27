import { db } from "./firebase-config.js";

console.log("YouTube Manager Loaded");

const saveBtn = document.getElementById("saveYoutube");

if (saveBtn) {

saveBtn.addEventListener("click", () => {

const title = document.getElementById("youtubeTitle").value.trim();
const link = document.getElementById("youtubeLink").value.trim();

if (title === "" || link === "") {
alert("Please fill all fields");
return;
}

alert("YouTube Video Saved (Next Step Firebase Save)");

document.getElementById("youtubeTitle").value = "";
document.getElementById("youtubeLink").value = "";

});

}
