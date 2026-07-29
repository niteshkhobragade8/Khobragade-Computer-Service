let allImages = [];

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
        imagesList.innerHTML = "<p>Failed to load images.</p>";
        console.error(error);
    }
}

function displayImages(images) {
    const imagesList = document.getElementById("imagesList");

    if (!imagesList) {
        return;
    }

    if (images.length === 0) {
        imagesList.innerHTML = "<p>No Images Available</p>";
        return;
    }

    imagesList.innerHTML = "";

    images.forEach(function (img) {
        const imageCard = document.createElement("div");
        imageCard.className = "image-card";

        const image = document.createElement("img");
        image.src = img.url;
        image.alt = img.name;

        const imageName = document.createElement("p");
        imageName.textContent = img.name;

        const actions = document.createElement("div");
        actions.className = "image-actions";

        const previewButton = document.createElement("button");
        previewButton.type = "button";
        previewButton.textContent = "👁 Preview";

        previewButton.addEventListener("click", function () {
            previewImage(img.url);
        });

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.textContent = "📋 Copy Link";

        copyButton.addEventListener("click", function () {
            copyImageLink(img.url);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.addEventListener("click", function () {
            deleteImage(img.name);
        });

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
        alert("Image Link Copied");
    } catch (error) {
        const textArea = document.createElement("textarea");

        textArea.value = fullUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);

        textArea.select();
        document.execCommand("copy");

        document.body.removeChild(textArea);

        alert("Image Link Copied");
    }
}

function deleteImage(name) {
    const permission = confirm(
        "Kya aap is image ko gallery se hatana chahte hain?"
    );

    if (!permission) {
        return;
    }

    allImages = allImages.filter(function (img) {
        return img.name !== name;
    });

    displayImages(allImages);

    alert(
        "Image gallery se hat gayi. Refresh karne par image wapas aa jayegi."
    );
}

function searchImages() {
    const searchBox = document.getElementById("searchImage");

    if (!searchBox) {
        return;
    }

    const text = searchBox.value.trim().toLowerCase();

    if (text === "") {
        displayImages(allImages);
        return;
    }

    const filteredImages = allImages.filter(function (img) {
        return img.name.toLowerCase().includes(text);
    });

    displayImages(filteredImages);
}

document.addEventListener("DOMContentLoaded", function () {
    loadImages();

    const searchButton = document.getElementById("searchImageBtn");
    const searchBox = document.getElementById("searchImage");

    if (searchButton) {
        searchButton.addEventListener("click", searchImages);
    }

    if (searchBox) {
        searchBox.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                searchImages();
            }
        });
    }
});
