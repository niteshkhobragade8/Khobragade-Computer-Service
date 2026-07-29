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

let editNotificationId = null;

async function loadNotifications() {

    const notificationList =
        document.getElementById("notificationList");

    const latestNotifications =
        document.getElementById("latestNotifications");

    const notificationCount =
        document.getElementById("notificationCount");

    const totalNotifications =
        document.getElementById("totalNotifications");

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML = "";

    if (latestNotifications) {
        latestNotifications.innerHTML = "";
    }

    const snapshot =
        await getDocs(collection(db, "notifications"));

    if (notificationCount) {
        notificationCount.innerText = snapshot.size;
    }

    if (totalNotifications) {
        totalNotifications.innerText = snapshot.size;
    }

    snapshot.forEach((item) => {

        const data = item.data();

        if (latestNotifications) {

            latestNotifications.innerHTML += `
                <div class="notification-item">
                    <b>${data.title}</b><br>
                    <small>${data.type}</small>
                </div>
            `;

        }

        notificationList.innerHTML += `

            <div class="notification-card">

                <h3>${data.title}</h3>

                <p>${data.description}</p>

                <small>
                    ${data.type} |
                    ${data.priority}
                </small>

                <div class="actions">

                    <button onclick="editNotification('${item.id}')">
                        ✏️ Edit
                    </button>

                    <button onclick="deleteNotification('${item.id}')">
                        🗑 Delete
                    </button>

                </div>

            </div>

        `;

    });

    if (snapshot.size === 0) {

        notificationList.innerHTML = `
            <div class="notification-card">
                <h3>No Notifications Found</h3>
            </div>
        `;

        if (latestNotifications) {

            latestNotifications.innerHTML = `
                <div class="notification-item">
                    No Notifications
                </div>
            `;

        }

    }

}
saveNotification.addEventListener("click", async () => {

    const title =
        document.getElementById("notificationTitle").value.trim();

    const description =
        document.getElementById("notificationDescription").value.trim();

    const type =
        document.getElementById("notificationType").value;

    const priority =
        document.getElementById("notificationPriority").value;

    if (title === "" || description === "") {

        alert("Fill all fields");

        return;

    }

    if (editNotificationId) {

        await updateDoc(
            doc(db, "notifications", editNotificationId),
            {
                title,
                description,
                type,
                priority
            }
        );

        alert("Notification Updated");

        editNotificationId = null;

        saveNotification.innerText = "Save Notification";

    } else {

        await addDoc(
            collection(db, "notifications"),
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

    document.getElementById("notificationTitle").value = "";
    document.getElementById("notificationDescription").value = "";
    document.getElementById("notificationType").selectedIndex = 0;
    document.getElementById("notificationPriority").selectedIndex = 0;

    loadNotifications();

});

window.deleteNotification = async function (id) {

    if (!confirm("Delete this notification?")) {
        return;
    }

    await deleteDoc(doc(db, "notifications", id));

    alert("Notification Deleted");

    loadNotifications();

};

window.editNotification = async function (id) {

    const snapshot =
        await getDocs(collection(db, "notifications"));

    snapshot.forEach((item) => {

        if (item.id === id) {

            const data = item.data();

            editNotificationId = id;

            document.getElementById("notificationTitle").value =
                data.title;

            document.getElementById("notificationDescription").value =
                data.description;

            document.getElementById("notificationType").value =
                data.type;

            document.getElementById("notificationPriority").value =
                data.priority;

            saveNotification.innerText =
                "Update Notification";

        }

    });

};
window.addEventListener("DOMContentLoaded", () => {

    loadNotifications();

    window.refreshNotificationPanel = function () {

        loadNotifications();

    };

});

const bell =
    document.getElementById("notificationBell");

const dropdown =
    document.getElementById("notificationDropdown");

if (bell && dropdown) {

    bell.addEventListener("click", () => {

        if (dropdown.style.display === "block") {

            dropdown.style.display = "none";

        } else {

            dropdown.style.display = "block";

        }

    });

}

export {

    loadNotifications

};
