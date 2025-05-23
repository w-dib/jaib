// import { createElement, ArrowLeft, Highlighter, Trash2, Share, ExternalLink, Type } from 'lucide'; // Removed Lucide import

// Add these variable declarations at the top of the file
let supabaseUrl = null;
let supabaseAnonKey = null;
let allArticles = []; // To store fetched articles
let currentArticleId = null; // To keep track of the currently viewed article's ID
let articlesGrid = null; // Add this to make it globally accessible
let articleView = null; // Add this to make it globally accessible
let articleViewMainContent = null; // Add this to make it globally accessible
let deleteArticleIcon = null; // Add this to make it globally accessible
let favoriteArticleIcon = null; // Add this to make it globally accessible
let shareArticleIcon = null; // Add this to make it globally accessible

document.addEventListener("DOMContentLoaded", async () => {
  console.log("articles.js loaded");

  // Get DOM elements with null checks
  articlesGrid = document.getElementById("articles-grid");
  articleView = document.getElementById("article-view");
  articleViewMainContent = document.getElementById("article-view-main-content");
  deleteArticleIcon = document.getElementById("delete-article-icon");
  favoriteArticleIcon = document.getElementById("favorite-article-icon");
  shareArticleIcon = document.getElementById("share-article-icon");

  // Add back button to header-left if it doesn't exist
  const headerLeft = articleView?.querySelector(".header-left");
  if (headerLeft && !headerLeft.querySelector(".back-button")) {
    const backButton = document.createElement("i");
    backButton.className = "header-icon bi bi-arrow-left back-button";
    backButton.addEventListener("click", backToGrid);
    headerLeft.appendChild(backButton);
  }

  // Initialize Supabase keys
  const keys = await getSupabaseKeys();
  supabaseUrl = keys.supabaseUrl;
  supabaseAnonKey = keys.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase keys not found");
    if (articlesGrid) {
      articlesGrid.textContent = "Error: Supabase configuration not found";
    }
    return;
  }

  // Fetch and render articles
  try {
    const articles = await fetchArticles();
    allArticles = articles;
    if (articlesGrid) {
      renderArticleList(articles);
    }
  } catch (error) {
    console.error("Error initializing articles:", error);
    if (articlesGrid) {
      articlesGrid.textContent = "Error loading articles";
    }
  }

  // Add event listeners for article items
  if (articlesGrid) {
    articlesGrid.addEventListener("click", (e) => {
      const articleItem = e.target.closest(".article-item");
      if (articleItem) {
        const articleId = articleItem.dataset.id;
        if (articleId) {
          showArticle(articleId);
        }
      }

      // Handle delete button clicks
      if (e.target.classList.contains("delete-button")) {
        const articleId = e.target.dataset.id;
        if (
          articleId &&
          confirm("Are you sure you want to delete this article?")
        ) {
          deleteArticle(articleId).then((success) => {
            if (success) {
              fetchArticles().then((articles) => {
                renderArticleList(articles);
              });
            }
          });
        }
      }
    });
  }

  // Initialize sticky header
  if (articleView) {
    handleStickyHeader();
  }

  // Add header icon listeners only once
  addHeaderIconListeners();
});

// Function to fetch keys from storage
async function getSupabaseKeys() {
  console.log("Getting Supabase keys from storage...");
  return new Promise((resolve) => {
    chrome.storage.local.get(["supabaseUrl", "supabaseAnonKey"], (result) => {
      console.log("Storage result:", {
        hasUrl: !!result.supabaseUrl,
        hasKey: !!result.supabaseAnonKey,
      });
      resolve(result);
    });
  });
}

// Function to fetch articles from Supabase
async function fetchArticles() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase keys not available.");
    articlesGrid.textContent =
      "Error loading articles: Supabase keys not found.";
    return [];
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=*&order=saved_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error fetching articles:", errorText);
      articlesGrid.textContent = `Error loading articles: ${errorText}`;
      return [];
    }

    const data = await res.json();
    console.log("Fetched articles:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    articlesGrid.textContent = `Error loading articles: ${error.message}`;
    return [];
  }
}

// Function to find the first image source in article HTML content
function findFirstImageSrc(htmlContent) {
  if (!htmlContent) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const firstImg = doc.querySelector("img");
  return firstImg ? firstImg.src : null;
}

