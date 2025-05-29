import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border mt-auto py-6 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
        <p className="mb-2 sm:mb-0">
          &copy; {currentYear} Walid Dib. All rights reserved.
        </p>
        <nav className="flex space-x-4 sm:space-x-6">
          <a
            href="mailto:wdanieldib@gmail.com"
            className="hover:text-foreground hover:underline"
          >
            Get help
          </a>
          <Link to="/privacy" className="hover:text-foreground hover:underline">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:text-foreground hover:underline">
            Terms of service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
