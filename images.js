let allImages = [];
let selectedImage = null;

async function loadImages() {
    const imagesList = document.getElementById("imagesList");

    if (!imagesList) {
        console.error("imagesList element not found");
        return;
    }

    try {
        const response = await fetch("./images/images.json");

        if (!response.ok) {
            throw new Error("images.json load nahi hui");
        }

        allImages = await response.json();
        displayImages(allImages);

    } catch (error) {

        imagesList.innerHTML = `
            <div class="image-error">
                <h3>⚠ Failed to Load Images</h3>
                <p>Please check images.json file.</p>
            </div>
        `;

        console.error(error);
    }
}

function displayImages(images) {

    const imagesList = document.getElementById("imagesList");

    if (!imagesList) return;

    imagesList.innerHTML = "";

    const count = document.createElement("div");
    count.className = "image-count";
    count.innerHTML = `<strong>Total Images : ${images.length}</strong>`;
    imagesList.appendChild(count);

    if (images.length === 0) {

        imagesList.innerHTML += `
            <p>No Images Available</p>
        `;

        return;
    }

    images.forEach(function (img) {

        const imageCard = document.createElement("div");
        imageCard.className = "image-card";

        const image = document.createElement("img");
        image.src = img.url;
        image.alt = img.name;
        image.loading = "lazy";

        const imageName = document.createElement("p");
        imageName.textContent = img.name;

        const actions = document.createElement("div");
        actions.className = "image-actions";

        const previewButton = document.createElement("button");
        previewButton.type = "button";
        previewButton.textContent = "👁 Preview";

        previewButton.onclick = function () {
            previewImage(img.url);
        };

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.textContent = "📋 Copy Link";

        copyButton.onclick = function () {
            copyImageLink(img.url);
        };

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.onclick = function () {
            deleteImage(img.name);
        };

        actions.appendChild(previewButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);

        imageCard.appendChild(image);
        imageCard.appendChild(imageName);
        imageCard.appendChild(actions);

        imagesList.appendChild(imageCard);

    });

}
function previewImage(url) {

    const fullUrl = new URL(url, window.location.href).href;

    window.open(fullUrl, "_blank");

}

async function copyImageLink(url) {

    const fullUrl = new URL(url, window.location.href).href;

    try {

        await navigator.clipboard.writeText(fullUrl);

        alert("✅ Image Link Copied");

    } catch (error) {

        const textArea = document.createElement("textarea");

        textArea.value = fullUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);

        textArea.select();
        document.execCommand("copy");

        document.body.removeChild(textArea);

        alert("✅ Image Link Copied");

    }

}

function deleteImage(name) {

    const permission = confirm(
        "Kya aap is image ko gallery se hatana chahte hain?"
    );

    if (!permission) return;

    allImages = allImages.filter(function (img) {
        return img.name !== name;
    });

    displayImages(allImages);

    alert(
        "Image gallery se hat gayi.\nRefresh karne par image wapas aa jayegi."
    );

}

function previewSelectedImage(file) {

    if (!file) {
        selectedImage = null;
        return;
    }

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = function (e) {

        let preview = document.getElementById("selectedImagePreview");

        if (!preview) {

            preview = document.createElement("img");

            preview.id = "selectedImagePreview";
            preview.style.maxWidth = "220px";
            preview.style.marginTop = "15px";
            preview.style.borderRadius = "10px";
            preview.style.display = "block";
            preview.style.boxShadow = "0 0 10px rgba(0,0,0,.25)";

            const uploadBox = document.querySelector(".image-form");

            if (uploadBox) {
                uploadBox.appendChild(preview);
            }

        }

        preview.src = e.target.result;

    };

    reader.readAsDataURL(file);

}

function uploadSelectedImage() {

    if (!selectedImage) {

        alert("⚠ Pehle Image Select Karo.");

        return;

    }

    alert(
        "✅ Image Select Ho Gayi.\n\nSimple Version Ready.\nGitHub Upload Feature Baad Me Add Karenge."
    );

}
function searchImages() {

    const searchBox = document.getElementById("searchImage");

    if (!searchBox) return;

    const text = searchBox.value.trim().toLowerCase();

    if (text === "") {

        displayImages(allImages);

        return;

    }

    const filteredImages = allImages.filter(function (img) {

        return (
            img.name.toLowerCase().includes(text)
        );

    });

    displayImages(filteredImages);

}

document.addEventListener("DOMContentLoaded", function () {

    loadImages();

    const imageUpload = document.getElementById("imageUpload");

    if (imageUpload) {

        imageUpload.addEventListener("change", function () {

            if (this.files.length > 0) {

                previewSelectedImage(this.files[0]);

            }

        });

    }

    const uploadButton = document.getElementById("uploadImage");

    if (uploadButton) {

        uploadButton.addEventListener("click", uploadSelectedImage);

    }

    const imagesArea = document.getElementById("imagesList");

    if (imagesArea) {

        imagesArea.addEventListener("dragover", function (e) {

            e.preventDefault();

        });

        imagesArea.addEventListener("drop", function (e) {

            e.preventDefault();

            if (e.dataTransfer.files.length > 0) {

                const file = e.dataTransfer.files[0];

                document.getElementById("imageUpload").files =
                    e.dataTransfer.files;

                previewSelectedImage(file);

            }

        });

    }

    const searchButton = document.getElementById("searchImageBtn");
    const searchBox = document.getElementById("searchImage");

    if (searchButton) {

        searchButton.addEventListener("click", searchImages);

    }

    if (searchBox) {

        searchBox.addEventListener("keyup", searchImages);

        searchBox.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                searchImages();

            }

        });

    }

});
