import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ArticleGrid from "../ArticleGrid";
import ArticleGridSkeleton from "../ArticleGridSkeleton";

function FavoritesView({ refreshKey }) {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setArticles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("articles")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_favorite", true)
          .order("saved_at", { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error("Error fetching favorite articles:", err);
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, refreshKey]);

  const handleArticleDeleted = (deletedArticleId) => {
    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== deletedArticleId)
    );
  };

  const handleArticleFavorited = (
    favoritedArticleId,
    newFavoriteStatus,
    error
  ) => {
    if (!error && newFavoriteStatus === false) {
      console.log(
        `Removing article ${favoritedArticleId} from FavoritesView due to unfavorite.`
      );
      setArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== favoritedArticleId)
      );
    } else if (error) {
      console.log(
        `Favorite update for article ${favoritedArticleId} failed, not removing from FavoritesView.`
      );
    }
  };

  const handleArticleArchived = (archivedArticleId, newArchiveStatus) => {
    console.log(
      `Article ${archivedArticleId} archive status changed to ${newArchiveStatus}, FavoritesView taking no direct list action.`
    );
  };

  if (loading) {
    return <ArticleGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading articles: {error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No favorite articles yet.</p>
      </div>
    );
  }

  return (
    <ArticleGrid
      articles={articles}
      onArticleDeleted={handleArticleDeleted}
      onArticleArchived={handleArticleArchived}
      onArticleFavorited={handleArticleFavorited}
    />
  );
}

export default FavoritesView;
