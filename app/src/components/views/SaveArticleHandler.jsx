import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import {
  extractFirstUrlFromString,
  processAndSaveArticle,
} from "../../lib/articleUtils";

function SaveArticleHandler() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing");
  const [error, setError] = useState(null);
  const [rawText, setRawText] = useState("");
  const hasAttemptedSave = useRef(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const rawUrlFromQuery = queryParams.get("url");

    console.log("Raw shared text:", rawUrlFromQuery);

    setRawText(rawUrlFromQuery || "");
    const articleUrl = extractFirstUrlFromString(rawUrlFromQuery);

    console.log("Extracted URL:", articleUrl);

    if (!articleUrl) {
      console.log("No URL found in text, setting error state");
      if (status === "Processing") {
        setStatus("Error");
        setError("No valid URL found in the provided text.");
      }
      return;
    }

    if (!user) {
      if (status === "Processing") {
        setStatus("NotLoggedIn");
        setTimeout(() => navigate("/"), 3000);
      }
      return;
    }

    if (user && articleUrl && !hasAttemptedSave.current) {
      console.log("Attempting to save article with URL:", articleUrl);
      hasAttemptedSave.current = true;

      const saveArticle = async () => {
        setStatus("Saving...");
        try {
          const savedArticle = await processAndSaveArticle(articleUrl, user.id);
          console.log("Article saved successfully:", savedArticle);

          toast.success("Article saved!", {
            position: "top-right",
            duration: 5000,
          });
          setStatus("Success");

          if (savedArticle && savedArticle.length > 0 && savedArticle[0].id) {
            setTimeout(() => navigate(`/article/${savedArticle[0].id}`), 1500);
          } else {
            setTimeout(() => navigate("/"), 1500);
          }
        } catch (err) {
          console.error("Failed to save article:", err);
          if (err.message === "Article already saved!") {
            toast.success("Article already saved!", {
              position: "top-right",
              duration: 5000,
            });
            setStatus("Success");
            setTimeout(() => navigate("/"), 1500);
          } else {
            toast.error("Failed to save article.", {
              position: "top-right",
              duration: 5000,
            });
            setError(err.message);
            setStatus("Error");
          }
        }
      };

      saveArticle();
    }
  }, [user, location, navigate, status]);

  const handleRetry = () => {
    console.log("Retrying with raw text:", rawText);
    hasAttemptedSave.current = false;
    setStatus("Processing");
    setError(null);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen text-center p-4 ${
        status === "Processing" || status === "Saving..."
          ? "bg-white"
          : "bg-gray-50"
      }`}
    >
      {status === "Processing" && (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
          <p className="text-xl text-orange-600">Processing URL...</p>
        </div>
      )}
      {status === "NotLoggedIn" && (
        <>
          <p className="text-xl text-orange-500 mb-4">
            Please log in to save articles.
          </p>
          <p>Redirecting to login page...</p>
        </>
      )}
      {status === "Saving..." && (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
          <p className="text-xl text-orange-600">Saving article...</p>
        </div>
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
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-xl text-red-500">Failed to save article.</p>
          {error && (
            <p className="text-sm text-gray-600 mt-2">Error: {error}</p>
          )}
          {error === "No valid URL found in the provided text." && rawText && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-md">
              <p className="text-sm text-gray-600 mb-2">Shared text:</p>
              <p className="text-sm text-gray-800 break-words">{rawText}</p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              Go to Saves
            </Button>
            <Button
              onClick={handleRetry}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Try Again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default SaveArticleHandler;
