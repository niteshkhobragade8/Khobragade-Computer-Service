import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const saveNotification =
    document.getElementById("saveNotification");

const notificationList =
    document.getElementById("notificationList");

const totalNotifications =
    document.getElementById("totalNotifications");

const publishedNotifications =
    document.getElementById("publishedNotifications");

const draftNotifications =
    document.getElementById("draftNotifications");

const notificationPreview =
    document.getElementById("notificationPreview");

const notificationHistory =
    document.getElementById("notificationHistory");

const publishAllButton =
    document.getElementById("publishAll");

const deleteAllButton =
    document.getElementById("deleteAll");

const refreshButton =
    document.getElementById("refreshNotifications");


let editNotificationId = null;

let allNotifications = [];


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatNotificationDate(createdAt) {

    if (!createdAt) {
        return "Date not available";
    }

    try {

        if (typeof createdAt.toDate === "function") {

            return createdAt.toDate().toLocaleString();

        }

        return new Date(createdAt).toLocaleString();

    } catch (error) {

        return "Date not available";

    }

}


async function loadNotifications() {

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML = `
        <div class="notification-card">
            <h3>Loading Notifications...</h3>
        </div>
    `;

    try {

        const snapshot =
            await getDocs(collection(db, "notifications"));

        allNotifications = [];

        snapshot.forEach((item) => {

            allNotifications.push({

                id: item.id,

                ...item.data()

            });

        });

        allNotifications.sort((first, second) => {

            const firstTime =
                first.createdAt?.seconds || 0;

            const secondTime =
                second.createdAt?.seconds || 0;

            return secondTime - firstTime;

        });

        displayNotifications(allNotifications);

        updateNotificationCounters();

        displayNotificationHistory();

    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

        notificationList.innerHTML = `
            <div class="notification-card">

                <h3>Failed to Load Notifications</h3>

                <p>
                    Firebase connection or Firestore permission
                    problem.
                </p>

            </div>
        `;

    }

}


function displayNotifications(notifications) {

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML = "";

    if (notifications.length === 0) {

        notificationList.innerHTML = `
            <div class="notification-card">

                <h3>No Notifications Available</h3>

                <p>
                    Create and publish your first notification.
                </p>

            </div>
        `;

        return;

    }

    notifications.forEach((notification) => {

        const card =
            document.createElement("div");

        card.className =
            "notification-card";

        const title =
            escapeHTML(notification.title);

        const description =
            escapeHTML(notification.description);

        const type =
            escapeHTML(notification.type || "popup");

        const priority =
            escapeHTML(notification.priority || "normal");

        const status =
            escapeHTML(notification.status || "Published");

        const date =
            escapeHTML(
                formatNotificationDate(
                    notification.createdAt
                )
            );

        card.innerHTML = `

            <h3>${title}</h3>

            <p>${description}</p>

            <small>
                ${type} | ${priority} | ${status}
            </small>

            <p>
                <small>${date}</small>
            </p>

            <div class="actions">

                <button
                    type="button"
                    onclick="editNotification('${notification.id}')">

                    ✏️ Edit

                </button>

                <button
                    type="button"
                    onclick="deleteNotification('${notification.id}')">

                    🗑 Delete

                </button>

            </div>

        `;

        notificationList.appendChild(card);

    });

}
function resetNotificationForm() {

    const titleInput =
        document.getElementById("notificationTitle");

    const descriptionInput =
        document.getElementById("notificationDescription");

    const typeInput =
        document.getElementById("notificationType");

    const priorityInput =
        document.getElementById("notificationPriority");

    if (titleInput) {
        titleInput.value = "";
    }

    if (descriptionInput) {
        descriptionInput.value = "";
    }

    if (typeInput) {
        typeInput.selectedIndex = 0;
    }

    if (priorityInput) {
        priorityInput.selectedIndex = 0;
    }

    editNotificationId = null;

    if (saveNotification) {
        saveNotification.innerText =
            "Save Notification";
    }

}


function updateLivePreview() {

    if (!notificationPreview) {
        return;
    }

    const title =
        document
            .getElementById("notificationTitle")
            ?.value
            .trim();

    const description =
        document
            .getElementById("notificationDescription")
            ?.value
            .trim();

    const type =
        document
            .getElementById("notificationType")
            ?.value;

    const priority =
        document
            .getElementById("notificationPriority")
            ?.value;

    notificationPreview.innerHTML = `

        <h2>👁 Live Preview</h2>

        <h3>
            ${escapeHTML(title || "Notification Title")}
        </h3>

        <p>
            ${
                escapeHTML(
                    description ||
                    "Notification Preview will appear here..."
                )
            }
        </p>

        <small>
            ${escapeHTML(type || "popup")}
            |
            ${escapeHTML(priority || "normal")}
        </small>

    `;

}


