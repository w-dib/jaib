import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthCallback from "./pages/AuthCallback";
import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import Navbar from "./components/Navbar";
import ArticleGrid from "./components/ArticleGrid";
import SavesView from "./components/views/SavesView";
import FavoritesView from "./components/views/FavoritesView";
import ArchivesView from "./components/views/ArchivesView";
import ArticleView from "./components/views/ArticleView";
import SaveArticleHandler from "./components/views/SaveArticleHandler";
import { LandingPage } from "./components/LandingPage";
import LogoutHandler from "./components/views/LogoutHandler";
import PocketImportBanner from "./components/PocketImportBanner";
import TagsPage from "./pages/TagsPage";
import SharedArticleHandler from "./components/views/SharedArticleHandler";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import Footer from "./components/Footer";
import HomePageLoggedOut from "./pages/HomePageLoggedOut";
import PocketImportPage from "./pages/PocketImportPage";
import { Toaster } from "../components/ui/sonner";

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
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerArticleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Paths accessible when logged out (in addition to LandingPage at root)
  const publicPaths = ["/terms", "/privacy", "/auth/callback"];
  const saveArticlePath = "/save-article";

  const showNavbarPaths = ["/", "/favorites", "/archives", "/tags"];
  const isMainViewWithNavbar = showNavbarPaths.includes(location.pathname);
  const isArticleView = location.pathname.startsWith("/article/");

  if (!user) {
    // Render HomePageLoggedOut at the root when not logged in
    if (location.pathname === "/") {
      return <HomePageLoggedOut />;
    }

    // Route for the login page
    if (location.pathname === "/login") {
      return <LandingPage />; // Assuming LandingPage contains your login form (Home function)
    }

    // Allow direct access to public paths like /terms, /privacy, /auth/callback
    if (publicPaths.includes(location.pathname)) {
      return (
        <Routes>
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      );
    }
    // Allow /save-article path
    if (location.pathname.startsWith(saveArticlePath)) {
      return (
        <Routes>
          <Route path="/save-article" element={<SaveArticleHandler />} />
        </Routes>
      );
    }
    // For any other path when not logged in, show LandingPage
    return <LandingPage />;
  }

  // If user is logged in, render the full app layout
  return (
    <div className="flex flex-col min-h-screen">
      {isMainViewWithNavbar && (
        <Navbar
          user={user}
          onSignOut={signOut}
          onArticleAdded={triggerArticleRefresh}
        />
      )}

      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <ViewWrapper>
              <SavesView refreshKey={refreshKey} />
            </ViewWrapper>
          }
        />
        <Route
          path="/favorites"
          element={
            <ViewWrapper>
              <FavoritesView refreshKey={refreshKey} />
            </ViewWrapper>
          }
        />
        <Route
          path="/archives"
          element={
            <ViewWrapper>
              <ArchivesView refreshKey={refreshKey} />
            </ViewWrapper>
          }
        />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/article/:id" element={<ArticleView />} />
        <Route path="/save-article" element={<SaveArticleHandler />} />
        <Route path="/save-article-shared" element={<SharedArticleHandler />} />
        <Route path="/logout" element={<LogoutHandler />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/import-pocket" element={<PocketImportPage />} />
      </Routes>
      {!isArticleView && location.pathname !== "/import-pocket" && <Footer />}
    </div>
  );
}

function ViewWrapper({ children }) {
  return <div className="flex-grow pt-4 px-4">{children}</div>;
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
