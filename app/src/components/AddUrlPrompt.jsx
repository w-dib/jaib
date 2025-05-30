import React, { useState } from "react";
import {
  Link as LinkIcon,
  X,
  Loader2,
  FileText,
  UploadCloud,
} from "lucide-react"; // Added FileText, UploadCloud
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import logo from "../assets/icon48.png";
import { supabase } from "../lib/supabase"; // Added Supabase client
import { useAuth } from "../contexts/AuthContext"; // Added Auth context
import PocketImportBanner from "./PocketImportBanner"; // Import PocketImportBanner
import { Link } from "react-router-dom"; // Import Link

function AddUrlPrompt({ isOpen, onClose, onAdd }) {
  const [url, setUrl] = useState("");
  const { user } = useAuth(); // Get user from AuthContext
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [viewMode, setViewMode] = useState("choice"); // 'choice', 'singleUrl', 'bulkImport'
  const [pocketImportKey, setPocketImportKey] = useState(0); // Key for resetting PocketImportBanner

  if (!isOpen) {
    return null;
  }

  const handleSingleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || !user) {
      if (!user) {
        setProcessingError("You must be logged in to add a URL.");
      }
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Step 1: Invoke the Edge Function to fetch and parse article data
      const { data: functionResponse, error: functionError } =
        await supabase.functions.invoke("fetch-article-data", {
          body: { url: url.trim() },
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

      // Step 2: Save the parsed article to the 'articles' table
      const { error: insertError } = await supabase.from("articles").insert({
        url: parsedArticle.url, // Original URL from function response
        title: parsedArticle.title,
        content: parsedArticle.content,
        excerpt: parsedArticle.excerpt,
        byline: parsedArticle.byline,
        length: parsedArticle.length,
        lead_image_url: parsedArticle.lead_image_url,
        user_id: user.id,
        // saved_at, is_favorite, is_read have default values in DB
      });

      if (insertError) {
        console.error("Error saving article to database:", insertError);
        throw new Error(insertError.message || "Error saving article.");
      }

      // If successful
      onAdd(url.trim()); // Or pass the full saved article object if needed by parent
      setUrl("");
      setViewMode("choice"); // Go back to choice view or close modal?
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Error in handleSingleUrlSubmit:", error);
      setProcessingError(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to be passed to PocketImportBanner to reset view
  const handleReturnToChoice = () => {
    setViewMode("choice");
  };

  // Reset internal state when modal is closed externally or view changes back to choice
  const resetLocalState = () => {
    setUrl("");
    setProcessingError(null);
    setIsProcessing(false);
  };

  const handleCloseAndReset = () => {
    resetLocalState();
    setViewMode("choice");
    setPocketImportKey((prevKey) => prevKey + 1); // Increment key to force remount of PocketImportBanner
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center">
      {/* Top Bar with Logo and Close Button */}
      <div className="w-full flex items-center justify-between p-4 border-b border-gray-200">
        <Link
          to="/"
          onClick={handleCloseAndReset}
          className="flex items-center space-x-2 text-gray-800 hover:text-orange-600 transition-colors"
        >
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </Link>
        <Link
          to="/" // Navigate to main page
          onClick={handleCloseAndReset} // Also close modal and reset state
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close and go to main page"
          disabled={isProcessing} // Disable if single URL is processing, PocketImportBanner handles its own disabled state
        >
          <X size={24} className="text-gray-600" />
        </Link>
      </div>

      {viewMode === "choice" && (
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-lg px-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            How would you like to add an article?
          </h2>
          <Button
            onClick={() => {
              resetLocalState();
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
            onClick={() => {
              resetLocalState();
              setViewMode("bulkImport");
            }}
            variant="outline"
            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 font-semibold py-3 px-6 rounded-md text-lg transition-colors shadow-sm flex items-center justify-center"
          >
            <UploadCloud size={20} className="mr-2" />
            Import from .csv File (Pocket Export)
          </Button>
        </div>
      )}

      {viewMode === "singleUrl" && (
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-xl px-4">
          <Button
            onClick={() => {
              resetLocalState();
              setViewMode("choice");
            }}
            variant="ghost"
            className="absolute top-20 left-4 text-orange-500 hover:text-orange-600"
          >
            &larr; Back to Choices
          </Button>
          <form
            onSubmit={handleSingleUrlSubmit}
            className="w-full flex flex-col items-center mt-12" // Added margin-top to avoid overlap with back button
          >
            <div className="relative w-full mb-4">
              <LinkIcon
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                type="url"
                placeholder="Save a URL https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
                autoFocus
                disabled={isProcessing}
              />
            </div>
            {processingError && (
              <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md w-full text-center">
                {processingError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-md text-lg transition-colors shadow-md flex items-center justify-center space-x-2"
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
          </form>
        </div>
      )}

      {viewMode === "bulkImport" && (
        <div className="flex-grow w-full flex flex-col items-center justify-start pt-6 px-2 md:px-4 overflow-y-auto">
          <Button
            onClick={() => {
              resetLocalState();
              setViewMode("choice");
              setPocketImportKey((prevKey) => prevKey + 1); // Increment key here too
            }}
            variant="ghost"
            className="mb-4 text-orange-500 hover:text-orange-600 self-start"
            // Consider absolute positioning if PocketImportBanner takes full screen height within modal
          >
            &larr; Back to Choices
          </Button>
          <PocketImportBanner
            key={pocketImportKey} // Add the key prop here
            onReturnToChoice={handleReturnToChoice}
            isInsideModal={true} // Prop to indicate it's in a modal
          />
        </div>
      )}
    </div>
  );
}

export default AddUrlPrompt;
