import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the session from the URL hash
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          navigate("/");
          return;
        }

        if (session) {
          console.log("Session found, redirecting to home");
          navigate("/");
        } else {
          console.log("No session found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg mb-2">Completing sign in...</p>
        <p className="text-sm text-gray-500">
          You will be redirected automatically
        </p>
      </div>
    </div>
  );
}
