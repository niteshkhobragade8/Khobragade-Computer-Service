let allImages = [];

async function loadImages() {
    const imagesList = document.getElementById("imagesList");

    try {
        const response = await fetch("./images/images.json");

        if (!response.ok) {
            throw new Error("images.json load नहीं हुई");
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

    if (images.length === 0) {
        imagesList.innerHTML = "<p>No Images Available</p>";
        return;
    }

    imagesList.innerHTML = "";

    function previewImage(url) {
    window.open(url, "_blank");
}

function copyImageLink(url) {
    const fullUrl = new URL(url, window.location.href).href;

    navigator.clipboard.writeText(fullUrl)
        .then(function() {
            alert("Image Link Copied");
        })
        .catch(function() {
            alert("Link Copy Failed");
        });
}

function searchImages() {
    const searchBox = document.getElementById("searchImage");
    const text = searchBox.value.trim().toLowerCase();

    if (text === "") {
        displayImages(allImages);
        return;
    }

    const filteredImages = allImages.filter(function(img) {
        return img.name.toLowerCase().includes(text);
    });

    displayImages(filteredImages);
}

document.addEventListener("DOMContentLoaded", function() {
    loadImages();

    const searchButton = document.getElementById("searchImageBtn");
    const searchBox = document.getElementById("searchImage");

    searchButton.addEventListener("click", searchImages);

    searchBox.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            searchImages();
        }
    });
});
