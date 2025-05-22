document.addEventListener("DOMContentLoaded", async () => {
  console.log("articles.js loaded");

  const articlesGrid = document.getElementById("articles-grid");
  const articleView = document.getElementById("article-view");
  const backToGridButton = document.getElementById("back-to-grid");
  const articleViewTitle = document.getElementById("article-view-title");
  const articleViewByline = document.getElementById("article-view-byline");
  const articleViewContent = document.getElementById("article-view-content");

  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let allArticles = []; // To store fetched articles

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
      const res = await fetch(`${supabaseUrl}/rest/v1/articles?select=*`, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

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

      articleItem.innerHTML = `
                <h2>${article.title || "Untitled"}</h2>
                <p>${article.excerpt || "No excerpt available."}</p>
                ${
                  article.byline
                    ? `<div class="byline">By ${article.byline}</div>`
                    : ""
                }
            `;

      articleItem.addEventListener("click", () => showArticle(article.id));
      articlesGrid.appendChild(articleItem);
    });
  }

  // Function to display a single article
  function showArticle(articleId) {
    const article = allArticles.find((a) => a.id === articleId);
    if (!article) {
      console.error("Article not found:", articleId);
      return;
    }

    articleViewTitle.textContent = article.title || "Untitled";
    articleViewByline.textContent = article.byline
      ? `By ${article.byline}`
      : "";
    // Using innerHTML for content because Readability provides HTML
    articleViewContent.innerHTML = article.content || "No content available.";

    articlesGrid.style.display = "none"; // Hide grid
    articleView.style.display = "block"; // Show single article view
  }

  // Function to go back to the grid view
  function backToGrid() {
    articleView.style.display = "none"; // Hide single article view
    articlesGrid.style.display = "grid"; // Show grid
  }

  // Add event listener to the back button
  backToGridButton.addEventListener("click", backToGrid);

  // --- Initialization ---
  const keys = await getSupabaseKeys();
  supabaseUrl = keys.supabaseUrl;
  supabaseAnonKey = keys.supabaseAnonKey;

  allArticles = await fetchArticles();
  renderArticleList(allArticles);
});
