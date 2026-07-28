const uploadBtn = document.getElementById("uploadImage");
const imageInput = document.getElementById("imageUpload");
const imagesList = document.getElementById("imagesList");

if (uploadBtn) {
  uploadBtn.addEventListener("click", () => {

    if (!imageInput.files.length) {
      alert("Please select an image.");
      return;
    }

    const file = imageInput.files[0];

    imagesList.innerHTML = `
      <div class="card">
        <img src="./images/${file.name}"
        style="width:100%;max-width:300px;border-radius:10px;">
        <h3>${file.name}</h3>
      </div>
    `;

  });
}
