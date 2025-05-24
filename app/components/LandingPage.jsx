import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: prompt("Please enter your email:"),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the login link!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="flex items-center justify-center space-x-3">
          <img src="/logo.svg" alt="Jaib Logo" className="w-12 h-12" />
          <h1 className="text-4xl font-bold">Jaib</h1>
        </div>

        <p className="text-muted-foreground max-w-md mx-auto">
          A lightweight article reader and Pocket alternative. Save, read, and
          organize your articles in a distraction-free environment.
        </p>

        <Button
          onClick={handleLogin}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Login with Email
        </Button>
      </div>
    </div>
  );
}