// Function to render article list/grid
function renderArticleList(articles) {
  articlesGrid.innerHTML = ""; // Clear loading message or previous content
  if (articles.length === 0) {
    articlesGrid.textContent = "No articles saved yet.";
    return;
  }

  articles.forEach((article) => {
    const articleItem = document.createElement("div");
    articleItem.classList.add("article-item");
    articleItem.dataset.id = article.id; // Store ID for later lookup

    const imageUrl = findFirstImageSrc(article.content); // Find image

    articleItem.innerHTML = `
                <div class="article-image-container">
                    ${
                      imageUrl
                        ? `<img src="${imageUrl}" alt="Article image">`
                        : ""
                    }
                </div>
                <div class="article-content-area">
                    <h2>${article.title || "Untitled"}</h2>
                    <p>${article.excerpt || "No excerpt available."}</p>
                    <div class="article-item-footer">
                        ${
                          article.byline
                            ? `<div class="byline">By ${article.byline}</div>`
                            : "<div></div>"
                        }
                        <!-- Add date saved here later? -->
                    </div>
                </div>
                <button class="delete-button" data-id="${
                  article.id
                }">Delete</button> <!-- Delete button -->
            `;

    articlesGrid.appendChild(articleItem);
  });
}

// Function to delete an article from Supabase
async function deleteArticle(articleId) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase keys not available for deletion.");
    return false;
  }
  console.log("Attempting to delete article with ID:", articleId);
  try {
    // Supabase DELETE syntax: ?column=eq.value
    const res = await fetch(
      `${supabaseUrl}/rest/v1/articles?id=eq.${articleId}`,
      {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Supabase delete failed:", errorText);
      return false;
    }

    console.log("Article deleted successfully:", articleId);
    return true; // Indicate success
  } catch (error) {
    console.error("Delete fetch error:", error);
    return false; // Indicate failure
  }
}

// Function to display a single article
function showArticle(articleId) {
  console.log("Showing article:", articleId); // Add logging
  console.log("All articles:", allArticles); // Log all articles for debugging

  // Convert articleId to number for comparison
  const numericId = parseInt(articleId, 10);
  const article = allArticles.find((a) => a.id === numericId);

  if (!article) {
    console.error("Article not found:", articleId, "Numeric ID:", numericId);
    return;
  }

  console.log("Debug - Article before showing:", {
    id: article.id,
    is_favorite: article.is_favorite,
    title: article.title,
  });

  currentArticleId = article.id; // Store ID of the currently viewed article

  // Populate header elements
  const headerTitle = articleView.querySelector(".header-title");
  const headerMetadata = articleView.querySelector(".header-metadata");
  const headerUrl = articleView.querySelector(".header-url");

  if (!headerTitle || !headerMetadata || !headerUrl) {
    console.error("Required header elements not found");
    return;
  }

  headerTitle.textContent = article.title || "Untitled";

  // Calculate estimated reading time (simple word count / 200 wpm)
  const wordCount = article.content ? article.content.split(/\s+/).length : 0;
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  const readingTimeText =
    readingTimeMinutes > 0 ? `${readingTimeMinutes} min read` : "";

  // Extract source from URL
  let source = "";
  try {
    if (article.url) {
      const urlObj = new URL(article.url);
      source = urlObj.hostname.replace(/^www\./, ""); // Remove www.
    }
  } catch (e) {
    console.error("Error parsing URL for source:", e);
    source = article.url || ""; // Fallback to full URL if parsing fails
  }

  // Construct metadata line
  let metadataParts = [];
  if (article.byline) metadataParts.push(article.byline);
  if (source) metadataParts.push(source);
  if (readingTimeText) metadataParts.push(readingTimeText);

  headerMetadata.textContent = metadataParts.join(" \u2022 "); // Use a middle dot as separator (•)

  // Populate View Original link
  if (article.url) {
    headerUrl.innerHTML = ""; // Clear previous content
    const viewOriginalLink = document.createElement("a");
    viewOriginalLink.href = article.url;
    viewOriginalLink.target = "_blank";
    viewOriginalLink.rel = "noopener noreferrer";
    viewOriginalLink.textContent = "View Original ";

    // Create Bootstrap external link icon
    const externalLinkIcon = document.createElement("i");
    externalLinkIcon.classList.add("bi", "bi-box-arrow-up-right"); // Bootstrap icon classes
    externalLinkIcon.classList.add("external-link-icon"); // Custom class for styling

    viewOriginalLink.appendChild(externalLinkIcon);
    headerUrl.appendChild(viewOriginalLink);
  } else {
    headerUrl.innerHTML = ""; // Clear if no URL
  }

  // Populate icons in the header
  const headerLeft = articleView.querySelector(".header-left");
  if (headerLeft) {
    headerLeft.innerHTML = ""; // Clear previous icons
    // Back icon
    const backIcon = document.createElement("i");
    backIcon.id = "back-to-grid-icon";
    backIcon.classList.add("header-icon", "bi", "bi-arrow-left");
    backIcon.addEventListener("click", backToGrid);
    headerLeft.appendChild(backIcon);
  }

  // Update favorite icon state
  const favoriteArticleIcon = document.getElementById("favorite-article-icon");
  if (favoriteArticleIcon) {
    console.log("Debug - Setting up favorite icon for article:", {
      id: article.id,
      is_favorite: article.is_favorite,
    });

    // Remove all existing click handlers
    const newFavoriteIcon = favoriteArticleIcon.cloneNode(true);
    favoriteArticleIcon.parentNode.replaceChild(
      newFavoriteIcon,
      favoriteArticleIcon
    );

    // Add new click handler
    newFavoriteIcon.onclick = async () => {
      console.log("Debug - Favorite icon clicked");
      if (currentArticleId) {
        const article = allArticles.find((a) => a.id === currentArticleId);
        if (!article) return;

        console.log("Debug - Favorite click - Article state:", {
          id: article.id,
          currentFavorite: article.is_favorite,
          allFields: article,
        });

        // Get the new status before any updates
        const newFavoriteStatus = !article.is_favorite;

        // Optimistically update UI first
        newFavoriteIcon.classList.toggle("active");
        newFavoriteIcon.classList.toggle("bi-star");
        newFavoriteIcon.classList.toggle("bi-star-fill");

        // Update local state
        article.is_favorite = newFavoriteStatus;

        // Then update database in background
        const success = await toggleFavoriteStatus(currentArticleId);
        if (!success) {
          // If the update failed, revert the UI changes
          newFavoriteIcon.classList.toggle("active");
          newFavoriteIcon.classList.toggle("bi-star");
          newFavoriteIcon.classList.toggle("bi-star-fill");
          article.is_favorite = !newFavoriteStatus;
          alert("Failed to update favorite status. Please try again.");
        }
      }
    };

    // Set initial state
    if (article.is_favorite) {
      newFavoriteIcon.classList.add("active");
      newFavoriteIcon.classList.remove("bi-star");
      newFavoriteIcon.classList.add("bi-star-fill");
    } else {
      newFavoriteIcon.classList.remove("active");
      newFavoriteIcon.classList.add("bi-star");
      newFavoriteIcon.classList.remove("bi-star-fill");
    }
  }

  // Set the article content
  if (articleViewMainContent) {
    articleViewMainContent.innerHTML =
      article.content || "No content available.";
  }

  // Show the article view and hide the grid
  if (articlesGrid && articleView) {
    articlesGrid.style.display = "none";
    articleView.style.display = "block";
  }

  // Add scroll listener when article view is shown
  window.addEventListener("scroll", handleStickyHeader);

  // Manually trigger the sticky header check on load
  handleStickyHeader();
}

