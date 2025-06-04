import React, { useState, useEffect } from "react";
import { Link as LinkIcon, Loader2, UploadCloud } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

// Helper function to extract the first valid URL from a string
const extractFirstUrlFromString = (inputText) => {
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

function AddUrlPrompt({ isOpen, onClose, onAdd, onNavigateToBulkImport }) {
  const [url, setUrl] = useState("");
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [viewMode, setViewMode] = useState("choice"); // 'choice', 'singleUrl'

  // Effect to reset viewMode to 'choice' when isOpen becomes true (modal opens)
  // This ensures if it was left in 'singleUrl' mode and closed, it reopens to 'choice'
  useEffect(() => {
    if (isOpen) {
      setViewMode("choice");
      // also reset URL and errors from previous interaction if modal was abruptly closed
      setUrl("");
      setProcessingError(null);
      setIsProcessing(false); // Should already be false, but for safety
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSingleUrlSubmit = async (e) => {
    e.preventDefault();
    const extractedUrl = extractFirstUrlFromString(url);

    if (!extractedUrl || !user) {
      if (!user) {
        setProcessingError("You must be logged in to add a URL.");
      } else if (!extractedUrl) {
        setProcessingError(
          "Please enter a valid URL starting with http:// or https://."
        );
      }
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "fetch-article-data",
        {
          body: { url: extractedUrl }, // Use the extracted URL
        }
      );

      if (error) {
        console.error("Edge function invocation error:", error); // Full error object

        let userFriendlyMessage = "Save failed: Problem with site or URL."; // Default fallback

        if (error.context && error.context.message) {
          const edgeFuncMessage = String(error.context.message).toLowerCase();
          const edgeFuncErrorType = error.context.error; // e.g., "ArticleProcessingError"

          if (edgeFuncMessage.includes("timed out")) {
            userFriendlyMessage = "Save failed: Site unresponsive.";
          } else if (
            edgeFuncMessage.includes("status: 403") ||
            edgeFuncMessage.includes("forbidden")
          ) {
            userFriendlyMessage =
              "Save failed: Site access denied (paywall/login?).";
          } else if (
            edgeFuncMessage.includes("status: 404") ||
            edgeFuncMessage.includes("not found")
          ) {
            userFriendlyMessage = "Save failed: URL not found.";
          } else if (edgeFuncMessage.includes("status: 50")) {
            // Catches 500, 502, 503, etc. from target site
            userFriendlyMessage = "Save failed: Error on site's end.";
          } else if (
            edgeFuncErrorType === "Invalid URL Format" ||
            edgeFuncMessage.includes("invalid url")
          ) {
            userFriendlyMessage = "Invalid URL. Please check it.";
          }
          // If none of the specific conditions match, userFriendlyMessage remains the default
          // or could be set to error.context.message if it's deemed suitable.
        } else if (error.message) {
          // Fallback to generic invoke error message if context is not available
          if (error.message.toLowerCase().includes("networkerror")) {
            userFriendlyMessage =
              "Save failed: Network error. Check connection.";
          } else if (
            error.message.toLowerCase().includes("failed with status")
          ) {
            userFriendlyMessage = "Save failed: Server reported an issue.";
          }
          // Otherwise, the initial default "Save failed: Problem with site or URL." is used.
        }
        throw new Error(userFriendlyMessage);
      }

      // If supabase.functions.invoke was successful (no top-level error),
      // 'data' contains the response from the edge function.
      // The edge function itself is designed to return non-2xx HTTP status for its own errors,
      // which would be caught by the 'if (error)' block above.
      // Therefore, if we reach here, 'data' should be the successfully parsed article.
      const parsedArticle = data;

      const { data: insertedArticle, error: insertError } = await supabase
        .from("articles")
        .insert({
          url: parsedArticle.url,
          title: parsedArticle.title,
          content: parsedArticle.content,
          excerpt: parsedArticle.excerpt,
          byline: parsedArticle.byline,
          length: parsedArticle.length,
          lead_image_url: parsedArticle.lead_image_url,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error saving article to database:", insertError);
        if (
          insertError.message &&
          insertError.message.includes("unique_user_article_url")
        ) {
          throw new Error("Article already saved!");
        } else {
          throw new Error(insertError.message || "Error saving article.");
        }
      }

      setUrl("");
      setProcessingError(null);
      onAdd(insertedArticle);
      toast.success("URL saved!", { position: "top-right", duration: 5000 });
      onClose();
    } catch (error) {
      console.error("Error in handleSingleUrlSubmit:", error);
      setProcessingError(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetLocalState = () => {
    setUrl("");
    setProcessingError(null);
    setIsProcessing(false); // Ensure processing is reset
  };

  // This function handles the "Import from .csv" button click
  const handleBulkImportClick = () => {
    resetLocalState(); // Reset any local state like URL input
    setViewMode("choice"); // Ensure view mode is reset
    if (onNavigateToBulkImport) {
      onNavigateToBulkImport();
    }
    onClose(); // Close this modal
  };

  // This function handles closing the modal, e.g. by backdrop click or cancel button
  const handleCloseModal = () => {
    resetLocalState();
    setViewMode("choice"); // Reset view for next time it opens
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleCloseModal} // Click on backdrop closes modal
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {viewMode === "choice" && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Add Article(s)
            </h2>
            <Button
              onClick={() => {
                // resetLocalState(); // Not strictly needed here if useEffect on isOpen handles it
                setViewMode("singleUrl");
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md text-lg transition-colors shadow-md mb-4 flex items-center justify-center"
            >
              <LinkIcon size={20} className="mr-2" />
              Add a Single URL
            </Button>
            <div className="my-4 flex items-center w-full">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 font-medium">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <Button
              onClick={handleBulkImportClick}
              variant="outline"
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 font-semibold py-3 px-6 rounded-md text-lg transition-colors shadow-sm flex items-center justify-center mb-2"
            >
              <UploadCloud size={20} className="mr-2" />
              Import from .csv File
            </Button>
            {/* <Button variant="ghost" onClick={handleCloseModal} className="w-full mt-2 text-gray-600 hover:text-gray-800">
              Cancel
            </Button> */}
          </>
        )}

        {viewMode === "singleUrl" && (
          <div className="flex flex-col items-center w-full">
            {/* Back Button for singleUrl view */}
            <div className="w-full flex justify-start mb-4">
              <Button
                onClick={() => {
                  resetLocalState(); // Reset URL, errors if user goes back
                  setViewMode("choice");
                }}
                variant="ghost"
                className="text-orange-500 hover:text-orange-600 px-0 hover:bg-transparent"
              >
                &larr; Back to Choices
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
              Enter URL to Save
            </h2>
            <form
              onSubmit={handleSingleUrlSubmit}
              className="w-full flex flex-col items-center"
            >
              <div className="relative w-full mb-4">
                <LinkIcon
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  type="text"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
                  autoFocus
                  disabled={isProcessing}
                />
              </div>
              {processingError && (
                <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md w-full text-center">
                  {processingError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full">
                <Button
                  type="button" // Important: type="button" for cancel
                  variant="ghost"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto text-gray-700 hover:text-gray-900"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-md text-base shadow-md flex items-center justify-center space-x-2"
                  disabled={!url.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Add Article"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddUrlPrompt;
