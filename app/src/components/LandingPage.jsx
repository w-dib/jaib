import { Button } from "../../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { Wand2, Mail } from "lucide-react";
import icon48 from "../assets/icon48.png";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function LandingPage() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);

    if (error) {
      // We could add a toast notification here for errors
      console.error(error);
    } else {
      setShowSuccess(true);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Error signing in with GitHub:", error.message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Optional: specify scopes if different from Supabase provider defaults
        // scopes: 'email profile openid',
      },
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6 px-4 w-full max-w-sm">
          <div className="flex items-center justify-center space-x-3">
            <img src={icon48} alt="Jaib Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Jaib</h1>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-3">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-green-800">
              Check your email
            </h2>
            <p className="text-green-700">
              We've sent a magic link to{" "}
              <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm text-green-600">
              Click the link in the email to sign in to your account.
            </p>
          </div>

          <button
            onClick={() => {
              setShowSuccess(false);
              setEmail("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4 w-full max-w-sm">
        <div className="flex items-center justify-center space-x-3">
          <img src={icon48} alt="Jaib Logo" className="w-12 h-12" />
          <h1 className="text-4xl font-bold">Jaib</h1>
        </div>

        <p className="text-muted-foreground max-w-md mx-auto">
          A lightweight article reader and Pocket alternative. Save, read, and
          organize your articles in a distraction-free environment.
        </p>

        <div className="space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading && !email ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Redirecting to Google...
                </div>
              ) : (
                <>
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-4 h-4 mr-2"
                  />
                  Continue with Google
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGitHubLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Redirecting to GitHub...
                </div>
              ) : (
                <>
                  <img
                    src="https://github.com/favicon.ico"
                    alt="GitHub"
                    className="w-4 h-4 mr-2"
                  />
                  Continue with GitHub
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending magic link...
                </div>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Login with Email
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
