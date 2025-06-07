import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Trash,
  Share2,
  Star,
  BookDown,
  BookUp,
  Loader2,
  Tag,
} from "lucide-react"; // Import necessary Lucide icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"; // Corrected import path based on user feedback
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../../components/ui/dialog"; // Added Dialog imports
import { Button } from "../../components/ui/button"; // Added Button import
import { supabase } from "../lib/supabase"; // Corrected import path
import { useAuth } from "../contexts/AuthContext"; // Corrected import path
import ShareDialog from "./ShareDialog"; // ADDED: Import ShareDialog
import TaggingDialog from "./views/TaggingDialog"; // ADDED: Import TaggingDialog

function ArticleCard({
  article,
  onArticleDeleted,
  onArticleArchived,
  onArticleFavorited,
}) {
  const navigate = useNavigate();
  const { user } = useAuth(); // Added
  const [imageLoading, setImageLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false); // New state for image load failure
  // We need a way to reflect changes in the UI immediately.
  // Adding local state for isFavorited and isArchived.
  // Initialize with prop values, but allow local updates.
  const [isFavorited, setIsFavorited] = useState(article.is_favorite);
  const [isArchived, setIsArchived] = useState(article.is_read);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Added state for delete dialog
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false); // ADDED: State for ShareDialog
  const [isTaggingDialogOpen, setIsTaggingDialogOpen] = useState(false); // ADDED: State for TaggingDialog

  // Define orange shades for the placeholder
  const orangeShades = [
    "bg-orange-100 text-orange-600",
    "bg-orange-200 text-orange-700",
    "bg-orange-300 text-orange-800",
  ];

  // Sync local state with prop changes
  React.useEffect(() => {
    setIsFavorited(article.is_favorite);
  }, [article.is_favorite]);

  React.useEffect(() => {
    setIsArchived(article.is_read);
  }, [article.is_read]);

  // Function to extract first image URL from content with better URL handling
  const extractFirstImageUrl = (content, baseUrl) => {
    if (!content) return null;
    // Simpler regex to avoid tool escaping issues, might be less robust for complex HTML attributes
    const imgRegex = /<img[^>]+src=(?:"([^"]+)"|'([^']+)')/i;
    const match = content.match(imgRegex);
    if (!match) return null;
    let imageUrl = match[1] || match[2]; // Get src from either double or single quotes
    if (!imageUrl) return null;
    imageUrl = imageUrl.trim();

    try {
      const base = new URL(baseUrl);
      // Handle protocol-relative URLs
      if (imageUrl.startsWith("//")) imageUrl = `${base.protocol}${imageUrl}`;
      // Handle root-relative URLs
      else if (imageUrl.startsWith("/")) imageUrl = `${base.origin}${imageUrl}`;
      // Handle other relative URLs (needs base to resolve properly)
      else if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:"))
        imageUrl = new URL(imageUrl, base.href).href;

      // Final validation if it looks like a URL
      return new URL(imageUrl).href;
    } catch (e) {
      console.error(
        "Error parsing/resolving image URL:",
        imageUrl,
        "Base:",
        baseUrl,
        e
      );
      return null; // Return null if any error during URL construction/validation
    }
  };

  // Placeholder function for calculating reading time
  const calculateReadingTime = (text) => {
    if (!text) return "N/A";
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Function to extract base URL
  const getBaseUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.replace(/^www\./, "");
    } catch {
      return "Source";
    }
  };

  // Get image URL from content, prioritizing a direct lead_image_url or image_url prop if available
  const imageUrl =
    article.lead_image_url ||
    extractFirstImageUrl(article.content, article.url);

  // Reset image state when URL changes or article itself changes
  useEffect(() => {
    setImageLoading(!!imageUrl); // Set loading only if there IS an image URL to attempt
    setImageFailed(false);
  }, [imageUrl]);

  const handleImageError = () => {
    setImageLoading(false);
    setImageFailed(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageFailed(false);
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on elements that should not trigger it
    if (
      e.target.closest(".actions-trigger-button") || // Dropdown trigger
      e.target.closest(".dialog-content-wrapper") || // Dialog content
      e.target.closest(".dropdown-menu-content") || // Dropdown menu content
      e.target.closest("[role='dialog']") // Any dialog element
    ) {
      return;
    }
    navigate(`/article/${article.id}`);
  };

  const handleConfirmDelete = async () => {
    if (!user) {
      console.error("User not authenticated for delete action.");
      return;
    }
    try {
      const { error: deleteError } = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id)
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;
      console.log("Article deleted successfully from ArticleCard.");
      setIsDeleteDialogOpen(false);
      if (onArticleDeleted) {
        onArticleDeleted(article.id); // Callback to parent to update list
      }
    } catch (error) {
      console.error("Error deleting article from ArticleCard:", error);
      // Optionally, show an error message in the dialog or as a toast
      setIsDeleteDialogOpen(false); // Still close dialog on error, or keep open to show error
    }
  };

  const handleActionClick = async (e, action) => {
    e.stopPropagation();
    if (!user) {
      console.error("User not authenticated for action:", action);
      return;
    }
    console.log(`Attempting action: ${action} for article ID: ${article.id}`); // Log action attempt

    try {
      switch (action) {
        case "favorite": {
          const newFavoriteStatus = !isFavorited;
          console.log(
            `Optimistically setting favorite to: ${newFavoriteStatus}`
          );
          setIsFavorited(newFavoriteStatus);

          console.log(
            `Calling Supabase to set is_favorite=${newFavoriteStatus} for article ${article.id}`
          );
          const { error } = await supabase
            .from("articles")
            .update({ is_favorite: newFavoriteStatus })
            .eq("id", article.id)
            .eq("user_id", user.id);

          if (error) {
            console.error(
              "Supabase error updating favorite status:",
              error.message
            );
            console.log(
              `Reverting optimistic favorite status for article ${article.id}`
            );
            setIsFavorited(!newFavoriteStatus);
            // No throw error here to allow onArticleFavorited to still be called for potential UI cleanup
          } else {
            console.log(
              `Supabase favorite status updated successfully for article ${article.id}.`
            );
          }

          if (onArticleFavorited) {
            console.log(
              `Calling onArticleFavorited callback for article ${article.id} with status ${newFavoriteStatus}`
            );
            onArticleFavorited(article.id, newFavoriteStatus, error); // Pass error to callback
          }
          break;
        }
        case "archive": {
          const newArchiveStatus = !isArchived;
          setIsArchived(newArchiveStatus);
          const { error } = await supabase
            .from("articles")
            .update({ is_read: newArchiveStatus })
            .eq("id", article.id)
            .eq("user_id", user.id);
          if (error) {
            setIsArchived(!newArchiveStatus);
            console.error("Error updating archive status:", error);
          } else {
            if (onArticleArchived) {
              onArticleArchived(article.id, newArchiveStatus);
            }
          }
          break;
        }
        case "delete":
          setIsDeleteDialogOpen(true);
          break;
        case "share":
          console.log("Share action clicked (currently no-op)");
          break;
        case "tag":
          console.log("Tag action clicked (currently no-op)");
          break;
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      // This will catch errors re-thrown from specific cases if any, or unexpected errors
      console.error(
        `General error in handleActionClick for (${action}) on article ${article.id}:`,
        error.message
      );
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && handleCardClick(e)}
    >
      {/* Image or Placeholder */}
      <div className="relative w-full aspect-[16/9] bg-gray-100 group overflow-hidden">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={article.title || "Article image"}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : article.title ? (
          <div
            className={`w-full h-full flex items-center justify-center ${
              orangeShades[
                Math.abs(article.title.charCodeAt(0) % orangeShades.length)
              ] || orangeShades[0]
            } select-none`}
          >
            <span className="text-5xl font-bold opacity-80">
              {article.title.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 select-none">
            <BookDown size={48} className="text-gray-400" />
          </div>
        )}
        {imageLoading && imageUrl && !imageFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3
            className="font-semibold text-lg mb-1 text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-2"
            title={article.title}
          >
            {article.title || "Untitled Article"}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">
              {article.excerpt}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span className="truncate pr-2" title={getBaseUrl(article.url)}>
            {getBaseUrl(article.url)}
          </span>
          <div className="flex items-center flex-shrink-0">
            <span className="mr-2">
              {calculateReadingTime(article.content || article.excerpt)}
            </span>
            {/* Actions Trigger Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="actions-trigger-button p-1.5 -m-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Article actions"
                  onClick={(e) => e.stopPropagation()} // Prevent card click
                >
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="dropdown-menu-content dialog-content-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(e, "favorite");
                  }}
                  className={
                    isFavorited
                      ? "text-orange-600 focus:bg-orange-50 focus:text-orange-700"
                      : ""
                  }
                >
                  <Star
                    size={16}
                    className={`mr-2 ${isFavorited ? "fill-current" : ""}`}
                  />
                  {isFavorited ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(e, "archive");
                  }}
                >
                  <BookUp size={16} className="mr-2" />
                  {isArchived ? "Mark as Unread" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTaggingDialogOpen(true);
                  }}
                >
                  <Tag size={16} className="mr-2" />
                  Tag URL
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareDialogOpen(true);
                  }}
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <Trash size={16} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Prevent card click when dialog is closed
            const event = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            event.stopPropagation();
          }
        }}
      >
        <DialogContent
          className="dialog-content-wrapper sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Delete Article?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{article.title || "this article"}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog for Article Card */}
      {article && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onOpenChange={(open) => {
            setIsShareDialogOpen(open);
            if (!open) {
              // Prevent card click when dialog is closed
              const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              event.stopPropagation();
            }
          }}
          article={article}
        />
      )}

      {/* Tagging Dialog for Article Card */}
      {article && (
        <TaggingDialog
          isOpen={isTaggingDialogOpen}
          onOpenChange={(open) => {
            setIsTaggingDialogOpen(open);
            if (!open) {
              // Prevent card click when dialog is closed
              const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              event.stopPropagation();
            }
          }}
          articleId={article.id}
          userId={user?.id}
        />
      )}
    </div>
  );
}

export default ArticleCard;
