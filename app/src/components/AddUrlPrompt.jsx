import React, { useState } from "react";
import { Link as LinkIcon, X, Loader2 } from "lucide-react"; // Added Loader2
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import logo from "../assets/icon48.png";
import { supabase } from "../lib/supabase"; // Added Supabase client
import { useAuth } from "../contexts/AuthContext"; // Added Auth context

function AddUrlPrompt({ isOpen, onClose, onAdd }) {
  const [url, setUrl] = useState("");
  const { user } = useAuth(); // Get user from AuthContext
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
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
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setProcessingError(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center">
      {/* Top Bar with Logo and Close Button */}
      <div className="w-full flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
          disabled={isProcessing}
        >
          <X size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-xl px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center"
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
              "Add"
            )}
          </Button>
        </form>

        {/* Optional: Add some helper text or instructions below the form */}
        {/* <p className="mt-4 text-sm text-gray-500">Paste any link to save it to your Jaib.</p> */}
      </div>
    </div>
  );
}

export default AddUrlPrompt;