// Function to toggle the favorite status of an article
async function toggleFavoriteStatus(articleId) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase keys not available for favoriting.");
    return false;
  }

  const article = allArticles.find((a) => a.id === articleId);
  if (!article) {
    console.error("Article not found for favoriting:", articleId);
    return false;
  }

  // Use the current state directly since we're already passing the new state
  console.log("Debug - Current article state:", {
    id: articleId,
    currentFavorite: article.is_favorite,
  });

  try {
    // Supabase PATCH to update is_favorite status
    const url = `${supabaseUrl}/rest/v1/articles?id=eq.${articleId}`;
    const body = JSON.stringify({ is_favorite: article.is_favorite });
    console.log("Debug - Sending request to:", url);
    console.log("Debug - Request body:", body);

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation", // Return the updated object
      },
      body: body,
    });

    console.log("Debug - Response status:", res.status);
    console.log(
      "Debug - Response headers:",
      Object.fromEntries(res.headers.entries())
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Supabase favorite toggle failed:", errorText);
      return false;
    }

    const updatedArticle = await res.json();
    console.log("Debug - Response data:", updatedArticle);

    return true; // Indicate success
  } catch (error) {
    console.error("Favorite toggle fetch error:", error);
    return false; // Indicate failure
  }
}

// Add event listeners to the header icons - Call this only once on DOMContentLoaded
function addHeaderIconListeners() {
  console.log("Debug - Setting up header icon listeners");

  // Delete icon listener
  if (deleteArticleIcon) {
    console.log("Debug - Delete icon found");
    deleteArticleIcon.onclick = async () => {
      if (
        currentArticleId &&
        confirm("Are you sure you want to delete this article?")
      ) {
        const success = await deleteArticle(currentArticleId);
        if (success) {
          allArticles = allArticles.filter((a) => a.id !== currentArticleId);
          backToGrid();
          renderArticleList(allArticles);
        } else {
          alert("Failed to delete the article.");
        }
      }
    };
  }

  // Favorite icon listener
  if (favoriteArticleIcon) {
    console.log("Debug - Favorite icon found");
    favoriteArticleIcon.onclick = async () => {
      console.log("Debug - Favorite icon clicked");
      if (currentArticleId) {
        const article = allArticles.find((a) => a.id === currentArticleId);
        if (!article) return;

        console.log("Debug - Favorite click - Article state:", {
          id: article.id,
          currentFavorite: article.is_favorite,
          allFields: article,
        });

        // Get the new status before any updates
        const newFavoriteStatus = !article.is_favorite;

        // Optimistically update UI first
        favoriteArticleIcon.classList.toggle("active");
        favoriteArticleIcon.classList.toggle("bi-star");
        favoriteArticleIcon.classList.toggle("bi-star-fill");

        // Update local state
        article.is_favorite = newFavoriteStatus;

        // Then update database in background
        const success = await toggleFavoriteStatus(currentArticleId);
        if (!success) {
          // If the update failed, revert the UI changes
          favoriteArticleIcon.classList.toggle("active");
          favoriteArticleIcon.classList.toggle("bi-star");
          favoriteArticleIcon.classList.toggle("bi-star-fill");
          article.is_favorite = !newFavoriteStatus;
          alert("Failed to update favorite status. Please try again.");
        }
      }
    };
  }

  // Share icon listener
  if (shareArticleIcon) {
    shareArticleIcon.onclick = () => {
      const article = allArticles.find((a) => a.id === currentArticleId);
      if (article?.url) {
        navigator.clipboard
          .writeText(article.url)
          .then(() => alert("URL copied to clipboard!"))
          .catch((err) => console.error("Error sharing:", err));
      }
    };
  }
}

