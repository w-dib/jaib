// Background script for Jaib extension
console.log(
  "Jaib extension background script loaded (v2 with action context menu)."
);

// Function to get current tab URL and save it
function saveCurrentPage(tab) {
  if (
    tab &&
    tab.url &&
    (tab.url.startsWith("http://") || tab.url.startsWith("https://"))
  ) {
    const saveUrl = `https://jaib.waliddib.com/save-article?url=${encodeURIComponent(
      tab.url
    )}`;
    chrome.tabs.create({ url: saveUrl });
  } else {
    console.error(
      "Jaib: Could not get a valid URL from the current tab to save."
    );
    // Optionally, notify the user (e.g., if the page is privileged and URL is inaccessible)
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Setting up action context menus...");
  // Remove all existing context menus for this extension to prevent duplicates during development
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveToJaib",
      title: "Save page to Jaib",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "openJaibSaves",
      title: "Open Jaib Saves",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "actionLogout",
      title: "Log out (from Jaib)",
      contexts: ["action"],
    });
    console.log("Context menus created/updated.");
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "saveToJaib":
      if (tab && tab.id) {
        saveCurrentPage(tab);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            saveCurrentPage(tabs[0]);
          } else {
            console.error("Jaib: No active tab found to save.");
          }
        });
      }
      break;
    case "openJaibSaves":
      chrome.tabs.create({ url: "https://jaib.waliddib.com/" });
      break;
    case "actionLogout":
      chrome.tabs.create({ url: "https://jaib.waliddib.com/logout" });
      break;
  }
});

// Listener for when the extension action (toolbar icon) is LEFT-clicked
chrome.action.onClicked.addListener((tab) => {
  // This will save the current page when the icon is left-clicked
  saveCurrentPage(tab);
});

// Listener for messages from the web app (e.g., to check login status)
// This remains unchanged, but its utility might be limited without a popup UI
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === "CHECK_AUTH") {
      sendResponse({ loggedIn: "unknown" });
    }
    return true; // Indicates that the response is sent asynchronously
  }
);
