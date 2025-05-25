// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { Readability } from "npm:@mozilla/readability";
import { DOMParser } from "npm:linkedom"; // Using linkedom for DOM parsing in Deno

// Helper function to set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow any origin
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST and OPTIONS methods
};

console.log("fetch-article-data function initializing");

// eslint-disable-next-line no-undef
Deno.serve(async (req) => {
  console.log("Request received:", req.method, req.url);

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url: articleUrl } = await req.json();
    console.log("Attempting to parse URL:", articleUrl);

    if (!articleUrl) {
      console.error("No URL provided");
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL format (basic check)
    try {
      new URL(articleUrl); // This will throw an error if the URL is invalid
    } catch (err) {
      console.error("Invalid URL format for:", articleUrl, "Error:", err);
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(articleUrl, {
      headers: {
        // Add a realistic User-Agent to mimic a browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch URL: ${articleUrl}, status: ${response.status}`
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      console.error("Failed to parse HTML document");
      throw new Error("Failed to parse HTML document");
    }

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      console.error("Failed to parse article with Readability");
      throw new Error("Failed to parse article with Readability");
    }

    console.log("Article parsed successfully:", article.title);

    const data = {
      title: article.title || "Untitled",
      content: article.content, // HTML content
      textContent: article.textContent, // Plain text content
      excerpt: article.excerpt,
      byline: article.byline,
      length: article.length, // Estimated reading time in characters
      url: articleUrl, // Include the original URL
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in Edge Function:", error.message, error.stack);
    // Ensure error is stringified properly for the response
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Failed to process article: " + errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/* 
Test with curl:

curl -i -X POST 'http://localhost:54321/functions/v1/fetch-article-data' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'

Replace YOUR_SUPABASE_ANON_KEY with your actual Supabase anon key.
Replace http://localhost:54321 with your local Supabase functions URL (if different).

To get your anon key:
1. Go to your Supabase project dashboard.
2. Navigate to Project Settings > API.
3. Find the "Project API keys" section.
4. Copy the `anon` `public` key.

Make sure your Supabase local development server is running: `npx supabase start`
And the function is deployed locally: `npx supabase functions deploy fetch-article-data --no-verify-jwt` (for testing without JWT)
Or for production deployment to Supabase cloud: `npx supabase functions deploy fetch-article-data` (after linking your project)
*/
