import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./secrets.js"; // IMPORT SECRETS HERE

// Function to verify storage
async function verifyStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["supabaseUrl", "supabaseAnonKey"], (result) => {
      console.log("Verifying storage:", {
        hasUrl: !!result.supabaseUrl,
        hasKey: !!result.supabaseAnonKey,
        url: result.supabaseUrl,
        key: result.supabaseAnonKey ? "present" : "missing",
      });
      resolve(result);
    });
  });
}

// Store Supabase keys in chrome.storage.local when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log(
    "Background script: Extension installed or updated. Storing keys in storage.local."
  );

  // First verify if keys are already stored
  const existingKeys = await verifyStorage();

  // Only store if keys are missing or different
  if (
    !existingKeys.supabaseUrl ||
    !existingKeys.supabaseAnonKey ||
    existingKeys.supabaseUrl !== SUPABASE_URL ||
    existingKeys.supabaseAnonKey !== SUPABASE_ANON_KEY
  ) {
    chrome.storage.local.set(
      {
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error storing keys:", chrome.runtime.lastError);
        } else {
          console.log("Supabase keys stored in storage.local.");
          // Verify storage after setting
          verifyStorage();
        }
      }
    );
  } else {
    console.log("Supabase keys already present in storage.");
  }

  // Create context menu item for saving
  chrome.contextMenus.create({
    id: "saveToJaib",
    title: "Save to Jaib",
    contexts: ["page"],
  });

  // NEW: Create context menu item for viewing saved articles
  chrome.contextMenus.create({
    id: "viewSavedArticles",
    title: "View Saved Articles",
    contexts: ["action", "page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Background script: Context menu clicked.", info.menuItemId);

  if (info.menuItemId === "saveToJaib") {
    try {
      // First try to inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["Readability.js", "content.js"],
      });

      // Then send the message
      chrome.tabs.sendMessage(
        tab.id,
        { action: "extractContent" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Background script: Error sending extractContent message from context menu:",
              chrome.runtime.lastError.message
            );
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon48.png",
              title: "Save Failed",
              message: "Could not connect to the page. Try refreshing it.",
              priority: 2,
            });
          } else {
            console.log(
              "Background script: extractContent message sent to content script successfully from context menu."
            );
          }
        }
      );
    } catch (error) {
      console.error("Error injecting content script:", error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Save Failed",
        message:
          "Could not inject content script. This page may be restricted.",
        priority: 2,
      });
    }
  } else if (info.menuItemId === "viewSavedArticles") {
    console.log("Background script: View Saved Articles clicked.");
    chrome.tabs.create({
      url: chrome.runtime.getURL("articles.html"),
    });
  }
});

// NEW: Handle clicks on the extension toolbar icon
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Background script: Toolbar icon clicked."); // Added logging

  try {
    // First try to inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["Readability.js", "content.js"],
    });

    // Then send the message
    chrome.tabs.sendMessage(
      tab.id,
      { action: "extractContent" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Background script: Error sending extractContent message from action icon:",
            chrome.runtime.lastError.message
          );
          // If content script doesn't exist (e.g. chrome:// page), use a notification fallback
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Save Failed",
            message: "Could not connect to the page. Try refreshing it.",
            priority: 2,
          });
        } else {
          console.log(
            "Background script: extractContent message sent to content script successfully from action icon."
          );
        }
      }
    );
  } catch (error) {
    console.error("Error injecting content script:", error);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Save Failed",
      message: "Could not inject content script. This page may be restricted.",
      priority: 2,
    });
  }
});

async function saveArticleToSupabase(article) {
  console.log("Background script: Saving article to Supabase..."); // Added logging
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(article),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Background script: Supabase save failed:", errorText); // Added logging
    throw new Error(errorText || "Failed to save article");
  }
  console.log("Background script: Supabase save successful."); // Added logging
  return res.json();
}

// Listen for messages from content script (action: "saveArticle" or "extractError")
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(
    "Background script received message:",
    request,
    "from sender:",
    sender
  ); // Added logging

  // Determine the tab ID to send status messages back to.
  // If the message came from a content script, sender.tab contains tab info.
  const senderTabId = sender.tab ? sender.tab.id : null;

  if (request.action === "saveArticle") {
    if (!senderTabId) {
      console.error(
        "Background script: Received saveArticle message, but sender tab ID is missing."
      );
      // Cannot send status back to content script without tab ID.
      return;
    }

    try {
      const article = {
        title: request.data.title,
        content: request.data.content,
        url: request.data.url,
        excerpt: request.data.excerpt,
        byline: request.data.byline,
        length: request.data.length,
        saved_at: request.data.timestamp,
      };
      await saveArticleToSupabase(article);

      // Store in chrome.storage as backup
      chrome.storage.local.set({ [request.data.url]: request.data }, () => {
        console.log("Background script: Article saved locally as backup");
      });

      // Notify content script in the original tab of success
      chrome.tabs.sendMessage(senderTabId, {
        action: "showSaved", // Send success status to content script
        data: { title: request.data.title },
      });
    } catch (error) {
      console.error("Background script: Error in saveArticle handler:", error); // Added logging
      // Notify content script in the original tab of failure
      chrome.tabs.sendMessage(senderTabId, {
        action: "showSaveError", // Send error status to content script
        error: error.message,
      });
    }
  } else if (request.action === "extractError") {
    // Handle extraction failure reported by content script
    if (!senderTabId) {
      console.error(
        "Background script: Received extractError message, but sender tab ID is missing."
      );
      return;
    }
    console.error(
      "Background script: Received extractError from content script:",
      request.error
    ); // Added logging
    // Notify content script in the original tab to show the error UI
    chrome.tabs.sendMessage(senderTabId, {
      action: "showSaveError", // Send error status to content script
      error: request.error,
    });
  }
});