// Function to handle sticky header behavior on scroll
function handleStickyHeader() {
  const stickyHeader = document.querySelector(".article-view-sticky-header");
  const articleViewMainContent = document.getElementById(
    "article-view-main-content"
  );

  if (stickyHeader && articleViewMainContent) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 0) {
        stickyHeader.classList.add("is-sticky");
        articleViewMainContent.style.paddingTop = "60px";
      } else {
        stickyHeader.classList.remove("is-sticky");
        articleViewMainContent.style.paddingTop = "0";
      }
    });
  }
}

// Function to go back to the grid view
function backToGrid() {
  const articleView = document.getElementById("article-view");
  const articlesGrid = document.getElementById("articles-grid");

  if (articleView && articlesGrid) {
    articleView.style.display = "none";
    articlesGrid.style.display = "grid";
  }
  // Remove the scroll listener when going back to the grid
  window.removeEventListener("scroll", handleStickyHeader);
}

// Move initialization into an async function
async function initializeApp() {
  try {
    const keys = await getSupabaseKeys();
    supabaseUrl = keys.supabaseUrl;
    supabaseAnonKey = keys.supabaseAnonKey;

    if (supabaseUrl && supabaseAnonKey) {
      allArticles = await fetchArticles(); // Fetch articles on load
      if (articlesGrid) {
        renderArticleList(allArticles); // Render the initial list
      }
    } else {
      if (articlesGrid) {
        articlesGrid.textContent =
          "Supabase keys not configured. Please add them to storage.";
      }
    }
  } catch (error) {
    console.error("Error initializing app:", error);
    if (articlesGrid) {
      articlesGrid.textContent =
        "Error initializing app. Please check the console.";
    }
  }
}

// Call the initialization function after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements once the DOM is ready
  articlesGrid = document.getElementById("articles-grid");
  articleView = document.getElementById("article-view");
  articleViewMainContent = document.getElementById("article-view-main-content");
  deleteArticleIcon = document.getElementById("delete-article-icon");
  favoriteArticleIcon = document.getElementById("favorite-article-icon");
  shareArticleIcon = document.getElementById("share-article-icon");

  initializeApp().catch((error) => {
    console.error("Error in initialization:", error);
    if (articlesGrid) {
      articlesGrid.textContent =
        "Error initializing app. Please check the console.";
    }
  });

  // Add event listener for delete buttons in the grid view
  if (articlesGrid) {
    articlesGrid.addEventListener("click", async (event) => {
      if (event.target.classList.contains("delete-button")) {
        const articleIdToDelete = event.target.dataset.id;
        if (
          articleIdToDelete &&
          confirm("Are you sure you want to delete this article?")
        ) {
          const success = await deleteArticle(articleIdToDelete);
          if (success) {
            const articleItemElement = event.target.closest(".article-item");
            if (articleItemElement) {
              articleItemElement.remove();
            }
            allArticles = allArticles.filter((a) => a.id !== articleIdToDelete);
          } else {
            alert("Failed to delete the article.");
          }
        }
      }
    });

    // Add event listener for opening articles from the grid
    articlesGrid.addEventListener("click", (event) => {
      console.log("Grid clicked:", event.target);
      const articleItemElement = event.target.closest(".article-item");
      if (articleItemElement) {
        console.log("Clicked inside an article item:", articleItemElement);
        if (!event.target.closest(".delete-button")) {
          const articleId = articleItemElement.dataset.id;
          console.log("Attempting to show article with ID:", articleId);
          if (articleId) {
            showArticle(articleId);
          } else {
            console.warn("Article ID not found on clicked item.");
          }
        }
      }
    });
  }
});
