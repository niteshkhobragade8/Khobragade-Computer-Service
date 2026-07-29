let allDocuments = [];
let selectedDocument = null;

const DOCUMENT_STORAGE_KEY = "khobragadeCSC_documents";

function loadDocuments() {
    const documentsList = document.getElementById("documentsList");

    if (!documentsList) {
        console.error("documentsList element not found");
        return;
    }

    try {
        const savedDocuments = localStorage.getItem(DOCUMENT_STORAGE_KEY);

        if (savedDocuments) {
            allDocuments = JSON.parse(savedDocuments);
        } else {
            allDocuments = [];
        }

        displayDocuments(allDocuments);

    } catch (error) {
        allDocuments = [];

        documentsList.innerHTML = `
            <div class="document-error">
                <h3>⚠ Documents Load Failed</h3>
                <p>Saved documents could not be loaded.</p>
            </div>
        `;

        console.error("Document load error:", error);
    }
}

function saveDocuments() {
    try {
        localStorage.setItem(
            DOCUMENT_STORAGE_KEY,
            JSON.stringify(allDocuments)
        );
    } catch (error) {
        console.error("Document save error:", error);

        alert(
            "Document save nahi ho paya. File ka size zyada ho sakta hai."
        );
    }
}

function displayDocuments(documents) {
    const documentsList = document.getElementById("documentsList");

    if (!documentsList) {
        return;
    }

    documentsList.innerHTML = "";

    const countBox = document.createElement("div");
    countBox.className = "document-count";
    countBox.innerHTML = `
        <strong>Total Documents: ${documents.length}</strong>
    `;

    documentsList.appendChild(countBox);

    if (documents.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No Documents Available";

        documentsList.appendChild(emptyMessage);
        return;
    }

    documents.forEach(function (documentItem) {
        const documentCard = document.createElement("div");
        documentCard.className = "document-card";

        const documentIcon = document.createElement("div");
        documentIcon.className = "document-icon";
        documentIcon.textContent = getDocumentIcon(
            documentItem.fileType
        );

        const documentInfo = document.createElement("div");
        documentInfo.className = "document-info";

        const documentTitle = document.createElement("h3");
        documentTitle.textContent = documentItem.title;

        const documentName = document.createElement("p");
        documentName.textContent =
            "File: " + documentItem.fileName;

        const documentCategory = document.createElement("p");
        documentCategory.textContent =
            "Category: " + documentItem.category;

        const documentSize = document.createElement("p");
        documentSize.textContent =
            "Size: " + formatFileSize(documentItem.fileSize);

        const documentDate = document.createElement("p");
        documentDate.textContent =
            "Added: " + documentItem.createdAt;

        documentInfo.appendChild(documentTitle);
        documentInfo.appendChild(documentName);
        documentInfo.appendChild(documentCategory);
        documentInfo.appendChild(documentSize);
        documentInfo.appendChild(documentDate);

        const documentActions = document.createElement("div");
        documentActions.className = "document-actions";

        const previewButton = document.createElement("button");
        previewButton.type = "button";
        previewButton.textContent = "👁 Preview";

        previewButton.addEventListener("click", function () {
            previewDocument(documentItem.id);
        });

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.textContent = "⬇ Download";

        downloadButton.addEventListener("click", function () {
            downloadDocument(documentItem.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.addEventListener("click", function () {
            deleteDocument(documentItem.id);
        });

        documentActions.appendChild(previewButton);
        documentActions.appendChild(downloadButton);
        documentActions.appendChild(deleteButton);

        documentCard.appendChild(documentIcon);
        documentCard.appendChild(documentInfo);
        documentCard.appendChild(documentActions);

        documentsList.appendChild(documentCard);
    });
}
function getDocumentIcon(fileType) {
    if (!fileType) {
        return "📄";
    }

    if (fileType.includes("pdf")) {
        return "📕";
    }

    if (
        fileType.includes("word") ||
        fileType.includes("document")
    ) {
        return "📘";
    }

    if (fileType.includes("image")) {
        return "🖼️";
    }

    return "📄";
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) {
        return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    const size = bytes / Math.pow(1024, index);

    return size.toFixed(2) + " " + units[index];
}

function selectDocument(file) {
    if (!file) {
        selectedDocument = null;
        return;
    }

    selectedDocument = file;

    const documentTitle =
        document.getElementById("documentTitle");

    if (
        documentTitle &&
        documentTitle.value.trim() === ""
    ) {
        documentTitle.value = file.name.replace(
            /\.[^/.]+$/,
            ""
        );
    }

    showSelectedDocumentInfo(file);
}

function showSelectedDocumentInfo(file) {
    const documentForm =
        document.querySelector(".document-form");

    if (!documentForm) {
        return;
    }

    let infoBox =
        document.getElementById("selectedDocumentInfo");

    if (!infoBox) {
        infoBox = document.createElement("div");
        infoBox.id = "selectedDocumentInfo";
        infoBox.className = "selected-document-info";

        documentForm.appendChild(infoBox);
    }

    infoBox.innerHTML = `
        <p><strong>Selected File:</strong> ${file.name}</p>
        <p><strong>File Size:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>File Type:</strong> ${file.type || "Unknown"}</p>
    `;
}

function uploadSelectedDocument() {
    const documentTitle =
        document.getElementById("documentTitle");

    const documentCategory =
        document.getElementById("documentCategory");

    if (!selectedDocument) {
        alert("Pehle document select karo.");
        return;
    }

    if (
        !documentTitle ||
        documentTitle.value.trim() === ""
    ) {
        alert("Document title likho.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const newDocument = {
            id: Date.now(),
            title: documentTitle.value.trim(),
            fileName: selectedDocument.name,
            fileType: selectedDocument.type,
            fileSize: selectedDocument.size,
            category: documentCategory
                ? documentCategory.value
                : "Other",
            fileData: event.target.result,
            createdAt: new Date().toLocaleString()
        };

        allDocuments.unshift(newDocument);

        saveDocuments();
        displayDocuments(allDocuments);

        alert("✅ Document successfully added.");

        documentTitle.value = "";

        const documentFile =
            document.getElementById("documentFile");

        if (documentFile) {
            documentFile.value = "";
        }

        if (documentCategory) {
            documentCategory.selectedIndex = 0;
        }

        selectedDocument = null;

        const infoBox =
            document.getElementById("selectedDocumentInfo");

        if (infoBox) {
            infoBox.remove();
        }
    };

    reader.onerror = function () {
        alert("Document read nahi ho paya.");
    };

    reader.readAsDataURL(selectedDocument);
}

function findDocumentById(id) {
    return allDocuments.find(function (documentItem) {
        return documentItem.id === id;
    });
}

function previewDocument(id) {
    const documentItem = findDocumentById(id);

    if (!documentItem) {
        alert("Document nahi mila.");
        return;
    }

    if (!documentItem.fileData) {
        alert("Document preview available nahi hai.");
        return;
    }

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
        alert("Popup blocked hai. Browser me popup allow karo.");
        return;
    }

    if (
        documentItem.fileType &&
        documentItem.fileType.includes("image")
    ) {
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${documentItem.title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;background:#111;text-align:center;">
                <img
                    src="${documentItem.fileData}"
                    alt="${documentItem.title}"
                    style="max-width:100%;max-height:100vh;"
                >
            </body>
            </html>
        `);

        previewWindow.document.close();
        return;
    }

    previewWindow.location.href = documentItem.fileData;
}

function downloadDocument(id) {
    const documentItem = findDocumentById(id);

    if (!documentItem) {
        alert("Document nahi mila.");
        return;
    }

    if (!documentItem.fileData) {
        alert("Download file available nahi hai.");
        return;
    }

    const downloadLink = document.createElement("a");

    downloadLink.href = documentItem.fileData;
    downloadLink.download = documentItem.fileName;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);
}

function deleteDocument(id) {
    const documentItem = findDocumentById(id);

    if (!documentItem) {
        alert("Document nahi mila.");
        return;
    }

    const permission = confirm(
        `"${documentItem.title}" document delete karna hai?`
    );

    if (!permission) {
        return;
    }

    allDocuments = allDocuments.filter(function (item) {
        return item.id !== id;
    });

    saveDocuments();
    displayDocuments(allDocuments);

    alert("✅ Document delete ho gaya.");
}

document.addEventListener("DOMContentLoaded", function () {
    loadDocuments();

    const documentFile =
        document.getElementById("documentFile");

    const uploadButton =
        document.getElementById("uploadDocument");

    if (documentFile) {
        documentFile.addEventListener("change", function () {
            if (this.files.length > 0) {
                selectDocument(this.files[0]);
            } else {
                selectedDocument = null;
            }
        });
    }

    if (uploadButton) {
        uploadButton.addEventListener(
            "click",
            uploadSelectedDocument
        );
    }
});
