import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

function SaveArticleHandler() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing..."); // Possible statuses: Processing, Saving, Success, Error, NotLoggedIn
  const [error, setError] = useState(null);
  const hasAttemptedSave = useRef(false); // Initialize ref

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const articleUrl = queryParams.get("url");

    if (!articleUrl) {
      // Set error only if we are in the initial processing state
      if (status === "Processing...") {
        setStatus("Error");
        setError("No URL provided.");
      }
      return;
    }

    if (!user) {
      // If user is not available yet, set status to NotLoggedIn and wait.
      // The effect will re-run when user becomes available.
      if (status === "Processing...") {
        setStatus("NotLoggedIn");
        // The existing JSX shows "Redirecting to login page..."
        // The navigation redirects to home after a delay.
        setTimeout(() => navigate("/"), 3000);
      }
      return;
    }

    // Proceed to save only if we have a user, a URL, and haven't attempted yet.
    if (user && articleUrl && !hasAttemptedSave.current) {
      hasAttemptedSave.current = true; // Set the flag before starting the save process

      const saveArticle = async () => {
        setStatus("Saving...");
        try {
          // 1. Invoke the Edge Function
          const { data: functionResponse, error: functionError } =
            await supabase.functions.invoke("fetch-article-data", {
              body: { url: articleUrl },
            });

          if (functionError) {
            console.error("Edge function invocation error:", functionError);
            throw new Error(
              functionError.message || "Error fetching article data."
            );
          }

          if (functionResponse.error) {
            console.error(
              "Error from Edge function logic:",
              functionResponse.error
            );
            throw new Error(functionResponse.error);
          }

          const parsedArticle = functionResponse;

          // 2. Save to Supabase 'articles' table
          const { data: dbData, error: dbError } = await supabase
            .from("articles")
            .insert([
              {
                user_id: user.id,
                url: articleUrl,
                title: parsedArticle.title,
                content: parsedArticle.content, // HTML content
                excerpt: parsedArticle.excerpt,
                byline: parsedArticle.byline,
                length: parsedArticle.length, // Character or word count from readability
                // is_favorite and is_read default to false in the DB or can be set here
              },
            ])
            .select(); // .select() to get the inserted row back if needed

          if (dbError) {
            console.error("Error saving article to database:", dbError);
            // Handle potential duplicate URL errors if you have unique constraints
            if (dbError.code === "23505") {
              // Unique violation
              // Check if it's a duplicate for THIS user or a general duplicate
              // For now, assume it's okay if it already exists and try to navigate to it
              // Or, inform the user it's already saved.
              setStatus("Success"); // Or 'AlreadySaved'
              // Potentially find the existing article and navigate to it
              // navigate(`/article/${existingArticleId}`);
              // For now, redirect home if already saved.
              setTimeout(() => navigate("/"), 1500);
              return;
            }
            throw new Error(dbError.message || "Error saving article.");
          }

          console.log("Article saved:", dbData);
          setStatus("Success");
          // Redirect to the article view or saves list after a short delay
          // If dbData contains the new article's ID, use that.
          if (dbData && dbData.length > 0 && dbData[0].id) {
            setTimeout(() => navigate(`/article/${dbData[0].id}`), 1500);
          } else {
            // If for some reason ID is not returned, or if it was a duplicate treated as success above
            setTimeout(() => navigate("/"), 1500); // Fallback to home
          }
        } catch (err) {
          console.error("Failed to save article:", err);
          setError(err.message);
          setStatus("Error");
        }
      };

      saveArticle();
    }
  }, [user, location, navigate, status]); // Added status to dependencies to handle transitions correctly

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {status === "Processing" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
          <p className="text-xl">Processing URL...</p>
        </>
      )}
      {status === "NotLoggedIn" && (
        <>
          <p className="text-xl text-orange-500 mb-4">
            Please log in to save articles.
          </p>
          <p>Redirecting to login page...</p>
        </>
      )}
      {status === "Saving" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
          <p className="text-xl">Saving article...</p>
        </>
      )}
      {status === "Success" && (
        <>
          <CheckCircle className="h-12 w-12 text-orange-500 mb-4" />
          <p className="text-xl text-orange-500">Article saved successfully!</p>
          <p>Redirecting...</p>
        </>
      )}
      {status === "Error" && (
        <>
          <XCircle className="h-12 w-12 text-red-500 mb-4" />{" "}
          {/* Assuming you have XCircle icon */}
          <p className="text-xl text-red-500">Failed to save article.</p>
          {error && (
            <p className="text-sm text-gray-600 mt-2">Error: {error}</p>
          )}
          <Button
            onClick={() => navigate("/")}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Go to Saves
          </Button>
        </>
      )}
    </div>
  );
}

export default SaveArticleHandler;
