// Background script for Jaib extension
console.log("Jaib extension background script loaded.");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "jaibParent",
    title: "Jaib",
    contexts: ["page", "selection", "link", "image"],
  });

  chrome.contextMenus.create({
    id: "saveToJaib",
    parentId: "jaibParent",
    title: "Save to Jaib",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "viewSavedArticles",
    parentId: "jaibParent",
    title: "View Saved Articles",
    contexts: ["page", "selection", "link", "image"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "viewSavedArticles") {
    chrome.tabs.create({ url: "https://jaib.waliddib.com/" });
  } else if (info.menuItemId === "saveToJaib") {
    if (tab && tab.url) {
      // For "Save to Jaib", we'll redirect to a page in the web app
      // that handles the saving logic, passing the current page's URL.
      const saveUrl = `https://jaib.waliddib.com/save-article?url=${encodeURIComponent(
        tab.url
      )}`;
      chrome.tabs.create({ url: saveUrl });
    } else {
      console.error("Could not get tab URL to save.");
      // Optionally, notify the user that the URL couldn't be retrieved.
    }
  }
});

// Listener for when the extension action (toolbar icon) is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.url) {
    const saveUrl = `https://jaib.waliddib.com/save-article?url=${encodeURIComponent(
      tab.url
    )}`;
    chrome.tabs.create({ url: saveUrl });
  } else {
    console.error("Could not get tab URL to save from action click.");
    // Optionally, notify the user (e.g., if the page is privileged and URL is inaccessible)
  }
});

// Listener for messages from the web app (e.g., to check login status)
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === "CHECK_AUTH") {
      // This is a placeholder. In a real scenario, you might check a flag
      // set by the web app during login, or attempt a silent login if your
      // web app supports it and shares session information appropriately.
      // For now, we assume the web app handles the auth check upon redirection.
      sendResponse({ loggedIn: "unknown" }); // Or true/false if you implement a check
    }
    return true; // Indicates that the response is sent asynchronously
  }
);
