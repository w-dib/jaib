import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ArticleGrid from "../ArticleGrid";

function ArchivesView() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [fetchingArticles, setFetchingArticles] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!user) {
        setArticles([]);
        setFetchingArticles(false);
        return;
      }

      setFetchingArticles(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("articles")
        .select("id, title, url, byline, saved_at, content, excerpt")
        .eq("is_read", true);

      if (error) {
        console.error("Error fetching articles:", error);
        setFetchError(error.message);
        setArticles([]);
      } else {
        setArticles(data);
        setFetchError(null);
      }
      setFetchingArticles(false);
    };

    fetchArticles();
  }, [user]);

  if (fetchingArticles) {
    return <p>Loading articles...</p>;
  }

  if (fetchError) {
    return <p className="text-red-500">Error loading articles: {fetchError}</p>;
  }

  if (articles.length === 0) {
    return <p>No archived articles yet.</p>;
  }

  return <ArticleGrid articles={articles} />;
}

export default ArchivesView;
