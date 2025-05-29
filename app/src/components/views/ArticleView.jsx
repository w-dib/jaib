import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  ArrowLeft,
  Highlighter as HighlighterIcon,
  Share2 as ShareIcon,
} from "lucide-react";
// Import updated icons based on user feedback
import {
  Star, // For Favorite/Unfavorite
  Highlighter, // For Tag (as Placeholder)
  BookDown, // For Archive (if not read)
  BookUp, // For Archive (if read)
  Trash2, // For Delete
  ExternalLink, // Added for View Original link
  Tag, // IMPORTED: For Tagging
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip"; // Added Tooltip imports
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "../../../components/ui/popover"; // Added Popover imports
import ArticleViewSkeleton from "../ArticleViewSkeleton"; // Added import for skeleton
import TaggingDialog from "./TaggingDialog"; // IMPORTED: For Tagging Dialog

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
  const [isTaggingDialogOpen, setIsTaggingDialogOpen] = useState(false); // ADDED: State for tagging dialog

  // State for text selection popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverAnchorRect, setPopoverAnchorRect] = useState(null); // Stores { top, left, width, height } for PopoverAnchor
  const [selectionRects, setSelectionRects] = useState([]); // Stores DOMRects for drawing custom highlights
  const [currentSelectionRange, setCurrentSelectionRange] = useState(null);
  const popoverRef = useRef(null);
  const [savedHighlights, setSavedHighlights] = useState([]); // State for persisted highlights
  const [selectedTextContent, setSelectedTextContent] = useState(""); // State for the actual selected text

  useEffect(() => {
    if (article && article.title) {
      document.title = `Jaib - ${article.title}`;
    } else {
      document.title = "Jaib"; // Default title if no article or title
    }

    // Cleanup function to reset title when component unmounts or article changes
    return () => {
      document.title = "Jaib";
    };
  }, [article]); // Re-run effect when article changes

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
        .select("*, last_read_scroll_percentage")
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

        // Apply saved scroll position
        if (
          data?.last_read_scroll_percentage &&
          data.last_read_scroll_percentage > 0 &&
          data.last_read_scroll_percentage < 100
        ) {
          // Apply after a short delay to allow content to render and height to be calculated
          setTimeout(() => {
            if (contentRef.current) {
              // Ensure contentRef is available
              const scrollableHeight =
                document.body.scrollHeight - window.innerHeight;
              if (scrollableHeight > 0) {
                const targetScrollTop =
                  scrollableHeight * (data.last_read_scroll_percentage / 100);
                window.scrollTo({ top: targetScrollTop, behavior: "auto" }); // 'auto' for instant jump
              }
            }
          }, 300); // Adjust delay if necessary
        }
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

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      // Only save if article is loaded, user exists, and progress is meaningful
      if (
        user &&
        article &&
        article.id &&
        readingProgress > 0 &&
        readingProgress < 99
      ) {
        // Avoid saving 100% if they finished
        const savePosition = async () => {
          try {
            const { error: updateError } = await supabase
              .from("articles")
              .update({ last_read_scroll_percentage: readingProgress })
              .eq("id", article.id)
              .eq("user_id", user.id); // Ensure user owns the article, RLS also protects this

            if (updateError) {
              console.error("Error saving scroll position:", updateError);
            } else {
              console.log(
                "Scroll position saved:",
                readingProgress,
                "for article ID:",
                article.id
              );
            }
          } catch (e) {
            console.error("Exception while saving scroll position:", e);
          }
        };
        // Check if navigator.sendBeacon is available for more reliable background sync
        // For simplicity now, we'll do a direct async call.
        // In a real app, consider navigator.sendBeacon for unmount tasks if the save must be guaranteed.
        savePosition();
      }
    };
  }, [user, article, readingProgress, supabase]); // Dependencies for the cleanup effect

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

  const handleSaveHighlight = async () => {
    console.log("[handleSaveHighlight] Called");
    console.log(
      "[handleSaveHighlight] selectedTextContent from state:",
      selectedTextContent
    );
    console.log("[handleSaveHighlight] article:", article);
    console.log("[handleSaveHighlight] user:", user);

    if (!article || !user) {
      console.error("[handleSaveHighlight] Aborting: Missing article or user.");
      return;
    }

    const selectedText = selectedTextContent.trim();
    console.log(
      "[handleSaveHighlight] selectedText (from state, trimmed):",
      selectedText
    );

    if (!selectedText) {
      console.warn(
        "[handleSaveHighlight] Aborting: Selected text is empty after trim."
      );
      return; // Don't save empty selections
    }

    const selectorInfo = {
      type: "text-quote",
      quote: selectedText,
    };

    const annotationData = {
      article_id: article.id,
      user_id: user.id,
      selector_info: selectorInfo,
      note: selectedText,
    };
    console.log(
      "[handleSaveHighlight] Attempting to save to Supabase with data:",
      annotationData
    );

    try {
      const { data, error } = await supabase
        .from("annotations")
        .insert([annotationData])
        .select()
        .single();

      console.log("[handleSaveHighlight] Supabase response data:", data);
      console.log("[handleSaveHighlight] Supabase response error:", error);

      if (error) {
        console.error(
          "[handleSaveHighlight] Error saving highlight to Supabase:",
          error
        );
        return;
      }

      if (data) {
        console.log("[handleSaveHighlight] Successfully saved. DB Data:", data);
        setSavedHighlights((prevHighlights) => [
          ...prevHighlights,
          {
            id: data.id,
            rects: [...selectionRects],
            text: selectedText,
            selectorInfo: selectorInfo,
          },
        ]);
        setIsPopoverOpen(false);
        setSelectionRects([]);
      }
    } catch (e) {
      console.error("[handleSaveHighlight] Exception during Supabase call:", e);
    }
  };

  // EFFECT: Handle text selection for popover
  useEffect(() => {
    const contentElement = contentRef.current;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if the selection is within the article content
        if (
          contentElement &&
          contentElement.contains(range.commonAncestorContainer)
        ) {
          const rects = Array.from(range.getClientRects()).map((rect) => ({
            top: rect.top + window.scrollY, // Adjust for page scroll
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          }));

          if (rects.length > 0) {
            const firstRect = rects[0];
            const textContent = range.toString(); // Get text content here
            setSelectedTextContent(textContent); // Store it in state

            setPopoverAnchorRect({
              top: firstRect.top - 64, // Adjusted: original 10px offset + 32px (for pt-8 equivalent)
              left: firstRect.left + firstRect.width / 2,
              width: 1, // Anchor can be minimal
              height: 1,
            });
            setSelectionRects(rects);
            setCurrentSelectionRange(range);
            setIsPopoverOpen(true);
            selection.removeAllRanges(); // Clear browser's default highlight
          } else {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        } else {
          // Selection is outside the content area
          if (isPopoverOpen) {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        }
      } else {
        // No selection or selection collapsed
        if (isPopoverOpen) {
          // Only close if it was open
          setIsPopoverOpen(false);
          setSelectionRects([]);
        }
      }
    };

    if (contentElement) {
      contentElement.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [article, isPopoverOpen]); // Rerun if article changes or popover state (to ensure cleanup if an external event closes it)

  // EFFECT: Handle clicks outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        // Check if the click is also outside the content area to avoid immediate re-triggering
        if (contentRef.current && !contentRef.current.contains(event.target)) {
          setIsPopoverOpen(false);
          setSelectionRects([]);
        } else {
          // If click is inside content but not on popover, it might be a new selection attempt or text de-selection
          const selection = window.getSelection();
          if (
            !selection ||
            selection.isCollapsed ||
            selection.rangeCount === 0
          ) {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        }
      }
    };

    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  if (loading) {
    return <ArticleViewSkeleton />; // Use the skeleton component
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

  // Placeholder function for calculating reading time (if not already present or needs adjustment)
  // This might already exist in your ArticleCard or utils, adjust as needed.
  const calculateReadingTime = (text) => {
    if (!text) return "";
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Function to extract base URL (if not already present or needs adjustment)
  // This might already exist in your ArticleCard or utils, adjust as needed.
  const getBaseUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.replace(/^www\./, "");
    } catch {
      return "Source";
    }
  };

  return (
    <>
      {/* Custom Orange Highlight Overlays (Temporary Selection) */}
      {isPopoverOpen &&
        selectionRects.map((rect, index) => (
          <div
            key={`temp-highlight-rect-${index}`}
            style={{
              position: "absolute",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: "rgba(255, 165, 0, 0.3)", // Lighter orange for temporary
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Saved Highlight Overlays */}
      {savedHighlights.map((highlight) =>
        highlight.rects.map((rect, index) => (
          <div
            key={`saved-highlight-${highlight.id}-rect-${index}`}
            style={{
              position: "absolute",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: "rgba(239, 108, 0, 0.4)", // Darker orange for saved (Tailwind orange-600 equivalent at 40% opacity)
              zIndex: 9, // Slightly below temporary highlight/popover if they were to overlap, but above content
              pointerEvents: "none",
            }}
          />
        ))
      )}

      {/* Popover for Text Selection */}
      {isPopoverOpen && popoverAnchorRect && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverAnchor
            style={{
              position: "absolute",
              top: `${popoverAnchorRect.top}px`,
              left: `${popoverAnchorRect.left}px`,
              width: `${popoverAnchorRect.width}px`,
              height: `${popoverAnchorRect.height}px`,
            }}
          />
          <PopoverContent
            ref={popoverRef}
            className="w-auto p-2 shadow-xl rounded-md border bg-white z-50"
            sideOffset={5}
            align="center"
            onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus issues on close
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
                onClick={handleSaveHighlight}
              >
                <HighlighterIcon size={16} />
                <span>Highlight</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ShareIcon size={16} />
                <span>Share</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Overall page container - handles vertical layout and overall page scrolling */}
      {/* Add a top margin to push content below the fixed header */}
      {/* Adjusted mt value slightly to account for increased header height */}
      <div className="flex flex-col items-center mt-[72px] pb-16 min-h-screen">
        {" "}
        {/* Adjusted mt-[68px] to mt-[72px] */}
        {/* Fixed Article Nav Bar - Explicit height set, py-4 removed, px-4 kept */}
        <div className="fixed top-0 w-full bg-white border-b border-gray-200 z-20 flex items-center justify-center h-16 px-4">
          {" "}
          {/* Reading progress bar - Moved inside the header, positioned at the bottom */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-orange-500 z-30"
            style={{ width: `${readingProgress}%` }}
          ></div>
          {/* Left section: Back button - Positioned absolutely to the left */}
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors z-40"
            aria-label="Back to Saves"
          >
            {/* Increased icon size */}
            <ArrowLeft size={iconSize} className="text-gray-600" />
          </button>
          {/* Centered Action Icons Group */}
          {/* This div will be absolutely centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 md:space-x-3 z-30">
            {/* Favorite Button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleFavoriteToggle}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isFavorited ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      size={iconSize}
                      className={
                        isFavorited
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-600"
                      }
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorited ? "Unfavorite" : "Favorite"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Tag Button - ADDED */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsTaggingDialogOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Tag article"
                  >
                    <Tag size={iconSize} className="text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tag article</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Highlight/Tag Button (Placeholder) */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => console.log("Highlight/Tag clicked")}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Add highlight or tag"
                  >
                    <Highlighter size={iconSize} className="text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Highlight/Tag (Soon)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Archive Button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleArchiveToggle}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isRead ? "Unarchive" : "Archive"}
                  >
                    {isRead ? (
                      <BookUp size={iconSize} className="text-orange-500" />
                    ) : (
                      <BookDown size={iconSize} className="text-gray-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRead ? "Move to Saves" : "Archive"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Delete Button with Dialog */}
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Delete article"
                      >
                        <Trash2 size={iconSize} className="text-gray-600" />
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  <Button variant="destructive" onClick={handleDeleteArticle}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>{" "}
          {/* End of Centered Action Icons Group */}
          {/* Right section: Placeholder to balance the back button */}
          {/* Adjusted width slightly as two icons were removed */}
          <div className="w-10 flex-shrink-0"></div> {/* Placeholder div */}
        </div>
        {/* Article content container - wraps title, byline, and main content */}
        {/* Apply max-width and center horizontally */}
        {/* Added ref here for scroll height measurement */}
        <div
          ref={contentRef}
          className="max-w-[718px] mx-auto w-full pt-2 sm:pt-16 pb-16 sm:pb-24 px-2"
        >
          {/* Article Title */}
          <div className="text-center mb-3 px-2 sm:px-[40px]">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight leading-tight">
              {article.title}
            </h1>
          </div>

          {/* Byline, Source URL, Reading Time, and View Original Link */}
          <div className="text-center text-sm text-gray-500 mb-10 md:mb-12 px-2 sm:px-[40px]">
            {article.byline && (
              <span className="mr-2">By {article.byline}</span>
            )}
            {article.byline && article.url && <span className="mr-2">·</span>}
            {article.url && (
              <span className="mr-2">{getBaseUrl(article.url)}</span>
            )}
            {(article.byline || article.url) &&
              (article.content || article.excerpt) && (
                <span className="mr-2">·</span>
              )}
            {(article.content || article.excerpt) && (
              <span>
                {calculateReadingTime(article.content || article.excerpt)}
              </span>
            )}
            {article.url && (
              <div className="mt-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-orange-500 hover:text-orange-600 transition-colors"
                >
                  View Original
                  <ExternalLink size={16} className="ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Lead Image - Added Here */}
          {article.lead_image_url && (
            <div className="px-2 sm:px-[40px] mb-8 md:mb-10">
              <img
                src={article.lead_image_url}
                alt={article.title || "Article lead image"}
                className="w-full h-auto object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Main Article content */}
          <div
            className="max-w-none text-left px-2 sm:px-[40px] prose prose-lg prose-gray mx-auto prose-headings:font-semibold prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:font-medium prose-strong:text-gray-900 prose-em:text-gray-700 prose-blockquote:border-l-orange-500 prose-blockquote:text-gray-600 prose-code:text-gray-900 prose-code:bg-gray-100 prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
        {/* Tagging Dialog - ADDED */}
        {article && (
          <TaggingDialog
            isOpen={isTaggingDialogOpen}
            onOpenChange={setIsTaggingDialogOpen}
            articleId={article.id}
            userId={user?.id}
          />
        )}
      </div>
    </>
  );
}

export default ArticleView;
