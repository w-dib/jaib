import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Trash,
  Share2,
  Image,
  Star,
  BookDown,
  BookUp,
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

function ArticleCard({
  article,
  onArticleDeleted,
  onArticleArchived,
  onArticleFavorited,
}) {
  const navigate = useNavigate();
  const { user } = useAuth(); // Added
  const [imageLoading, setImageLoading] = useState(true);
  // We need a way to reflect changes in the UI immediately.
  // Adding local state for isFavorited and isArchived.
  // Initialize with prop values, but allow local updates.
  const [isFavorited, setIsFavorited] = useState(article.is_favorite);
  const [isArchived, setIsArchived] = useState(article.is_read);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Added state for delete dialog

  // Sync local state with prop changes
  React.useEffect(() => {
    setIsFavorited(article.is_favorite);
  }, [article.is_favorite]);

  React.useEffect(() => {
    setIsArchived(article.is_read);
  }, [article.is_read]);

  // Function to extract first image URL from content with better URL handling
  const extractFirstImageUrl = (content, baseUrl) => {
    if (!content) {
      // console.log("Article data for image extraction (no content):", article);
      return null;
    }

    // console.log("Content to parse for image:", content.substring(0, 300) + "...");

    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
    const match = content.match(imgRegex);

    if (!match || !match[1]) {
      // console.log("No image src found in content with regex.");
      return null;
    }

    let imageUrl = match[1].trim();
    // console.log("Initial matched image URL:", imageUrl);

    let parsedBaseUrl;
    try {
      parsedBaseUrl = new URL(baseUrl);
    } catch (e) {
      console.error(
        "Invalid baseUrl provided to extractFirstImageUrl:",
        baseUrl,
        "Error:",
        e
      );
      return null; // Cannot resolve relative URLs without a valid base
    }

    if (imageUrl.startsWith("//")) {
      imageUrl = `${parsedBaseUrl.protocol}${imageUrl}`;
      // console.log("Converted protocol-relative URL to:", imageUrl);
    } else if (imageUrl.startsWith("/")) {
      // Path-relative, not starting with //
      imageUrl = `${parsedBaseUrl.origin}${imageUrl}`;
      // console.log("Converted path-relative URL to:", imageUrl);
    } else if (
      !imageUrl.startsWith("http://") &&
      !imageUrl.startsWith("https://") &&
      !imageUrl.startsWith("data:")
    ) {
      // It's not protocol-relative, not path-relative, and not absolute. Try to resolve it against the base URL's path.
      try {
        imageUrl = new URL(imageUrl, parsedBaseUrl.href).href;
        // console.log("Resolved potentially relative URL against base:", imageUrl);
      } catch (e) {
        console.error(
          "Failed to resolve ambiguous relative URL:",
          imageUrl,
          "against base:",
          parsedBaseUrl.href,
          "Error:",
          e
        );
        return null;
      }
    }
    // If it starts with http://, https://, or data:, it's considered absolute or self-contained.

    // Final validation
    try {
      const finalUrl = new URL(imageUrl);
      // console.log("Final validated image URL:", finalUrl.href);
      return finalUrl.href;
    } catch (e) {
      console.error("Invalid final image URL:", imageUrl, "Error:", e);
      return null;
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
    article.image_url ||
    extractFirstImageUrl(article.content, article.url);

  // Reset image state when URL changes
  React.useEffect(() => {
    setImageLoading(true);
  }, [imageUrl]);

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on elements that should not trigger it (e.g. dropdown trigger, dialog content)
    if (e.target.closest(".actions-trigger-button, .dialog-content-wrapper")) {
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
      className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-pulse flex space-x-4">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={article.title || "Article Image"}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                console.log("Image failed to load:", imageUrl);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full bg-orange-100"></div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-1 line-clamp-2 text-left">
          {article.title || "Untitled Article"}
        </h3>

        <div className="mt-auto flex items-center justify-between text-sm text-gray-500 pt-2">
          {/* Source (Base URL) and Reading Time */}
          <div className="flex flex-col items-start">
            <p className="text-xs text-gray-600 line-clamp-1">
              {getBaseUrl(article.url)}
            </p>
            <span>
              {calculateReadingTime(
                article.excerpt || article.content || article.title
              )}
            </span>
          </div>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100 actions-trigger-button"
                onClick={(e) => e.stopPropagation()}
                aria-label="Article actions"
              >
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dropdown-menu">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Favorite Action */}
              <DropdownMenuItem
                className="flex items-center cursor-pointer"
                onClick={(e) => handleActionClick(e, "favorite")}
              >
                <Star
                  size={16}
                  className={`mr-2 ${
                    isFavorited ? "text-yellow-500 fill-yellow-500" : ""
                  }`}
                />
                {isFavorited ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>

              {/* Archive Action */}
              <DropdownMenuItem
                className="flex items-center cursor-pointer"
                onClick={(e) => handleActionClick(e, "archive")}
              >
                {isArchived ? (
                  <BookUp size={16} className="mr-2 text-orange-500" />
                ) : (
                  <BookDown size={16} className="mr-2" />
                )}
                {isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>

              {/* Delete Action */}
              <DropdownMenuItem
                className="flex items-center cursor-pointer"
                onClick={(e) => handleActionClick(e, "delete")}
              >
                <Trash size={16} className="mr-2" /> Delete
              </DropdownMenuItem>

              {/* Share Action */}
              <DropdownMenuItem
                className="flex items-center cursor-pointer"
                onClick={(e) => handleActionClick(e, "share")}
              >
                <Share2 size={16} className="mr-2" /> Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
    </div>
  );
}

export default ArticleCard;
