async function loadImages() {
    const imagesList = document.getElementById("imagesList");

    try {
        const response = await fetch("./images/images.json");
        const images = await response.json();

        if (images.length === 0) {
            imagesList.innerHTML = "<p>No Images Available</p>";
            return;
        }

        imagesList.innerHTML = "";

        images.forEach(img => {
            imagesList.innerHTML += `
                <div class="image-card">
                    <img src="${img.url}" alt="${img.name}" width="180">
                    <p>${img.name}</p>
                </div>
            `;
        });

    } catch (e) {
        imagesList.innerHTML = "<p>Failed to load images.</p>";
        console.error(e);
    }
}

document.addEventListener("DOMContentLoaded", loadImages);
