import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const saveButton =
    document.getElementById("saveNotificationFinal");

const notificationList =
    document.getElementById("notificationListFinal");

const titleInput =
    document.getElementById("notificationTitle");

const descriptionInput =
    document.getElementById("notificationDescription");

const typeInput =
    document.getElementById("notificationType");

const priorityInput =
    document.getElementById("notificationPriority");


let editId = null;
let notifications = [];


function safeText(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


async function loadNotifications() {

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML =
        "<p>Loading Notifications...</p>";

    try {

        const snapshot =
            await getDocs(
                collection(db, "notifications")
            );

        notifications = [];

        snapshot.forEach(function (documentItem) {

            notifications.push({
                id: documentItem.id,
                ...documentItem.data()
            });

        });

        displayNotifications();

        const total =
            document.getElementById(
                "totalNotifications"
            );

        const published =
            document.getElementById(
                "publishedNotifications"
            );

        const draft =
            document.getElementById(
                "draftNotifications"
            );

        if (total) {
            total.textContent =
                notifications.length;
        }

        if (published) {

            published.textContent =
                notifications.filter(function (item) {

                    return item.status === "Published";

                }).length;

        }

        if (draft) {

            draft.textContent =
                notifications.filter(function (item) {

                    return item.status === "Draft";

                }).length;

        }

    } catch (error) {

        console.error(
            "Notification Load Error:",
            error
        );

        notificationList.innerHTML = `
            <div class="notification-card">
                <h3>Notifications Load Failed</h3>
                <p>${safeText(error.message)}</p>
            </div>
        `;

    }

}


function displayNotifications() {

    notificationList.innerHTML = "";

    if (notifications.length === 0) {

        notificationList.innerHTML = `
            <div class="notification-card">
                <h3>No Notifications Available</h3>
                <p>Create your first notification.</p>
            </div>
        `;

        return;

    }

    notifications.forEach(function (item) {

        const card =
            document.createElement("div");

        card.className = "notification-card";

        card.innerHTML = `

            <h3>${safeText(item.title)}</h3>

            <p>
                ${safeText(item.description)}
            </p>

            <small>
                ${safeText(item.type)}
                |
                ${safeText(item.priority)}
                |
                ${safeText(item.status)}
            </small>

            <div class="actions">

                <button
                    type="button"
                    data-action="edit"
                    data-id="${item.id}">

                    ✏️ Edit

                </button>

                <button
                    type="button"
                    data-action="delete"
                    data-id="${item.id}">

                    🗑 Delete

                </button>

            </div>

        `;

        notificationList.appendChild(card);

    });

}


async function saveNotification() {

    const title =
        titleInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const type =
        typeInput.value;

    const priority =
        priorityInput.value;

    if (
        title === "" ||
        description === ""
    ) {

        alert("Title and Description भरें");

        return;

    }

    saveButton.disabled = true;

    try {

        if (editId) {

            await updateDoc(
                doc(
                    db,
                    "notifications",
                    editId
                ),
                {
                    title,
                    description,
                    type,
                    priority,
                    status: "Published",
                    updatedAt: serverTimestamp()
                }
            );

            alert("Notification Updated");

        } else {

            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                {
                    title,
                    description,
                    type,
                    priority,
                    status: "Published",
                    createdAt: serverTimestamp()
                }
            );

            alert("Notification Saved");

        }

        editId = null;

        titleInput.value = "";
        descriptionInput.value = "";
        typeInput.selectedIndex = 0;
        priorityInput.selectedIndex = 0;

        saveButton.textContent =
            "Save Notification";

        await loadNotifications();

    } catch (error) {

        console.error(
            "Notification Save Error:",
            error
        );

        alert(
            "Save Failed: " + error.message
        );

    } finally {

        saveButton.disabled = false;

    }

}


async function deleteNotification(id) {

    if (!confirm("Delete this notification?")) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "notifications", id)
        );

        alert("Notification Deleted");

        await loadNotifications();

    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            "Delete Failed: " + error.message
        );

    }

}


function editNotification(id) {

    const selected =
        notifications.find(function (item) {

            return item.id === id;

        });

    if (!selected) {
        return;
    }

    editId = id;

    titleInput.value =
        selected.title || "";

    descriptionInput.value =
        selected.description || "";

    typeInput.value =
        selected.type || "popup";

    priorityInput.value =
        selected.priority || "normal";

    saveButton.textContent =
        "Update Notification";

    titleInput.scrollIntoView({
        behavior: "smooth"
    });

}


if (saveButton) {

    saveButton.addEventListener(
        "click",
        saveNotification
    );

}


if (notificationList) {

    notificationList.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.id;

            const action =
                button.dataset.action;

            if (action === "edit") {
                editNotification(id);
            }

            if (action === "delete") {
                deleteNotification(id);
            }

        }
    );

}


const refreshButton =
    document.getElementById(
        "refreshNotifications"
    );

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadNotifications
    );

}


loadNotifications();