async function saveOrUpdateNotification() {

    const titleInput =
        document.getElementById("notificationTitle");

    const descriptionInput =
        document.getElementById("notificationDescription");

    const typeInput =
        document.getElementById("notificationType");

    const priorityInput =
        document.getElementById("notificationPriority");

    if (
        !titleInput ||
        !descriptionInput ||
        !typeInput ||
        !priorityInput
    ) {

        alert("Notification form not found.");

        return;

    }

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

        alert("Fill all fields");

        return;

    }

    if (saveNotification) {

        saveNotification.disabled = true;

        saveNotification.innerText =
            editNotificationId
                ? "Updating..."
                : "Saving...";

    }

    try {

        if (editNotificationId) {

            await updateDoc(

                doc(
                    db,
                    "notifications",
                    editNotificationId
                ),

                {
                    title,
                    description,
                    type,
                    priority,
                    status: "Published",
                    updatedAt: new Date()
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
                    createdAt: new Date()
                }

            );

            alert("Notification Saved");

        }

        resetNotificationForm();

        updateLivePreview();

        await loadNotifications();

    } catch (error) {

        console.error(
            "Notification save error:",
            error
        );

        alert(
            "Notification save failed. Check Firebase permission."
        );

    } finally {

        if (saveNotification) {

            saveNotification.disabled = false;

            saveNotification.innerText =
                editNotificationId
                    ? "Update Notification"
                    : "Save Notification";

        }

    }

}


if (saveNotification) {

    saveNotification.addEventListener(
        "click",
        saveOrUpdateNotification
    );

}
function updateNotificationCounters() {

    if (totalNotifications) {
        totalNotifications.innerText =
            allNotifications.length;
    }

    if (publishedNotifications) {

        publishedNotifications.innerText =
            allNotifications.filter(function (item) {

                return item.status === "Published";

            }).length;

    }

    if (draftNotifications) {

        draftNotifications.innerText =
            allNotifications.filter(function (item) {

                return item.status === "Draft";

            }).length;

    }

}


function displayNotificationHistory() {

    if (!notificationHistory) {
        return;
    }

    if (allNotifications.length === 0) {

        notificationHistory.innerHTML = `
            <p>No History Available</p>
        `;

        return;

    }

    notificationHistory.innerHTML = "";

    allNotifications.forEach(function (item) {

        notificationHistory.innerHTML += `

            <div class="notification-card">

                <h3>${escapeHTML(item.title)}</h3>

                <p>
                    Status :
                    ${escapeHTML(item.status || "Published")}
                </p>

                <small>
                    ${formatNotificationDate(item.createdAt)}
                </small>

            </div>

        `;

    });

}


window.editNotification = async function (id) {

    const selected =
        allNotifications.find(function (item) {

            return item.id === id;

        });

    if (!selected) {
        return;
    }

    editNotificationId = id;

    document.getElementById("notificationTitle").value =
        selected.title;

    document.getElementById("notificationDescription").value =
        selected.description;

    document.getElementById("notificationType").value =
        selected.type;

    document.getElementById("notificationPriority").value =
        selected.priority;

    if (saveNotification) {
        saveNotification.innerText =
            "Update Notification";
    }

    updateLivePreview();

};


window.deleteNotification = async function (id) {

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

        console.error(error);

        alert("Delete failed.");

    }

};
if (publishAllButton) {

    publishAllButton.addEventListener(
        "click",
        async function () {

            try {

                for (const item of allNotifications) {

                    await updateDoc(
                        doc(
                            db,
                            "notifications",
                            item.id
                        ),
                        {
                            status: "Published"
                        }
                    );

                }

                alert("All Notifications Published");

                await loadNotifications();

            } catch (error) {

                console.error(error);

                alert("Publish All Failed");

            }

        }
    );

}


if (deleteAllButton) {

    deleteAllButton.addEventListener(
        "click",
        async function () {

            if (
                !confirm(
                    "Delete all notifications?"
                )
            ) {
                return;
            }

            try {

                for (const item of allNotifications) {

                    await deleteDoc(
                        doc(
                            db,
                            "notifications",
                            item.id
                        )
                    );

                }

                alert("All Notifications Deleted");

                await loadNotifications();

            } catch (error) {

                console.error(error);

                alert("Delete All Failed");

            }

        }
    );

}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadNotifications
    );

}


[
    "notificationTitle",
    "notificationDescription",
    "notificationType",
    "notificationPriority"
].forEach(function (id) {

    const element =
        document.getElementById(id);

    if (element) {

        element.addEventListener(
            "input",
            updateLivePreview
        );

        element.addEventListener(
            "change",
            updateLivePreview
        );

    }

});


window.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateLivePreview();

        await loadNotifications();

    }
);


export {

    loadNotifications

};
