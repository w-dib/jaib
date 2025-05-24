import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthCallback from "./pages/AuthCallback";
import { useState, useEffect } from "react";
import "./App.css";
import { useAuth } from "./contexts/AuthContext";

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

  useEffect(() => {
    console.log("Auth state:", { user, loading });
  }, [user, loading]);

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
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="p-4">
        <p>Welcome, {user.email}</p>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

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

export default App;
