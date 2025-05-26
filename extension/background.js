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
      id: "actionSaveToJaib",
      title: "Save to Jaib",
      contexts: ["action"],
    });

    chrome.contextMenus.create({
      id: "actionOpenSaves",
      title: "Open your Saves",
      contexts: ["action"],
    });

    chrome.contextMenus.create({
      id: "actionLogout",
      title: "Log out",
      contexts: ["action"],
    });
    console.log("Action context menus created.");
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "actionSaveToJaib":
      // 'tab' might be undefined if the context menu is clicked from the toolbar action context itself.
      // We need to get the active tab in the current window.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          saveCurrentPage(tabs[0]);
        }
      });
      break;
    case "actionOpenSaves":
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
