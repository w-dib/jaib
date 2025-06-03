import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthCallback from "./pages/AuthCallback";
import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import ArticleGrid from "./components/ArticleGrid";
import SavesView from "./components/views/SavesView";
import FavoritesView from "./components/views/FavoritesView";
import ArchivesView from "./components/views/ArchivesView";
import ArticleView from "./components/views/ArticleView";
import SaveArticleHandler from "./components/views/SaveArticleHandler";
import { LandingPage } from "./components/LandingPage";
import LogoutHandler from "./components/views/LogoutHandler";
import TagsPage from "./pages/TagsPage";
import SharedArticleHandler from "./components/views/SharedArticleHandler";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import Footer from "./components/Footer";
import HomePageLoggedOut from "./pages/HomePageLoggedOut";
import PocketImportPage from "./pages/PocketImportPage";
import PricingPage from "./pages/PricingPage";
import { Toaster } from "../components/ui/sonner";
import PremiumModal from "./components/PremiumModal";
import AddUrlPrompt from "./components/AddUrlPrompt";
import SearchPrompt from "./components/SearchPrompt";
import ExtensionSetupDialog from "./components/ExtensionSetupDialog";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExtensionSetupOpen, setIsExtensionSetupOpen] = useState(false);

  const triggerArticleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    if (
      user &&
      localStorage.getItem("hasSeenExtensionSetupDialog") !== "true"
    ) {
      setIsExtensionSetupOpen(true);
    }
  }, [user]);

  const handleSearch = (searchTerm) => {
    console.log("App-level search for:", searchTerm);
    setIsSearchOpen(false);
  };

  const handleNavigateToBulkImport = () => {
    navigate("/import-pocket");
  };

  const publicPaths = ["/terms", "/privacy", "/auth/callback", "/pricing"];
  const saveArticlePath = "/save-article";

  const isArticleView = location.pathname.startsWith("/article/");

  if (!user) {
    if (location.pathname === "/") {
      return <HomePageLoggedOut />;
    }
    if (location.pathname === "/login") {
      return <LandingPage />;
    }
    if (
      publicPaths.includes(location.pathname) ||
      location.pathname === "/pricing"
    ) {
      return (
        <Routes>
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      );
    }
    if (location.pathname.startsWith(saveArticlePath)) {
      return (
        <Routes>
          <Route path="/save-article" element={<SaveArticleHandler />} />
        </Routes>
      );
    }
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen dark:bg-gray-900">
      {!isArticleView && (
        <Sidebar
          user={user}
          onSignOut={signOut}
          onArticleAdded={triggerArticleRefresh}
          onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
          onOpenAddUrlModal={() => setIsAddUrlOpen(true)}
          onOpenSearchModal={() => setIsSearchOpen(true)}
          onOpenExtensionSetupDialog={() => setIsExtensionSetupOpen(true)}
        />
      )}
      <main
        className={`flex-grow flex flex-col ${
          !isArticleView ? "md:ml-64" : ""
        }`}
      >
        <div className="flex-grow p-4 md:p-6">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<SavesView refreshKey={refreshKey} />} />
            <Route
              path="/favorites"
              element={<FavoritesView refreshKey={refreshKey} />}
            />
            <Route
              path="/archives"
              element={<ArchivesView refreshKey={refreshKey} />}
            />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/article/:id" element={<ArticleView />} />
            <Route path="/save-article" element={<SaveArticleHandler />} />
            <Route
              path="/save-article-shared"
              element={<SharedArticleHandler />}
            />
            <Route path="/logout" element={<LogoutHandler />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/import-pocket" element={<PocketImportPage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </div>
        {!isArticleView &&
          location.pathname !== "/import-pocket" &&
          location.pathname !== "/pricing" && <Footer />}
      </main>

      {location.pathname !== "/pricing" && isPremiumModalOpen && (
        <PremiumModal onClose={() => setIsPremiumModalOpen(false)} />
      )}
      {isAddUrlOpen && (
        <AddUrlPrompt
          isOpen={isAddUrlOpen}
          onClose={() => setIsAddUrlOpen(false)}
          onAdd={triggerArticleRefresh}
          onNavigateToBulkImport={handleNavigateToBulkImport}
        />
      )}
      {isSearchOpen && (
        <SearchPrompt
          isOpen={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={handleSearch}
        />
      )}
      {isExtensionSetupOpen && (
        <ExtensionSetupDialog
          isOpen={isExtensionSetupOpen}
          onOpenChange={setIsExtensionSetupOpen}
          onClose={() => setIsExtensionSetupOpen(false)}
        />
      )}
    </div>
  );
}

function Home() {
  const { signInWithMagicLink, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [articles, setArticles] = useState([]);
  const [fetchingArticles, setFetchingArticles] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    console.log("Auth state:", { user, loading });

    const fetchArticles = async () => {
      if (!user) {
        setArticles([]);
        setFetchingArticles(false);
        setFetchError(null);
        return;
      }

      setFetchingArticles(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("articles")
        .select("id, title, url, byline, saved_at, content, excerpt");

      if (error) {
        console.error("Error fetching articles:", error);
        setFetchError(error.message);
        setArticles([]);
      } else {
        console.log("Fetched articles:", data);
        setArticles(data);
        setFetchError(null);
      }
      setFetchingArticles(false);
    };

    fetchArticles();
  }, [user, supabase]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    console.log("Attempting sign in with:", email);
    const { success, error } = await signInWithMagicLink(email);
    if (success) {
      setMessage("Check your email for the magic link!");
    } else {
      setMessage(error);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl mb-4">Sign In</h1>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In with Magic Link
          </button>
        </form>
        {message && <p className="mt-4 p-2 bg-gray-100 rounded">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex-grow p-4">
      <h2 className="text-xl mt-4 mb-2">Your Saved Articles</h2>

      {fetchingArticles && <p>Loading articles...</p>}

      {fetchError && (
        <p className="text-red-500">Error loading articles: {fetchError}</p>
      )}

      {!fetchingArticles && !fetchError && articles.length === 0 && (
        <p>No articles saved yet.</p>
      )}

      {!fetchingArticles && !fetchError && articles.length > 0 && (
        <ArticleGrid articles={articles} />
      )}
    </div>
  );
}

export default App;
