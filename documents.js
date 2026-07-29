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
