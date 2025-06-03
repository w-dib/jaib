import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import SkeletonCard from "../SkeletonCard";
import { toast } from "sonner";

function SaveArticleHandler() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing");
  const [error, setError] = useState(null);
  const hasAttemptedSave = useRef(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const articleUrl = queryParams.get("url");

    if (!articleUrl) {
      if (status === "Processing") {
        setStatus("Error");
        setError("No URL provided.");
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
      hasAttemptedSave.current = true;

      const saveArticle = async () => {
        setStatus("Saving...");
        try {
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

          const { data: dbData, error: dbError } = await supabase
            .from("articles")
            .insert([
              {
                user_id: user.id,
                url: articleUrl,
                title: parsedArticle.title,
                content: parsedArticle.content,
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
              toast.success("Article already saved!", {
                position: "top-right",
                duration: 5000,
              });
              setStatus("Success");
              setTimeout(() => navigate("/"), 1500);
              return;
            }
            toast.error("Failed to save article.", {
              position: "top-right",
              duration: 5000,
            });
            throw new Error(dbError.message || "Error saving article.");
          }

          console.log("Article saved:", dbData);
          toast.success("Article saved!", {
            position: "top-right",
            duration: 5000,
          });
          setStatus("Success");
          if (dbData && dbData.length > 0 && dbData[0].id) {
            setTimeout(() => navigate(`/article/${dbData[0].id}`), 1500);
          } else {
            setTimeout(() => navigate("/"), 1500);
          }
        } catch (err) {
          console.error("Failed to save article:", err);
          toast.error("Failed to save article.", {
            position: "top-right",
            duration: 5000,
          });
          setError(err.message);
          setStatus("Error");
        }
      };

      saveArticle();
    }
  }, [user, location, navigate, status]);

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
      {status === "Saving" && (
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
