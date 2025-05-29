// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Readability } from "npm:@mozilla/readability";
import { DOMParser } from "npm:linkedom";

// Helper function to set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

console.log(
  "fetch-article-data function initializing (v4 with timeout & enhanced error handling)"
);

Deno.serve(async (req) => {
  console.log("Request received:", req.method, req.url);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (jsonError) {
    console.error("Failed to parse request body as JSON:", jsonError);
    return new Response(
      JSON.stringify({
        error: "Invalid JSON payload",
        message:
          "Ensure 'url' is provided in a valid JSON body. " + jsonError.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const articleUrl = requestBody ? requestBody.url : null;

  try {
    // Main try block for article processing
    if (!articleUrl) {
      console.error("No URL provided in request body");
      return new Response(
        JSON.stringify({
          error: "Missing URL",
          message: "No 'url' field found in the request body.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      new URL(articleUrl); // Validate URL format
    } catch (urlError) {
      console.error("Invalid URL format for:", articleUrl, "Error:", urlError);
      return new Response(
        JSON.stringify({
          error: "Invalid URL Format",
          message:
            `The provided URL '${articleUrl}' is not valid. ` +
            urlError.message,
          sourceUrl: articleUrl,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing URL: ${articleUrl}`);

    const controller = new AbortController();
    const timeoutMilliseconds = 20000; // 20-second timeout for fetching
    const timeoutId = setTimeout(() => {
      console.warn(
        `Fetch timeout triggered for ${articleUrl} after ${timeoutMilliseconds}ms`
      );
      controller.abort();
    }, timeoutMilliseconds);

    let response;
    try {
      console.log(`Fetching URL: ${articleUrl}`);
      response = await fetch(articleUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 JaibArticleFetcher/1.0", // Added Jaib to User-Agent
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.error(`Fetch aborted for URL (timeout): ${articleUrl}`);
        throw new Error(
          `Request to ${articleUrl} timed out after ${
            timeoutMilliseconds / 1000
          } seconds.`
        );
      }
      console.error(`Network error fetching ${articleUrl}:`, fetchError);
      throw new Error(
        `Network error while fetching ${articleUrl}: ${fetchError.message}`
      );
    }
    clearTimeout(timeoutId); // Clear timeout if fetch succeeded or failed for other reasons

    if (!response.ok) {
      let responseBodyText = "Could not read response body";
      try {
        responseBodyText = await response.text();
      } catch (e) {
        console.warn(
          "Could not read response body for failed fetch of " + articleUrl
        );
      }
      console.error(
        `Failed to fetch URL: ${articleUrl}, status: ${response.status} ${response.statusText}`
      );
      throw new Error(
        `HTTP error! Status: ${response.status} ${
          response.statusText
        } for ${articleUrl}. Response snippet: ${responseBodyText.substring(
          0,
          200
        )}`
      );
    }

    const html = await response.text();
    console.log(
      `HTML received for ${articleUrl}, length: ${html.length}. Parsing with DOMParser...`
    );

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      console.error("Failed to parse HTML document from URL:", articleUrl);
      throw new Error(
        `Failed to parse HTML document from ${articleUrl}. DOMParser returned null.`
      );
    }

    // Image extraction (Step 1: Meta tags) - This logic remains largely the same
    let preferredImageUrl: string | null = null;
    const metaSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[itemprop="image"]',
    ];
    for (const selector of metaSelectors) {
      const metaTag = doc.querySelector(selector);
      if (metaTag && metaTag.getAttribute("content")) {
        const imageUrl = metaTag.getAttribute("content").trim();
        if (imageUrl) {
          try {
            preferredImageUrl = new URL(imageUrl, articleUrl).href;
            console.log(
              `Found image via ${selector} for ${articleUrl}:`,
              preferredImageUrl
            );
            break;
          } catch (e) {
            console.warn(
              `Could not construct absolute URL for ${selector} content ('${imageUrl}') from ${articleUrl}:`,
              e.message
            );
          }
        }
      }
    }

    console.log(`DOM parsed for ${articleUrl}. Applying Readability...`);
    const reader = new Readability(doc, {}); // Removed cloneNode, as Readability docs suggest it's not always needed and can be intensive.
    const article = reader.parse();

    if (!article) {
      console.error(
        "Failed to parse article with Readability from URL:",
        articleUrl
      );
      throw new Error(
        `Readability could not parse article content from ${articleUrl}.`
      );
    }
    console.log(
      "Article parsed successfully with Readability for " + articleUrl + ":",
      article.title
    );

    // Image extraction (Step 2: From Readability content) - This logic also remains largely the same
    if (!preferredImageUrl && article.content) {
      console.log(
        `No meta image found for ${articleUrl}, trying to extract from Readability content.`
      );
      try {
        const readabilityDoc = new DOMParser().parseFromString(
          article.content,
          "text/html"
        );
        const firstImageInContent = readabilityDoc.querySelector("img");
        if (firstImageInContent) {
          const imgSrcAttr = firstImageInContent.getAttribute("src");
          if (imgSrcAttr) {
            const imgSrc = imgSrcAttr.trim();
            if (imgSrc && !imgSrc.startsWith("data:")) {
              try {
                preferredImageUrl = new URL(imgSrc, articleUrl).href;
                console.log(
                  `Found and resolved image from Readability content for ${articleUrl}:`,
                  preferredImageUrl
                );
              } catch (e) {
                if (
                  imgSrc.startsWith("http://") ||
                  imgSrc.startsWith("https://")
                ) {
                  preferredImageUrl = imgSrc; // Assume it's absolute if resolution fails but looks like one
                  console.log(
                    `Used image src directly from Readability content for ${articleUrl} (resolution failed or deemed absolute):`,
                    preferredImageUrl
                  );
                } else {
                  console.warn(
                    `Could not resolve image src ('${imgSrc}') from Readability content for ${articleUrl}:`,
                    e.message
                  );
                }
              }
            } else if (imgSrc && imgSrc.startsWith("data:")) {
              console.log(
                `Found data URI image in Readability content for ${articleUrl}, skipping.`
              );
            }
          } else {
            console.log(
              `First image in Readability content for ${articleUrl} has no src.`
            );
          }
        } else {
          console.log(
            `No img tags found in Readability content for ${articleUrl}.`
          );
        }
      } catch (e) {
        console.warn(
          `Error parsing Readability content for images from ${articleUrl}:`,
          e.message
        );
      }
    } else if (preferredImageUrl) {
      console.log(
        `Using image from meta tags for ${articleUrl}:`,
        preferredImageUrl
      );
    } else {
      console.log(
        `No image found from meta tags or Readability content for ${articleUrl}.`
      );
    }

    const dataToReturn = {
      title: article.title || "Untitled",
      content: article.content, // HTML content
      textContent: article.textContent, // Plain text content
      excerpt: article.excerpt,
      byline: article.byline,
      length: article.length,
      url: articleUrl, // Return the original URL for consistency
      lead_image_url: preferredImageUrl,
    };

    return new Response(JSON.stringify(dataToReturn), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Main catch-all for processing errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error processing article [${
        articleUrl || "URL not available due to early error"
      }]: ${errorMessage}`,
      error.stack
    );

    return new Response(
      JSON.stringify({
        error: "ArticleProcessingError", // General error type for server-side processing failures
        message: errorMessage,
        sourceUrl:
          articleUrl || "URL not available or invalid at time of error",
      }),
      {
        status: 500, // Internal Server Error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
