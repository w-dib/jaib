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

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
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

  const showNavbarPaths = ["/", "/favorites", "/archives"];

  const isMainViewWithNavbar = showNavbarPaths.includes(location.pathname);

  if (!user) {
    if (location.pathname.startsWith("/save-article")) {
      return (
        <Routes>
          <Route path="/save-article" element={<SaveArticleHandler />} />
        </Routes>
      );
    }
    if (location.pathname === "/auth/callback") {
      return (
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      );
    }
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isMainViewWithNavbar && (
        <Navbar
          user={user}
          onSignOut={signOut}
          onArticleAdded={triggerArticleRefresh}
        />
      )}
      {user && isMainViewWithNavbar && <PocketImportBanner />}

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
        <Route path="/article/:id" element={<ArticleView />} />
        <Route path="/save-article" element={<SaveArticleHandler />} />
        <Route path="/logout" element={<LogoutHandler />} />
      </Routes>
    </div>
  );
}

function ViewWrapper({ children }) {
  return <div className="flex-grow pt-[72px] px-4">{children}</div>;
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
