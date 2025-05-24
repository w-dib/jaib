import React, { useState } from "react";
import {
  MoreHorizontal,
  Trash,
  Share2,
  Archive,
  Bookmark,
  Image,
} from "lucide-react"; // Import necessary Lucide icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"; // Corrected import path based on user feedback

function ArticleCard({ article }) {
  const [imageLoading, setImageLoading] = useState(true);

  // Function to extract first image URL from content with better URL handling
  const extractFirstImageUrl = (content, baseUrl) => {
    if (!content) {
      console.log("Article data:", article);
      return null;
    }

    // Log the content to see what we're working with
    console.log("Content to parse:", content.substring(0, 200) + "...");

    // Updated regex to handle the specific HTML structure
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
    const match = content.match(imgRegex);

    if (!match) {
      console.log("No image tag found in content");
      return null;
    }

    let imageUrl = match[1];
    console.log("Found image URL:", imageUrl);

    // Handle relative URLs
    if (imageUrl.startsWith("/")) {
      try {
        const base = new URL(baseUrl);
        imageUrl = `${base.origin}${imageUrl}`;
        console.log("Converted relative URL to:", imageUrl);
      } catch (e) {
        console.log("Error converting relative URL:", e);
        return null;
      }
    }

    // Validate URL
    try {
      new URL(imageUrl);
      console.log("Final validated URL:", imageUrl);
      return imageUrl;
    } catch (e) {
      console.log("Invalid URL:", e);
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

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
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
              <button className="p-1 rounded-full hover:bg-gray-100">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Trash size={16} className="mr-2" /> Delete
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Share2 size={16} className="mr-2" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Archive size={16} className="mr-2" />{" "}
                {article.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Bookmark size={16} className="mr-2" />{" "}
                {article.isFavorited ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
