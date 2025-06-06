import { supabase } from "./supabase";

// Helper function to extract the first valid URL from a string
export const extractFirstUrlFromString = (inputText) => {
  if (typeof inputText !== "string") {
    return null;
  }
  const urlRegex = /https?:\/\/[^\s]+/i;
  const match = inputText.match(urlRegex);
  if (match && match[0]) {
    return match[0];
  }
  return null;
};

// Function to process and save an article
export const processAndSaveArticle = async (url, userId) => {
  if (!url || !userId) {
    throw new Error("URL and user ID are required");
  }

  // Fetch article data from edge function
  const { data: functionResponse, error: functionError } =
    await supabase.functions.invoke("fetch-article-data", {
      body: { url },
    });

  if (functionError) {
    console.error("Edge function invocation error:", functionError);
    throw new Error(functionError.message || "Error fetching article data.");
  }

  if (functionResponse.error) {
    console.error("Error from Edge function logic:", functionResponse.error);
    throw new Error(functionResponse.error);
  }

  const parsedArticle = functionResponse;

  // Save to database
  const { data: dbData, error: dbError } = await supabase
    .from("articles")
    .insert([
      {
        user_id: userId,
        url: url,
        title: parsedArticle.title,
        content: parsedArticle.content,
        text_content: parsedArticle.textContent,
        excerpt: parsedArticle.excerpt,
        byline: parsedArticle.byline,
        length: parsedArticle.length,
        lead_image_url: parsedArticle.lead_image_url,
      },
    ])
    .select();

  if (dbError) {
    console.error("Error saving article to database:", dbError);
    if (dbError.code === "23505") {
      throw new Error("Article already saved!");
    }
    throw new Error(dbError.message || "Error saving article.");
  }

  return dbData;
};
