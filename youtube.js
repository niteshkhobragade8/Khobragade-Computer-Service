let allVideos = [];

const YOUTUBE_STORAGE_KEY = "khobragadeCSC_youtube";

function loadVideos() {

    const youtubeList = document.getElementById("youtubeList");

    if (!youtubeList) {
        return;
    }

    try {

        const savedVideos = localStorage.getItem(YOUTUBE_STORAGE_KEY);

        if (savedVideos) {
            allVideos = JSON.parse(savedVideos);
        } else {
            allVideos = [];
        }

        displayVideos(allVideos);

    } catch (error) {

        allVideos = [];

        youtubeList.innerHTML =
            "<p>Failed to load videos.</p>";

        console.error(error);

    }

}

function saveVideos() {

    localStorage.setItem(
        YOUTUBE_STORAGE_KEY,
        JSON.stringify(allVideos)
    );

}

function displayVideos(videos) {

    const youtubeList =
        document.getElementById("youtubeList");

    if (!youtubeList) {
        return;
    }

    youtubeList.innerHTML = "";

    const count = document.createElement("h3");
    count.textContent =
        "Total Videos : " + videos.length;

    youtubeList.appendChild(count);

    if (videos.length === 0) {

        youtubeList.innerHTML +=
            "<p>No Videos Available</p>";

        return;

    }

    videos.forEach(function (video) {

        const card = document.createElement("div");
        card.className = "youtube-card";

        card.innerHTML = `
            <h3>${video.title}</h3>

            <p>${video.description}</p>

            <a href="${video.link}"
               target="_blank">
               ▶ Watch Video
            </a>

            <br><br>

            <button onclick="deleteVideo(${video.id})">
                🗑 Delete
            </button>
        `;

        youtubeList.appendChild(card);

    });

}
function saveVideo() {

    const title =
        document.getElementById("youtubeTitle");

    const link =
        document.getElementById("youtubeLink");

    const description =
        document.getElementById("youtubeDescription");

    if (
        !title ||
        !link ||
        !description
    ) {
        return;
    }

    if (
        title.value.trim() === "" ||
        link.value.trim() === ""
    ) {
        alert("Please fill all required fields.");
        return;
    }

    const video = {

        id: Date.now(),

        title: title.value.trim(),

        link: link.value.trim(),

        description: description.value.trim(),

        createdAt: new Date().toLocaleString()

    };

    allVideos.unshift(video);

    saveVideos();

    displayVideos(allVideos);

    title.value = "";
    link.value = "";
    description.value = "";

    alert("✅ Video Saved Successfully");

}

function deleteVideo(id) {

    const permission = confirm(
        "Delete this video?"
    );

    if (!permission) {
        return;
    }

    allVideos = allVideos.filter(function (video) {
        return video.id !== id;
    });

    saveVideos();

    displayVideos(allVideos);

    alert("Video Deleted Successfully.");

}

window.deleteVideo = deleteVideo;

function searchVideos(text) {

    if (text.trim() === "") {

        displayVideos(allVideos);

        return;

    }

    const filteredVideos =
        allVideos.filter(function (video) {

            return (
                video.title
                    .toLowerCase()
                    .includes(text.toLowerCase()) ||

                video.description
                    .toLowerCase()
                    .includes(text.toLowerCase())
            );

        });

    displayVideos(filteredVideos);

}
document.addEventListener("DOMContentLoaded", function () {

    loadVideos();

    const saveButton =
        document.getElementById("saveYoutube");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveVideo
        );

    }

});
