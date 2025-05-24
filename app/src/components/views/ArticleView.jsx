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

// Import ShadCN Dialog components with corrected path
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button"; // Corrected path

function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null); // Ref for the article content div
  const [readingProgress, setReadingProgress] = useState(0); // State for reading progress

  // Local state for favorite and read status, initialized from fetched article
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
        setArticle(null); // Ensure article is null on error
      } else {
        setArticle(data);
        // Initialize local state from fetched article data
        setIsFavorited(data?.is_favorite || false);
        setIsRead(data?.is_read || false);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id, user]); // Dependency on id and user

  // Effect for calculating reading progress
  useEffect(() => {
    const handleWindowScroll = () => {
      if (!contentRef.current) return;

      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
      const progress = scrolled * 100;

      setReadingProgress(progress);
    };

    window.addEventListener("scroll", handleWindowScroll);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [article]); // Re-run effect when article content loads

  // Recalculate progress when article loads
  useEffect(() => {
    const handleInitialProgress = () => {
      setTimeout(() => {
        if (!contentRef.current) return;
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY;
        const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
        const progress = scrolled * 100;
        setReadingProgress(progress);
      }, 100);
    };
    if (article) {
      handleInitialProgress();
    }
  }, [article]);

  // Handle favoriting/unfavoriting
  const handleFavoriteToggle = async () => {
    if (!user || !article) return;
    const newState = !isFavorited;
    setIsFavorited(newState); // Optimistically update UI

    const { error } = await supabase
      .from("articles")
      .update({ is_favorite: newState })
      .eq("id", article.id);

    if (error) {
      console.error("Error updating favorite status:", error);
      setIsFavorited(!newState); // Revert UI on error
      // Optionally show an error message to the user
    } else {
      console.log("Favorite status updated successfully");
    }
  };

  // Handle archiving/unarchiving (marking as read/unread)
  const handleArchiveToggle = async () => {
    if (!user || !article) return;
    const newState = !isRead;
    setIsRead(newState); // Optimistically update UI

    const { error } = await supabase
      .from("articles")
      .update({ is_read: newState })
      .eq("id", article.id);

    if (error) {
      console.error("Error updating read status:", error);
      setIsRead(!newState); // Revert UI on error
      // Optionally show an error message
    } else {
      console.log("Read status updated successfully");
      // Decide if we should navigate back after archiving/unarchiving
      // navigate('/'); // Example: navigate back to Saves after archiving
    }
  };

  // Handle article deletion
  const handleDeleteArticle = async () => {
    if (!user || !article) return;

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", article.id);

    if (error) {
      console.error("Error deleting article:", error);
      // Optionally show an error message
    } else {
      console.log("Article deleted successfully");
      setIsDeleteDialogOpen(false); // Close dialog
      navigate("/"); // Navigate back to Saves view after deletion
    }
  };

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
            onClick={handleFavoriteToggle} // Added onClick handler
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Favorite/Unfavorite Article"
          >
            {isFavorited ? ( // Use local state
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
            onClick={handleArchiveToggle} // Added onClick handler
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Archive/Unarchive Article"
          >
            {/* Increased icon size */}
            {isRead ? ( // Use local state
              <BookUp size={iconSize} className="text-orange-500" /> // BookUp if read (archived)
            ) : (
              <BookDown size={iconSize} className="text-gray-600" /> // BookDown if not read (in saves)
            )}
          </button>
          {/* Delete Icon - Trash */}
          {/* Wrap delete button in DialogTrigger */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Delete Article"
              >
                {/* Increased icon size */}
                <Trash2 size={iconSize} className="text-gray-600" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this article? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                {/* Add delete button inside dialog */}
                <Button variant="destructive" onClick={handleDeleteArticle}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share and Display Settings icons removed as requested */}
        </div>
        {/* Right section: Placeholder to balance the back button */}
        {/* Adjusted width slightly as two icons were removed */}
        <div className="w-10 flex-shrink-0"></div> {/* Placeholder div */}
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
