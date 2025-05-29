import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SharedArticleHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);

    // Try to get URL from 'url' param, then 'text' param as fallback
    const sharedUrlFromUrlParam = queryParams.get("url");
    const sharedUrlFromTextParam = queryParams.get("text");

    let sharedUrl = sharedUrlFromUrlParam; // Prioritize 'url' parameter

    // If 'url' is not present or is empty, try 'text'
    if (!sharedUrl && sharedUrlFromTextParam) {
      // Basic check to see if the text param looks like a URL
      if (
        sharedUrlFromTextParam.startsWith("http://") ||
        sharedUrlFromTextParam.startsWith("https://")
      ) {
        sharedUrl = sharedUrlFromTextParam;
      } else {
        console.warn(
          "Received 'text' parameter that does not look like a URL:",
          sharedUrlFromTextParam
        );
      }
    }

    // Optional: You could also grab title if needed for future use
    // const sharedTitle = queryParams.get('title');
    // console.log("Shared URL:", sharedUrl);
    // console.log("Shared Title:", sharedTitle);

    if (sharedUrl) {
      // Redirect to the existing SaveArticleHandler, passing the URL
      // The SaveArticleHandler will manage fetching, auth checks, and saving.
      navigate(`/save-article?url=${encodeURIComponent(sharedUrl)}`, {
        replace: true,
      });
    } else {
      // If no URL is found (neither in 'url' nor in 'text' that looks like a URL), redirect to home
      console.warn(
        "No valid URL found in share target parameters (checked 'url' and 'text')."
      );
      // You could also navigate to an error page or show a message here
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  // This component will likely not render anything itself as it just redirects.
  // You could show a loading spinner if the redirect takes a moment.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <p className="text-lg">Processing shared article...</p>
      {/* You can add a spinner here from shadcn/ui if desired e.g. <Loader2 className="h-8 w-8 animate-spin" /> */}
    </div>
  );
}

export default SharedArticleHandler;
