console.log("Jaib content script loaded");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request); // Added logging

  if (request.action === "extractContent") {
    // When extractContent is received (from popup or background), immediately show saving status
    createStatusUI("saving", "Saving article...");
    extractArticleContent();
  } else if (request.action === "showSaved") {
    // Show "Saved!" UI
    updateStatusUI("saved", `Saved to Jaib: ${request.data.title}`);
    // removeStatusUI will now be triggered by the close button or the timeout
  } else if (request.action === "showSaveError") {
    // Show "Error!" UI
    updateStatusUI("error", `Error saving: ${request.error}`);
    setTimeout(removeStatusUI, 5000); // Error message stays for 5 seconds
  }
});

function extractArticleContent() {
  console.log("Content script: Extracting article..."); // Added logging
  // Wait for Readability to be loaded
  if (typeof Readability === "undefined") {
    setTimeout(extractArticleContent, 100);
    return;
  }

  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (article) {
    console.log("Content script: Article extracted."); // Added logging
    const articleData = {
      title: article.title,
      content: article.content,
      url: window.location.href,
      excerpt: article.excerpt,
      byline: article.byline,
      length: article.length,
      timestamp: new Date().toISOString(),
    };

    // Send the article data to the background script
    chrome.runtime.sendMessage({
      action: "saveArticle",
      data: articleData,
    });
  } else {
    console.error("Content script: Failed to parse article content"); // Added logging
    // If extract fails, notify background to send error status back
    chrome.runtime.sendMessage({
      action: "extractError", // New action to signal extraction failure
      error: "Failed to extract article content.",
    });
  }
}

// --- Custom Status UI Functions ---

let statusPanel = null; // Keep track of the created panel
let removeTimeout = null; // Keep track of the timeout

function createStatusUI(statusClass, message) {
  console.log(`Content script: Creating status UI: ${message}`); // Added logging
  // Remove existing panel and timeout if they exist
  if (statusPanel) {
    statusPanel.remove();
    statusPanel = null;
    clearTimeout(removeTimeout);
  }

  statusPanel = document.createElement("div");
  statusPanel.id = "jaib-status-panel";
  statusPanel.classList.add(statusClass); // saving, saved, or error
  statusPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000; /* Make sure it's on top */
        display: flex; /* Use flex to align text and close button */
        align-items: center;
        opacity: 0; /* Start hidden for fade-in */
        transition: opacity 0.3s ease-in-out;
        font-family: sans-serif; /* Use a common font */
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); /* Add a subtle shadow */
    `;

  // Set status-specific background color
  if (statusClass === "saving") {
    statusPanel.style.backgroundColor = "#ffc107"; // Yellow/Amber
  } else if (statusClass === "saved") {
    statusPanel.style.backgroundColor = "#ff9800"; // Orange (matching button)
  } else if (statusClass === "error") {
    statusPanel.style.backgroundColor = "#f44336"; // Red
  }

  const messageSpan = document.createElement("span");
  messageSpan.id = "jaib-status-message";
  messageSpan.textContent = message;
  messageSpan.style.marginRight = "10px"; // Space between text and button

  statusPanel.appendChild(messageSpan);

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        margin-left: auto; /* Push button to the right */
        font-size: 14px;
    `;
  closeButton.onclick = removeStatusUI; // Add click handler

  statusPanel.appendChild(closeButton);

  document.body.appendChild(statusPanel);

  // Trigger fade-in
  requestAnimationFrame(() => {
    statusPanel.style.opacity = 1;
  });

  // Set timeout for auto-removal only for 'saved' status
  if (statusClass === "saved") {
    removeTimeout = setTimeout(removeStatusUI, 5000); // Keep for 5 seconds
  }
}

function updateStatusUI(statusClass, message) {
  console.log(`Content script: Updating status UI: ${message}`); // Added logging
  if (statusPanel) {
    // Update class for color change
    statusPanel.classList.remove("saving", "saved", "error");
    statusPanel.classList.add(statusClass);

    // Update status-specific background color
    if (statusClass === "saving") {
      statusPanel.style.backgroundColor = "#ffc107"; // Yellow/Amber
    } else if (statusClass === "saved") {
      statusPanel.style.backgroundColor = "#ff9800"; // Orange (matching button)
    } else if (statusClass === "error") {
      statusPanel.style.backgroundColor = "#f44336"; // Red
    }

    // Update message text
    const messageSpan = statusPanel.querySelector("#jaib-status-message");
    if (messageSpan) {
      messageSpan.textContent = message;
    }

    // Set timeout for auto-removal only for 'saved' status when updating
    clearTimeout(removeTimeout); // Clear any existing timeout
    if (statusClass === "saved") {
      removeTimeout = setTimeout(removeStatusUI, 5000); // Keep for 5 seconds
    } else if (statusClass === "error") {
      removeTimeout = setTimeout(removeStatusUI, 5000); // Keep error for 5 seconds
    }
  } else {
    // If the panel doesn't exist for some reason, create it
    createStatusUI(statusClass, message);
  }
}

function removeStatusUI() {
  console.log("Content script: Removing status UI."); // Added logging
  if (statusPanel) {
    // Trigger fade-out
    statusPanel.style.opacity = 0;
    // Remove element after transition
    statusPanel.addEventListener(
      "transitionend",
      () => {
        if (statusPanel && statusPanel.parentNode) {
          statusPanel.parentNode.removeChild(statusPanel);
          statusPanel = null; // Clear reference
          clearTimeout(removeTimeout); // Clear timeout just in case
        }
      },
      { once: true }
    );
  }
  clearTimeout(removeTimeout); // Clear timeout if removing manually
}
