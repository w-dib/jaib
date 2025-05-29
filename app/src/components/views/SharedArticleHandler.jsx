import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SharedArticleHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const [debugParams, setDebugParams] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let paramsString = "Received query params:";
    for (const [key, value] of queryParams.entries()) {
      paramsString += `\n${key}: ${value}`;
    }
    setDebugParams(paramsString);
    console.log(paramsString); // Also log to console

    // const sharedUrl = queryParams.get("url") || queryParams.get("link");
    // const sharedTitle = queryParams.get('title'); // Optional: use if needed
    // const sharedText = queryParams.get('text');   // Optional: use if needed

    // Temporarily disable redirect for debugging
    /*
    if (sharedUrl) {
      // Redirect to the existing SaveArticleHandler, passing the URL
      // The SaveArticleHandler will manage fetching, auth checks, and saving.
      navigate(`/save-article?url=${encodeURIComponent(sharedUrl)}`, {
        replace: true,
      });
    } else {
      // If no URL is found, maybe redirect to home or show an error
      // For now, let's redirect to home
      console.warn("No URL found in share target parameters.");
      navigate("/", { replace: true });
    }
    */
  }, [location, navigate]);

  // This component will likely not render anything itself as it just redirects.
  // You could show a loading spinner if the redirect takes a moment.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <p className="text-lg mb-4">Processing shared article...</p>
      <p className="text-lg mb-4">Attempting to extract URL from share data.</p>
      {debugParams && (
        <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
          {debugParams}
        </pre>
      )}
      <p className="mt-4 text-sm text-gray-600">
        If you see the correct 'url' or 'link' above, the next step is to
        re-enable the redirect.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        If no URL is present, the sharing mechanism might be sending data
        differently than expected.
      </p>
    </div>
  );
}

export default SharedArticleHandler;
