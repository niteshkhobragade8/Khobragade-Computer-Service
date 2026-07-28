let allImages = [];

async function loadImages() {
    const imagesList = document.getElementById("imagesList");

    try {
        const response = await fetch("./images/images.json");
        allImages = await response.json();

        displayImages(allImages);

    } catch (e) {
        imagesList.innerHTML = "<p>Failed to load images.</p>";
        console.error(e);
    }
}

function displayImages(images) {
    const imagesList = document.getElementById("imagesList");

    if (images.length === 0) {
        imagesList.innerHTML = "<p>No Images Available</p>";
        return;
    }

    imagesList.innerHTML = "";

    images.forEach(img => {
        imagesList.innerHTML += `
            <div class="image-card">
                <img src="${img.url}" alt="${img.name}">
                <p>${img.name}</p>
            </div>
        `;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadImages();

    document.getElementById("searchImage").addEventListener("input", function () {
        const text = this.value.toLowerCase();

        const filtered = allImages.filter(img =>
            img.name.toLowerCase().includes(text)
        );

        displayImages(filtered);
    });
});
