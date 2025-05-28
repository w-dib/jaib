import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SharedArticleHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sharedUrl = queryParams.get("url");
    // const sharedTitle = queryParams.get('title'); // Optional: use if needed
    // const sharedText = queryParams.get('text');   // Optional: use if needed

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
  }, [location, navigate]);

  // This component will likely not render anything itself as it just redirects.
  // You could show a loading spinner if the redirect takes a moment.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-lg">Processing shared article...</p>
      {/* You can add a spinner here if desired */}
    </div>
  );
}

export default SharedArticleHandler;
