import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthCallback from "./pages/AuthCallback";
import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

function Home() {
  const { user, signInWithMagicLink, signOut, loading } = useAuth();
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
        .select("id, title, url, byline, saved_at");

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
    <div className="p-4">
      <p>Welcome, {user.email}</p>
      <button
        onClick={signOut}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
      >
        Sign Out
      </button>

      <h2 className="text-xl mt-4 mb-2">Your Saved Articles</h2>

      {fetchingArticles && <p>Loading articles...</p>}

      {fetchError && (
        <p className="text-red-500">Error loading articles: {fetchError}</p>
      )}

      {!fetchingArticles && !fetchError && articles.length === 0 && (
        <p>No articles saved yet.</p>
      )}

      {!fetchingArticles && !fetchError && articles.length > 0 && (
        <ul>
          {articles.map((article) => (
            <li key={article.id} className="mb-2 p-2 border rounded">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {article.title}
              </a>
              {article.byline && (
                <p className="text-sm text-gray-600">By: {article.byline}</p>
              )}
              <p className="text-sm text-gray-600">
                Saved on: {new Date(article.saved_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
