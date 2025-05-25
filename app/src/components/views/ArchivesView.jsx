import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ArticleGrid from "../ArticleGrid";
import ArticleGridSkeleton from "../ArticleGridSkeleton";

function ArchivesView({ refreshKey }) {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchives = async () => {
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
          .eq("is_read", true) // For Archives, is_read is true
          .order("saved_at", { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error("Error fetching archived articles:", err);
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArchives();
  }, [user, refreshKey]);

  const handleArticleDeleted = (deletedArticleId) => {
    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== deletedArticleId)
    );
  };

  const handleArticleArchived = (archivedArticleId, newArchiveStatus) => {
    // When an article is unarchived (is_read becomes false), it should be removed from ArchivesView.
    // When archived (is_read becomes true), it should appear here.
    // The refreshKey prop change from Navbar will trigger a refetch, handling the latter.
    // For immediate removal from this view when unarchived:
    if (newArchiveStatus === false) {
      setArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== archivedArticleId)
      );
    }
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
        <p className="text-gray-500">No articles in archives yet.</p>
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

export default ArchivesView;
