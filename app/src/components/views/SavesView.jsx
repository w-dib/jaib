import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ArticleGrid from "../ArticleGrid";
import ArticleGridSkeleton from "../ArticleGridSkeleton";

function SavesView({ refreshKey }) {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaves = async () => {
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
          .eq("is_read", false) // For Saves, is_read is false
          .order("saved_at", { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error("Error fetching saved articles:", err);
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSaves();
  }, [user, refreshKey]);

  const handleArticleDeleted = (deletedArticleId) => {
    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== deletedArticleId)
    );
  };

  const handleArticleArchived = (archivedArticleId, newArchiveStatus) => {
    // When an article is archived (is_read becomes true), it should be removed from SavesView.
    // When unarchived (is_read becomes false), it should ideally appear here.
    // The refreshKey prop change from Navbar will trigger a refetch, handling the latter.
    // For immediate removal from this view when archived:
    if (newArchiveStatus === true) {
      setArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== archivedArticleId)
      );
    }
    // If it's unarchived (newArchiveStatus === false), we could potentially add it back to the list,
    // but a full refresh via refreshKey is often more robust for consistency.
    // For now, we only handle immediate removal from this view.
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
        <p className="text-gray-500">No articles saved yet. Add some!</p>
      </div>
    );
  }

  return (
    <ArticleGrid
      articles={articles}
      onArticleDeleted={handleArticleDeleted}
      onArticleArchived={handleArticleArchived}
    />
  );
}

export default SavesView;
