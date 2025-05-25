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
import { supabase } from "../lib/supabase"; // Corrected import path
import { useAuth } from "../contexts/AuthContext"; // Corrected import path

function ArticleCard({ article }) {
  const navigate = useNavigate();
  const { user } = useAuth(); // Added
  const [imageLoading, setImageLoading] = useState(true);
  // We need a way to reflect changes in the UI immediately.
  // Adding local state for isFavorited and isArchived.
  // Initialize with prop values, but allow local updates.
  const [isFavorited, setIsFavorited] = useState(article.is_favorited);
  const [isArchived, setIsArchived] = useState(article.is_read);

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

  // Get image URL from content
  const imageUrl = extractFirstImageUrl(article.content, article.url);

  // Reset image state when URL changes
  React.useEffect(() => {
    setImageLoading(true);
  }, [imageUrl]);

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on the dropdown menu
    if (e.target.closest(".dropdown-menu")) {
      return;
    }
    navigate(`/article/${article.id}`);
  };

  const handleActionClick = async (e, action) => {
    // Made async
    e.stopPropagation(); // Prevent card click when clicking action buttons
    if (!user) {
      console.error("User not authenticated for action:", action);
      // Optionally, navigate to login or show a message
      return;
    }

    try {
      switch (action) {
        case "favorite": {
          const newFavoriteStatus = !isFavorited;
          const { error: favoriteError } = await supabase
            .from("articles")
            .update({ is_favorited: newFavoriteStatus })
            .eq("id", article.id)
            .eq("user_id", user.id);
          if (favoriteError) throw favoriteError;
          setIsFavorited(newFavoriteStatus); // Update local state
          console.log(
            `Article ${
              newFavoriteStatus ? "favorited" : "unfavorited"
            } successfully.`
          );
          break;
        }
        case "archive": {
          const newArchiveStatus = !isArchived;
          const { error: archiveError } = await supabase
            .from("articles")
            .update({ is_read: newArchiveStatus }) // 'is_read' for archive
            .eq("id", article.id)
            .eq("user_id", user.id);
          if (archiveError) throw archiveError;
          setIsArchived(newArchiveStatus); // Update local state
          console.log(
            `Article ${
              newArchiveStatus ? "archived" : "unarchived"
            } successfully.`
          );
          break;
        }
        case "delete": {
          // Add a confirmation dialog here in a real app
          const { error: deleteError } = await supabase
            .from("articles")
            .delete()
            .eq("id", article.id)
            .eq("user_id", user.id);
          if (deleteError) throw deleteError;
          console.log("Article deleted successfully.");
          // Optionally, navigate away or refresh the list
          // For now, we can just log or perhaps make the card disappear
          // This might require lifting state up or a callback prop
          // For simplicity, we'll just log and the card remains (will disappear on next fetch)
          break;
        }
        case "share": {
          // Implement share functionality (e.g., using navigator.share if available)
          if (navigator.share) {
            navigator
              .share({
                title: article.title,
                text: `Check out this article: ${article.title}`,
                url: article.url,
              })
              .then(() => console.log("Successful share"))
              .catch((error) => console.log("Error sharing", error));
          } else {
            console.log(
              "Share not supported on this browser, copy URL to clipboard or implement custom share UI."
            );
            // Fallback: copy to clipboard
            navigator.clipboard
              .writeText(article.url)
              .then(() => console.log("URL copied to clipboard!"))
              .catch((err) => console.error("Failed to copy URL: ", err));
          }
          break;
        }
        default:
          console.log(`Action clicked: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error.message);
      // Optionally, show an error message to the user
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
              alt={article.title}
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
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Image size={24} className="mb-2" />
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-1 line-clamp-2 text-left">
          {article.title}
        </h3>

        <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
          {/* Source (Base URL) and Reading Time */}
          <div className="flex flex-col items-start">
            <p className="text-sm text-gray-600 line-clamp-1">
              {getBaseUrl(article.url)}
            </p>
            <span>
              {calculateReadingTime(article.excerpt || article.title)}
            </span>
          </div>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
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
                {isFavorited ? (
                  <Star
                    size={16}
                    className="mr-2 text-yellow-500 fill-yellow-500"
                  />
                ) : (
                  <Star size={16} className="mr-2" />
                )}
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
    </div>
  );
}

export default ArticleCard;
