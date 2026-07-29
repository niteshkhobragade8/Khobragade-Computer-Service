import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const saveNotificationButton =
    document.getElementById("saveNotification");

const notificationList =
    document.getElementById("notificationList");

const notificationTitle =
    document.getElementById("notificationTitle");

const notificationDescription =
    document.getElementById("notificationDescription");

const notificationType =
    document.getElementById("notificationType");

const notificationPriority =
    document.getElementById("notificationPriority");

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

const refreshNotificationsButton =
    document.getElementById("refreshNotifications");


const notificationsCollection =
    collection(db, "notifications");

let allNotifications = [];

let editNotificationId = null;

let unsubscribeNotifications = null;


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatNotificationDate(value) {

    if (!value) {
        return "Date not available";
    }

    try {

        if (typeof value.toDate === "function") {

            return value
                .toDate()
                .toLocaleString();

        }

        if (value.seconds) {

            return new Date(
                value.seconds * 1000
            ).toLocaleString();

        }

        return new Date(value)
            .toLocaleString();

    } catch (error) {

        return "Date not available";

    }

}


function sortNotifications(notifications) {

    return notifications.sort(
        function (first, second) {

            const firstTime =
                first.createdAt?.seconds ||
                first.updatedAt?.seconds ||
                0;

            const secondTime =
                second.createdAt?.seconds ||
                second.updatedAt?.seconds ||
                0;

            return secondTime - firstTime;

        }
    );

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
                    Publish your first notification.
                </p>

            </div>

        `;

        return;

    }

    notifications.forEach(
        function (notification) {

            const card =
                document.createElement("div");

            card.className =
                "notification-card";

            card.innerHTML = `

                <h3>
                    ${escapeHTML(notification.title)}
                </h3>

                <p>
                    ${escapeHTML(notification.description)}
                </p>

                <small>

                    ${escapeHTML(
                        notification.type || "popup"
                    )}

                    |

                    ${escapeHTML(
                        notification.priority || "normal"
                    )}

                    |

                    ${escapeHTML(
                        notification.status || "Published"
                    )}

                </small>

                <p>

                    <small>

                        ${escapeHTML(
                            formatNotificationDate(
                                notification.createdAt
                            )
                        )}

                    </small>

                </p>

                <div class="actions">

                    <button
                        type="button"
                        data-action="edit"
                        data-id="${notification.id}">

                        ✏️ Edit

                    </button>

                    <button
                        type="button"
                        data-action="delete"
                        data-id="${notification.id}">

                        🗑 Delete

                    </button>

                </div>

            `;

            notificationList.appendChild(card);

        }
    );

}
function updateNotificationCounters() {

    if (totalNotifications) {
        totalNotifications.textContent =
            allNotifications.length;
    }

    if (publishedNotifications) {

        publishedNotifications.textContent =
            allNotifications.filter(function (item) {

                return (
                    item.status || "Published"
                ) === "Published";

            }).length;

    }

    if (draftNotifications) {

        draftNotifications.textContent =
            allNotifications.filter(function (item) {

                return item.status === "Draft";

            }).length;

    }

}


function displayNotificationHistory() {

    if (!notificationHistory) {
        return;
    }

    notificationHistory.innerHTML = "";

    if (allNotifications.length === 0) {

        notificationHistory.innerHTML =
            "<p>No History Available</p>";

        return;

    }

    allNotifications.forEach(function (item) {

        notificationHistory.innerHTML += `

            <div class="notification-card">

                <h3>
                    ${escapeHTML(item.title)}
                </h3>

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


function renderNotifications() {

    displayNotifications(allNotifications);

    updateNotificationCounters();

    displayNotificationHistory();

}


async function loadNotifications() {

    if (notificationList) {

        notificationList.innerHTML = `

            <div class="notification-card">

                <h3>Loading...</h3>

            </div>

        `;

    }

    try {

        const snapshot =
            await getDocs(notificationsCollection);

        allNotifications = [];

        snapshot.forEach(function (item) {

            allNotifications.push({

                id: item.id,

                ...item.data()

            });

        });

        allNotifications =
            sortNotifications(allNotifications);

        renderNotifications();

    } catch (error) {

        console.error(error);

        notificationList.innerHTML = `

            <div class="notification-card">

                <h3>Failed To Load Notifications</h3>

                <p>${escapeHTML(error.message)}</p>

            </div>

        `;

    }

}


function startRealtimeNotifications() {

    if (unsubscribeNotifications) {

        unsubscribeNotifications();

    }

    unsubscribeNotifications =
    onSnapshot(

        notificationsCollection,

        function (snapshot) {

            console.log("Documents:", snapshot.size);

            allNotifications = [];

            snapshot.forEach(function (item) {

                allNotifications.push({
                    id: item.id,
                    ...item.data()
                });

            });

            console.log(allNotifications);

            allNotifications =
                sortNotifications(allNotifications);

            renderNotifications();

        },

        function (error) {

            console.error("Notification Error:", error);

        }

    );

}
function updateLivePreview() {

    if (!notificationPreview) {
        return;
    }

    const title =
        notificationTitle?.value.trim() ||
        "Notification Title";

    const description =
        notificationDescription?.value.trim() ||
        "Notification Preview";

    const type =
        notificationType?.value ||
        "popup";

    const priority =
        notificationPriority?.value ||
        "normal";

    notificationPreview.innerHTML = `

        <h2>👁 Live Preview</h2>

        <h3>${escapeHTML(title)}</h3>

        <p>${escapeHTML(description)}</p>

        <small>

            ${escapeHTML(type)}

            |

            ${escapeHTML(priority)}

        </small>

    `;

}


function resetNotificationForm() {

    notificationTitle.value = "";

    notificationDescription.value = "";

    notificationType.selectedIndex = 0;

    notificationPriority.selectedIndex = 0;

    editNotificationId = null;

    saveNotificationButton.textContent =
        "Publish Notification";

    saveNotificationButton.disabled = false;

    updateLivePreview();

}


async function saveOrUpdateNotification() {

    const title =
        notificationTitle.value.trim();

    const description =
        notificationDescription.value.trim();

    const type =
        notificationType.value;

    const priority =
        notificationPriority.value;

    if (!title || !description) {

        alert(
            "Notification Title aur Description bhariye."
        );

        return;

    }

    saveNotificationButton.disabled = true;

    saveNotificationButton.textContent =
        editNotificationId
            ? "Updating..."
            : "Publishing...";

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

                    updatedAt:
                        serverTimestamp()

                }

            );

            alert(
                "Notification Updated Successfully"
            );

        } else {

            await addDoc(

                notificationsCollection,

                {

                    title,

                    description,

                    type,

                    priority,

                    status: "Published",

                    createdAt:
                        serverTimestamp()

                }

            );

            alert(
                "Notification Published Successfully"
            );

        }

        resetNotificationForm();

    } catch (error) {

        console.error(error);

        alert(
            "Error : " +
            error.message
        );

        saveNotificationButton.disabled = false;

        saveNotificationButton.textContent =
            editNotificationId
                ? "Update Notification"
                : "Publish Notification";

    }

}
function editNotification(id) {

    const notification =
        allNotifications.find(function (item) {

            return item.id === id;

        });

    if (!notification) {
        return;
    }

    editNotificationId = id;

    notificationTitle.value =
        notification.title || "";

    notificationDescription.value =
        notification.description || "";

    notificationType.value =
        notification.type || "popup";

    notificationPriority.value =
        notification.priority || "normal";

    saveNotificationButton.textContent =
        "Update Notification";

    updateLivePreview();

}


