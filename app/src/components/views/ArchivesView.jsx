import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ArticleGrid from "../ArticleGrid";
import ArticleGridSkeleton from "../ArticleGridSkeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../../../components/ui/pagination"; // Corrected path

const ARTICLES_PER_PAGE = 12;

function ArchivesView({ refreshKey }) {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalArticlesCount, setTotalArticlesCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' for newest first, 'asc' for oldest

  useEffect(() => {
    const fetchArchives = async () => {
      if (!user) {
        setArticles([]);
        setLoading(false);
        setTotalArticlesCount(0);
        setTotalPages(0);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch total count of articles for this view
        const { count, error: countError } = await supabase
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", true); // Filter for archived articles

        if (countError) throw countError;

        setTotalArticlesCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / ARTICLES_PER_PAGE));

        // 2. Fetch articles for the current page
        const from = (currentPage - 1) * ARTICLES_PER_PAGE;
        const to = currentPage * ARTICLES_PER_PAGE - 1;

        const { data, error: fetchError } = await supabase
          .from("articles")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_read", true) // Filter for archived articles
          .order("saved_at", { ascending: sortOrder === "asc" })
          .range(from, to);

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error("Error fetching archived articles:", err);
        setError(err.message);
        setArticles([]);
        setTotalArticlesCount(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArchives();
  }, [user, refreshKey, currentPage, sortOrder]);

  const handleArticleDeleted = (deletedArticleId) => {
    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== deletedArticleId)
    );
    setTotalArticlesCount((prevCount) => prevCount - 1);
    if (articles.length === 1 && currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    } else if (articles.length === 1 && currentPage === 1) {
      setTotalPages(0);
    }
  };

  const handleArticleArchived = (archivedArticleId, newArchiveStatus) => {
    // When an article is unarchived (is_read becomes false), it should be removed from ArchivesView.
    if (newArchiveStatus === false) {
      setArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== archivedArticleId)
      );
      setTotalArticlesCount((prevCount) => prevCount - 1);
      if (articles.length === 1 && currentPage > 1) {
        setCurrentPage((prevPage) => prevPage - 1);
      } else if (articles.length === 1 && currentPage === 1) {
        setTotalPages(0);
      }
    }
    // If it's re-archived (true), refreshKey will handle refetching it.
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSetSortOrder = (newOrder) => {
    setSortOrder(newOrder);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const renderPaginationItems = () => {
    const items = [];
    const pageLimit = 5;
    let startPage, endPage;

    if (totalPages <= pageLimit) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(pageLimit / 2)) {
        startPage = 1;
        endPage = pageLimit;
      } else if (currentPage + Math.floor(pageLimit / 2) >= totalPages) {
        startPage = totalPages - pageLimit + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(pageLimit / 2);
        endPage = currentPage + Math.floor(pageLimit / 2);
      }
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    return items;
  };

  if (loading && articles.length === 0) {
    return <ArticleGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading articles: {error}</p>
      </div>
    );
  }

  if (totalArticlesCount === 0 && !loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No articles in archives yet.</p>
      </div>
    );
  }

  return (
    <>
      <ArticleGrid
        articles={articles}
        onArticleDeleted={handleArticleDeleted}
        onArticleArchived={handleArticleArchived}
        onSetSortOrder={handleSetSortOrder}
        sortOrder={sortOrder}
      />
      {totalPages > 1 && (
        <Pagination className="mt-8 mb-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}

export default ArchivesView;
