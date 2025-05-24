import React from "react";
import { MoreHorizontal, Trash, Share2, Archive, Bookmark } from "lucide-react"; // Import necessary Lucide icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"; // Corrected import path based on user feedback

function ArticleCard({ article }) {
  // Placeholder function for calculating reading time
  const calculateReadingTime = (text) => {
    if (!text) return "N/A";
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
      {/* Placeholder for Image */}
      <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
        {/* Replace with actual image later */}
        <span className="text-gray-500">Image Placeholder</span>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">
          {article.title}
        </h3>

        {/* Byline/Source */}
        {article.byline && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            By: {article.byline}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
          {/* Reading Time */}
          <span>
            {calculateReadingTime(article.excerpt || article.title)}
          </span>{" "}
          {/* Using excerpt or title for word count */}
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
