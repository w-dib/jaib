import React from "react";
import ArticleCard from "./ArticleCard";

function ArticleGrid({
  articles,
  onArticleDeleted,
  onArticleArchived,
  onArticleFavorited,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
  );
}

export default ArticleGrid;
