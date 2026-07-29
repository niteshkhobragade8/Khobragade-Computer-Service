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
