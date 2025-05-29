import React from "react";
import ArticleCard from "./ArticleCard";
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip"; // Assuming this path is correct relative to ArticleGrid
import { Button } from "../../components/ui/button";

function ArticleGrid({
  articles,
  onArticleDeleted,
  onArticleArchived,
  onArticleFavorited,
  onSortToggle, // New prop
  sortOrder, // New prop (e.g., 'asc' or 'desc')
}) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        {onSortToggle && typeof sortOrder !== "undefined" && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={onSortToggle}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={
                    sortOrder === "asc"
                      ? "Sort: Oldest to Newest"
                      : "Sort: Newest to Oldest"
                  }
                >
                  {sortOrder === "asc" ? (
                    <ArrowDownNarrowWide size={20} className="size-5" />
                  ) : (
                    <ArrowDownWideNarrow size={20} className="size-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {sortOrder === "asc"
                    ? "Sort: Oldest to Newest"
                    : "Sort: Newest to Oldest"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
