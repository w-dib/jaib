import React, { useState, useEffect } from "react";
import { Link as LinkIcon, Loader2, UploadCloud } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  extractFirstUrlFromString,
  processAndSaveArticle,
} from "../lib/articleUtils";

function AddUrlPrompt({ isOpen, onClose, onAdd, onNavigateToBulkImport }) {
  const [url, setUrl] = useState("");
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [viewMode, setViewMode] = useState("choice"); // 'choice', 'singleUrl'

  // Effect to reset viewMode to 'choice' when isOpen becomes true (modal opens)
  useEffect(() => {
    if (isOpen) {
      setViewMode("choice");
      setUrl("");
      setProcessingError(null);
      setIsProcessing(false);
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
      const savedArticle = await processAndSaveArticle(extractedUrl, user.id);

      setUrl("");
      setProcessingError(null);
      onAdd(savedArticle[0]);
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
    setIsProcessing(false);
  };

  const handleBulkImportClick = () => {
    resetLocalState();
    setViewMode("choice");
    if (onNavigateToBulkImport) {
      onNavigateToBulkImport();
    }
    onClose();
  };

  const handleCloseModal = () => {
    resetLocalState();
    setViewMode("choice");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === "choice" && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Add Article(s)
            </h2>
            <Button
              onClick={() => setViewMode("singleUrl")}
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
          </>
        )}

        {viewMode === "singleUrl" && (
          <div className="flex flex-col items-center w-full">
            <div className="w-full flex justify-start mb-4">
              <Button
                onClick={() => {
                  resetLocalState();
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
                  type="button"
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