async function deleteNotification(id) {

    const ok =
        confirm("Delete this notification?");

    if (!ok) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "notifications", id)
        );

        alert(
            "Notification Deleted Successfully"
        );

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


async function publishAllNotifications() {

    if (allNotifications.length === 0) {

        alert("No Notifications Available");

        return;

    }

    try {

        const batch =
            writeBatch(db);

        allNotifications.forEach(function (item) {

            batch.update(

                doc(
                    db,
                    "notifications",
                    item.id
                ),

                {

                    status: "Published",

                    updatedAt:
                        serverTimestamp()

                }

            );

        });

        await batch.commit();

        alert(
            "All Notifications Published"
        );

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


async function deleteAllNotifications() {

    if (allNotifications.length === 0) {

        alert("No Notifications Available");

        return;

    }

    const ok =
        confirm(
            "Delete All Notifications?"
        );

    if (!ok) {
        return;
    }

    try {

        const batch =
            writeBatch(db);

        allNotifications.forEach(function (item) {

            batch.delete(

                doc(
                    db,
                    "notifications",
                    item.id
                )

            );

        });

        await batch.commit();

        alert(
            "All Notifications Deleted"
        );

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


saveNotificationButton?.addEventListener(

    "click",

    saveOrUpdateNotification

);


notificationList?.addEventListener(

    "click",

    function (event) {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;

        if (action === "edit") {

            editNotification(id);

        }

        if (action === "delete") {

            deleteNotification(id);

        }

    }

);


publishAllButton?.addEventListener(

    "click",

    publishAllNotifications

);


deleteAllButton?.addEventListener(

    "click",

    deleteAllNotifications

);


refreshNotificationsButton?.addEventListener(

    "click",

    loadNotifications

);


[
    notificationTitle,
    notificationDescription,
    notificationType,
    notificationPriority

].forEach(function (element) {

    if (!element) {
        return;
    }

    element.addEventListener(
        "input",
        updateLivePreview
    );

    element.addEventListener(
        "change",
        updateLivePreview
    );

});


updateLivePreview();

startRealtimeNotifications();

export {

    loadNotifications

};
