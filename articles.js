document.addEventListener("DOMContentLoaded", async () => {
  console.log("articles.js loaded");

  const articlesGrid = document.getElementById("articles-grid");
  const articleView = document.getElementById("article-view");
  const backToGridButtonNew = document.getElementById("back-to-grid-new");
  const backToGridIcon = document.getElementById("back-to-grid-icon");
  const articleViewContent = document.getElementById("article-view-content");
  const deleteArticleIcon = document.getElementById("delete-article-icon");

  const articleViewHeaderCenter = articleView.querySelector(
    ".article-view-header-center"
  );

  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let allArticles = []; // To store fetched articles
  let currentArticleId = null; // To keep track of the currently viewed article's ID

  // Function to fetch keys from storage
  async function getSupabaseKeys() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["supabaseUrl", "supabaseAnonKey"], (result) => {
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

      // Add click listener to the whole item (excluding delete button)
      articleItem
        .querySelector(".article-content-area")
        .addEventListener("click", (event) => {
          // Ensure click on delete button area doesn't trigger article view
          if (!event.target.closest(".delete-button")) {
            showArticle(article.id);
          }
        });

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
    const article = allArticles.find((a) => a.id === articleId);
    if (!article) {
      console.error("Article not found:", articleId);
      return;
    }

    currentArticleId = article.id; // Store ID of the currently viewed article

    // Add class to body to adjust padding for sticky header
    document.body.classList.add("article-view-active");

    // Populate NEW header elements
    const headerTitle = articleView.querySelector(".header-title");
    const headerMetadata = articleView.querySelector(".header-metadata");
    const headerUrl = articleView.querySelector(".header-url");

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
      headerUrl.innerHTML = `<a href="${article.url}" target="_blank" rel="noopener noreferrer">View Original <svg class="external-link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M16 5l3 3m0 0l-7 7M19 8l-3-3"/></svg></a>`; // Add external link icon
    } else {
      headerUrl.innerHTML = ""; // Clear if no URL
    }

    // Using innerHTML for content because Readability provides HTML
    articleViewContent.innerHTML = article.content || "No content available.";

    articlesGrid.style.display = "none"; // Hide grid
    articleView.style.display = "block"; // Show single article view
  }

  // Function to go back to the grid view
  function backToGrid() {
    articleView.style.display = "none"; // Hide single article view
    articlesGrid.style.display = "grid"; // Show grid
    currentArticleId = null; // Clear current article ID
    document.body.classList.remove("article-view-active"); // Remove body padding class
    // Clear header content when going back - happens in showArticle now, maybe not needed here?
    // articleView.querySelector(".header-title").textContent = "";
    // articleView.querySelector(".header-metadata").textContent = "";
    // articleView.querySelector(".header-url").innerHTML = "";
  }

  // Remove event listener from the old back button
  if (backToGridButtonNew) {
    // Check if the old button still exists
    backToGridButtonNew.removeEventListener("click", backToGrid);
  }

  // Add event listener to the NEW back icon
  backToGridIcon.addEventListener("click", backToGrid);

  // Add click listener to the NEW delete icon in the article view header
  deleteArticleIcon.addEventListener("click", async () => {
    if (currentArticleId !== null) {
      if (confirm("Are you sure you want to delete this article?")) {
        const success = await deleteArticle(currentArticleId);
        if (success) {
          // Remove from UI and array, then go back to grid
          allArticles = allArticles.filter((a) => a.id !== currentArticleId);
          backToGrid();
          renderArticleList(allArticles); // Re-render the grid
        } else {
          alert("Failed to delete article.");
        }
      }
    }
  });

  // --- Initialization ---
  const keys = await getSupabaseKeys();
  supabaseUrl = keys.supabaseUrl;
  supabaseAnonKey = keys.supabaseAnonKey;

  allArticles = await fetchArticles();
  renderArticleList(allArticles);
});
