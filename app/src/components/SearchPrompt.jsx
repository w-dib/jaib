import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Search as SearchIcon, X, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "../../components/ui/input";
import logo from "../assets/icon48.png";
import { supabase } from "../lib/supabase"; // Import Supabase client

// Skeleton component for search results
const SkeletonSearchResultItem = () => (
  <li className="p-4 border border-gray-200 rounded-lg">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
    <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
    <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
  </li>
);

function SearchPrompt({ isOpen, onClose }) {
  const navigate = useNavigate(); // Initialize navigate
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // To track if a search has been initiated

  // Reset state when prompt opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      setHasSearched(false);
    } else {
      // Clear search term when closing, so it's fresh on reopen
      setSearchTerm("");
    }
  }, [isOpen]);

  // Debounced search function
  const fetchSearchResults = useCallback(async (currentSearchTerm) => {
    if (!currentSearchTerm.trim()) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    // setSearchResults([]); // Keep previous results while loading new ones for smoother UX, or clear them if preferred

    try {
      const { data, error: fetchError } = await supabase
        .from("articles")
        .select("id, title, excerpt, url")
        .ilike("title", `%${currentSearchTerm.trim()}%`)
        .order("saved_at", { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error("Error fetching articles:", fetchError);
        throw fetchError;
      }
      setSearchResults(data || []);
    } catch (err) {
      setError(
        err.message || "An error occurred while fetching search results."
      );
      setSearchResults([]); // Clear results on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array for useCallback, as supabase client is stable

  // useEffect for debouncing
  useEffect(() => {
    if (!isOpen) return; // Don't run if prompt is not open

    // If search term is empty, reset and don't search
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      // setHasSearched(false); // Keep hasSearched based on whether a search was actually triggered
      if (hasSearched && !isLoading) setHasSearched(false); // Reset only if a search completed/was attempted
      return;
    }

    // Set loading true immediately when user types for responsive skeleton UI
    // but only if there's a search term that will trigger a search.
    if (searchTerm.trim()) {
      setIsLoading(true);
      setHasSearched(true); // A search is about to be initiated
      setError(null); // Clear previous errors
    }

    const timerId = setTimeout(() => {
      fetchSearchResults(searchTerm);
    }, 500); // 500ms debounce time

    return () => clearTimeout(timerId); // Cleanup timeout
  }, [searchTerm, isOpen, fetchSearchResults, hasSearched]); // Added hasSearched here to re-evaluate initial message logic

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center">
      {/* Top Bar with Logo and Close Button */}
      <div className="w-full flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close Search"
        >
          <X size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col items-center w-full max-w-xl px-4 pt-8 pb-4 overflow-y-auto">
        <div className="relative w-full mb-6">
          <SearchIcon
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="search"
            placeholder="Search your Jaib..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
            autoFocus
          />
        </div>

        {/* Search Results Area */}
        <div className="w-full flex-grow">
          {isLoading && (
            <ul className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <SkeletonSearchResultItem key={index} />
              ))}
            </ul>
          )}
          {error && !isLoading && (
            <div className="text-red-600 bg-red-50 p-3 rounded-md flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              <p>Error: {error}</p>
            </div>
          )}
          {!isLoading &&
            !error &&
            searchResults.length === 0 &&
            hasSearched &&
            searchTerm.trim() && (
              <div className="text-center text-gray-500 pt-8">
                <SearchIcon size={48} className="mx-auto mb-2" />
                <p>No results found for "{searchTerm}".</p>
                <p className="text-sm">Try searching for something else.</p>
              </div>
            )}
          {!isLoading &&
            !error &&
            searchResults.length === 0 &&
            !hasSearched && (
              <div className="text-center text-gray-400 pt-8">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Search your saved articles
                </h2>
                <p>Find articles by title.</p>
              </div>
            )}
          {!isLoading && !error && searchResults.length > 0 && (
            <ul className="space-y-3">
              {searchResults.map((article) => (
                <li
                  key={article.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    navigate(`/article/${article.id}`); // Navigate to internal article route
                    onClose();
                  }}
                >
                  <h3 className="text-base font-semibold text-orange-600 mb-1 truncate">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.excerpt || "No excerpt available."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPrompt;
