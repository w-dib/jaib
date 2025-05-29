import React from "react";
import ArticleCard from "./ArticleCard";
import {
  ListFilter, // New icon for dropdown trigger
  ArrowDownNarrowWide, // For "Oldest first"
  ArrowUpNarrowWide, // For "Newest first"
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu"; // Correct path assuming it's at this level
import { Button } from "../../components/ui/button";

function ArticleGrid({
  articles,
  onArticleDeleted,
  onArticleArchived,
  onArticleFavorited,
  onSetSortOrder, // Changed from onSortToggle
  sortOrder,
}) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        {onSetSortOrder && typeof sortOrder !== "undefined" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline" // Changed to outline for a more distinct look, like the image
                size="icon" // Make it a square icon button
                className="p-2 text-gray-600 hover:text-gray-700 border rounded-md" // Adjusted styling
                aria-label="Sort articles"
              >
                <ListFilter size={20} className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSetSortOrder("asc")}>
                <ArrowDownNarrowWide size={16} className="mr-2 h-4 w-4" />
                <span>Oldest first</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetSortOrder("desc")}>
                <ArrowUpNarrowWide size={16} className="mr-2 h-4 w-4" />
                <span>Newest first</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 
          This is where you will map over the 'articles' array
          and render each article item. You might want to create
          a separate component for displaying a single article item.
        */}
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onArticleDeleted={onArticleDeleted}
            onArticleArchived={onArticleArchived}
            onArticleFavorited={onArticleFavorited}
          />
        ))}
      </div>
    </div>
  );
}

export default ArticleGrid;
