import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path as needed
import { Loader2 } from "lucide-react";

function LogoutHandler() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      if (user) {
        try {
          await signOut();
          // After signOut completes, navigate to home.
          // The AuthContext will likely update the user state, causing App.jsx to re-render and show LandingPage if user is null.
          navigate("/");
        } catch (error) {
          console.error("Error during sign out:", error);
          // Handle error, perhaps navigate to an error page or home
          navigate("/");
        }
      } else {
        // No user to sign out, just redirect to home
        navigate("/");
      }
    };

    performLogout();
  }, [signOut, navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
      <p className="text-xl text-orange-600">Logging out...</p>
    </div>
  );
}

export default LogoutHandler;
