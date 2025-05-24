import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ArrowLeft } from "lucide-react";
// Import updated icons based on user feedback
import {
  Star, // For Favorite/Unfavorite
  Highlighter, // For Tag (as Placeholder)
  BookDown, // For Archive (if not read)
  BookUp, // For Archive (if read)
  Trash2, // For Delete
} from "lucide-react";

function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null); // Ref for the article content div
  const [readingProgress, setReadingProgress] = useState(0); // State for reading progress

  useEffect(() => {
    const fetchArticle = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching article:", error);
        setError(error.message);
      } else {
        setArticle(data);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id, user]);

  // Effect for calculating reading progress
  useEffect(() => {
    const handleWindowScroll = () => {
      if (!contentRef.current) return;

      // A simpler approach: measure scroll relative to the bottom of the content
      // total scrollable distance is body height - viewport height
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
      const progress = scrolled * 100;

      setReadingProgress(progress);
    };

    // Attach to window scroll as the main page container handles scrolling
    window.addEventListener("scroll", handleWindowScroll);

    // Clean up the event listener
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [article]); // Re-run effect when article content loads

  // Recalculate progress when article loads
  useEffect(() => {
    const handleInitialProgress = () => {
      // Trigger a scroll calculation after content is likely rendered
      // A small timeout might be necessary to ensure content height is calculated
      setTimeout(() => {
        if (!contentRef.current) return; // Ensure ref is available after timeout
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY;
        const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
        const progress = scrolled * 100;
        setReadingProgress(progress);
      }, 100); // Small timeout to wait for rendering
    };
    if (article) {
      handleInitialProgress();
    }
  }, [article]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p>Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-500">Error loading article: {error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p>Article not found.</p>
      </div>
    );
  }

  // Calculate icon size
  const iconSize = 20 * 1.3; // Approximately 1.3 times the original size (26)

  return (
    // Overall page container - handles vertical layout and overall page scrolling
    // Add a top margin to push content below the fixed header
    // Adjusted mt value slightly to account for increased header height
    <div className="flex flex-col items-center mt-[72px] pb-16 min-h-screen">
      {" "}
      {/* Adjusted mt-[68px] to mt-[72px] */}
      {/* Fixed Article Nav Bar (similar to Pocket's) - Positioned fixed at the very top */}
      {/* Increased vertical padding (py-4) to increase header height */}
      <div className="fixed top-0 w-full bg-white border-b border-gray-200 z-20 flex items-center justify-center py-4 px-4">
        {" "}
        {/* Increased py-2 to py-4 */}
        {/* Reading progress bar - Moved inside the header, positioned at the bottom */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-orange-500 z-30"
          style={{ width: `${readingProgress}%` }}
        ></div>
        {/* Left section: Back button - Positioned absolutely to the left */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors z-40"
          aria-label="Back to Saves"
        >
          {/* Increased icon size */}
          <ArrowLeft size={iconSize} className="text-gray-600" />
        </button>
        {/* Middle section: Action icons - Centered by the parent flex container */}
        <div className="flex items-center space-x-4">
          {/* Favorite/Unfavorite Icon - Star */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Favorite/Unfavorite Article"
          >
            {article.is_favorite ? (
              <Star
                size={iconSize}
                className="text-yellow-500 fill-yellow-500"
              /> // Filled and yellow if favorited
            ) : (
              <Star size={iconSize} className="text-gray-600" /> // Empty if not favorited
            )}
          </button>
          {/* Tag (Highlighter) Icon */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tag Article"
          >
            {/* Increased icon size */}
            <Highlighter size={iconSize} className="text-gray-600" />{" "}
            {/* Using Highlighter icon */}
          </button>
          {/* Archive/Unarchive Icon - Book */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Archive/Unarchive Article"
          >
            {/* Increased icon size */}
            {article.is_read ? (
              <BookUp size={iconSize} className="text-orange-500" /> // BookUp if read (archived)
            ) : (
              <BookDown size={iconSize} className="text-gray-600" /> // BookDown if not read (in saves)
            )}
          </button>
          {/* Delete Icon - Trash */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Delete Article"
          >
            {/* Increased icon size */}
            <Trash2 size={iconSize} className="text-gray-600" />{" "}
            {/* Using Trash2 icon */}
          </button>
          {/* Share and Display Settings icons removed as requested */}
        </div>
        {/* Right section: Placeholder to balance the back button */}
        {/* Adjusted width slightly as two icons were removed */}
      </div>
      {/* Article content container - wraps title, byline, and main content */}
      {/* Apply max-width and center horizontally */}
      {/* Added ref here for scroll height measurement */}
      <div ref={contentRef} className="max-w-[718px] mx-auto w-full">
        {/* Article Title and Byline - Restored and centered */}
        {/* Added px-40 to align with the inner content padding */}
        <div className="text-center mb-8 px-[40px]">
          <h1 className="text-[35px] font-bold mb-2">{article.title}</h1>
          {article.byline && (
            <p className="text-gray-600 text-[25px]">{article.byline}</p>
          )}
        </div>

        {/* Main Article content */}
        {/* Apply 40px padding and updated prose classes for typography */}
        <div
          className="prose max-w-none text-left p-[40px]"
          style={{
            "--tw-prose-body": "25px", // Base text size
            "--tw-prose-headings": "35px", // h1, h2, h3, etc. size
            "line-height": "1.5", // Line height
            "--tw-prose-lead": "25px",
            "--tw-prose-blockquote": "25px",
            "--tw-prose-figure-captions": "25px",
            "--tw-prose-code": "25px",
            "--tw-prose-li": "25px",
            "--tw-prose-td-th": "25px",
            "font-size": "25px", // Apply base text size to the prose container as fallback
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
}

export default ArticleView;
