import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Zap,
  Eye,
  MonitorPlay,
  Container,
  Highlighter,
  Tags,
  BookCopy,
  FileSearch,
  Sparkles,
  Menu as MenuIcon,
  Pocket,
  X as XIcon,
} from "lucide-react";
import jaibLogo from "../assets/icon48.png"; // Assuming this is your logo
import jaibHeroScreenshot from "../assets/jaib-hero-screenshot.png"; // Import hero screenshot
import featureShowcaseSaving from "../assets/feature-showcase-saving.png";
import featureShowcaseReader from "../assets/feature-showcase-reader.png";
import featureShowcaseAnnotations from "../assets/feature-showcase-annotations.png";

const OldFeatureCard = ({ icon, title, children }) => (
  <div className="flex flex-col items-center p-6 text-center bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
    {icon}
    <h3 className="mt-4 mb-2 text-xl font-semibold text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm">{children}</p>
  </div>
);

const NewFeatureCard = ({ icon, title, children }) => (
  <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center mb-3">
      {icon}
      <h3 className="ml-3 text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
  </div>
);

export default function HomePageLoggedOut() {
  const navigate = useNavigate();
  const [isPocketImportPopupOpen, setIsPocketImportPopupOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Apply styles to #root for full width when this component mounts
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.maxWidth = "none";
      rootElement.style.margin = "0";
      // rootElement.style.textAlign = 'left'; // Optional: if text-align: center is an issue
    }

    // Cleanup function to revert styles when component unmounts
    return () => {
      if (rootElement) {
        rootElement.style.maxWidth = "1280px"; // Revert to original
        rootElement.style.margin = "0 auto"; // Revert to original
        // rootElement.style.textAlign = 'center'; // Revert to original
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // Smooth scroll for internal links (optional, can be enhanced)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 text-gray-800 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src={jaibLogo} alt="Jaib Logo" className="h-8 w-8" />
              <span className="text-2xl font-bold text-gray-800">Jaib</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/login")}
                className="ml-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                Sign Up Free
              </button>
            </div>
            {/* Mobile menu button placeholder */}
            {/* <div className="md:hidden"> <button> <MenuIcon /> </button> </div> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-grow flex flex-col items-center justify-center text-center pt-16 pb-12 md:pt-24 md:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Pocket Welcome Button */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => setIsPocketImportPopupOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-full text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
          >
            Joining from Pocket?
            <Pocket size={18} className="ml-1.5 mr-1 text-white/90" />
            Click here
          </button>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block text-gray-900">Save Once. Read Anywhere.</span>
          <span className="block text-orange-500">Focus Deeply.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10">
          Jaib is your simple, modern sanctuary for saved articles. Experience
          distraction-free reading and effortless organization, all in one
          beautifully crafted app.
        </p>

        {/* App Screenshot Placeholder */}
        <div className="mb-10 max-w-3xl w-full mx-auto px-4 md:px-0">
          <img
            src={jaibHeroScreenshot}
            alt="Jaib App Screenshot"
            className="rounded-xl shadow-2xl w-full h-auto object-contain"
          />
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center"
        >
          Get Started - It's Free
          <ArrowRight size={20} className="ml-2" />
        </button>
      </header>

      {/* New Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Read Better.
            </h2>
            <p className="mt-3 text-md text-gray-600 max-w-xl mx-auto">
              Jaib offers a powerful suite of tools to enhance your reading and
              research workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <NewFeatureCard
              icon={<MonitorPlay size={28} className="text-orange-500" />}
              title="Run Anywhere"
            >
              Bookmark URLs directly from your phone's share button or your
              computer's Chrome extension.
            </NewFeatureCard>
            <NewFeatureCard
              icon={<Container size={28} className="text-orange-500" />}
              title="Batch Import URLs"
            >
              Coming from Pocket? Import up to 1,000 URLs in one go and bring
              your library with you.
            </NewFeatureCard>
            <NewFeatureCard
              icon={<Highlighter size={28} className="text-orange-500" />}
              title="Annotation"
            >
              Highlight key passages and share sections that matter to you with
              friends or colleagues.
            </NewFeatureCard>
            <NewFeatureCard
              icon={<Tags size={28} className="text-orange-500" />}
              title="Tags"
            >
              Organize all your bookmarks with custom tags, or leverage our
              upcoming automatic tagging feature.
            </NewFeatureCard>
            <NewFeatureCard
              icon={<BookCopy size={28} className="text-orange-500" />}
              title="Continue Where You Left Off"
            >
              Stopped reading halfway on your phone? Pick up from that same spot
              on your PC and vice versa.
            </NewFeatureCard>
            <NewFeatureCard
              icon={<FileSearch size={28} className="text-orange-500" />}
              title="Full Text Search"
            >
              Instantly search for any phrase or keyword in anything you've ever
              saved to Jaib.
            </NewFeatureCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-16 md:py-24 bg-gradient-to-b from-orange-50 to-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Simple, Fair Pricing.
            </h2>
            <p className="mt-3 text-md text-gray-600 max-w-xl mx-auto">
              Get started for free, and unlock powerful features with our
              straightforward premium plan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                Free Forever
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Perfect for casual readers and trying out Jaib.
              </p>
              <ul className="space-y-3 text-gray-700 text-sm mb-8 flex-grow">
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Unlimited Articles
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Batch import (up to 50 URLs)
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Search by title
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Tag articles
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Seamless reading across devices
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Annotations and Highlights
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Chrome Extension Access
                </li>
                <li className="flex items-center">
                  <CheckCircle
                    size={18}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />{" "}
                  Mobile Share (Android)
                </li>
              </ul>
              <button
                onClick={() => navigate("/login")}
                className="w-full mt-auto bg-gray-100 hover:bg-gray-200 text-orange-600 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
            {/* Premium Plan */}
            <div className="bg-orange-500 text-white p-8 rounded-xl shadow-2xl flex flex-col ring-4 ring-orange-300 ring-offset-2 ring-offset-white">
              <h3 className="text-2xl font-semibold text-center mb-2">
                Jaib Premium
              </h3>
              <p className="opacity-80 mb-1 text-sm text-center">
                Unlock the full power of Jaib.
              </p>
              <p className="text-4xl font-bold mb-6 text-center">
                $49{" "}
                <span className="text-lg font-normal opacity-80">/ year</span>
              </p>
              <ul className="space-y-3 opacity-90 text-sm mb-8 flex-grow">
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Everything in the Free plan
                </li>
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Advanced full-text search & filtering
                </li>
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Batch import (up to 1000 URLs)
                </li>
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Text-to-speech (soon)
                </li>
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Offline reading (soon)
                </li>
                <li className="flex items-center">
                  <Sparkles
                    size={18}
                    className="text-white/80 mr-2 flex-shrink-0"
                  />{" "}
                  Automatic tagging (soon)
                </li>
              </ul>
              <button
                onClick={() => navigate("/login")} // Or a dedicated premium signup page
                className="w-full mt-auto bg-white hover:bg-orange-50 text-orange-600 font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                Go Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Showcase (Replaces 'Built for Pure Focus') */}
      <section
        id="interactive-showcase"
        className="py-16 md:py-24 bg-gray-800 text-white overflow-x-hidden"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold">
              Experience Jaib, Feature by Feature.
            </h2>
          </div>

          {/* Showcase Item 1 */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-16 items-center mb-16 md:mb-24">
            <div className="md:pr-8 text-center md:text-left">
              <Zap size={36} className="text-orange-400 mb-4 mx-auto md:mx-0" />
              <h3 className="text-2xl md:text-3xl font-semibold mb-4">
                Seamless Saving Workflow
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                From browser extensions to mobile share sheets, saving to Jaib
                is a natural part of your flow. No friction, just one click and
                it's captured, cleaned, and ready for you.
              </p>
            </div>
            <div className="w-full max-w-[12.5rem] mx-auto md:max-w-[18.75rem]">
              <img
                src={featureShowcaseSaving}
                alt="Jaib saving workflow showcase"
                className="rounded-xl shadow-2xl w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Showcase Item 2 */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-16 items-center mb-16 md:mb-24">
            <div className="md:pl-8 text-center md:text-left md:order-2">
              <Eye size={36} className="text-orange-400 mb-4 mx-auto md:mx-0" />
              <h3 className="text-2xl md:text-3xl font-semibold mb-4">
                Distraction-Free Reading
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Immerse yourself in content. Jaib's reader view strips away all
                the noise, presenting articles in a beautifully clean and
                customizable format. Focus on what matters: the words.
              </p>
            </div>
            <div className="w-full max-w-[12.5rem] mx-auto md:max-w-[18.75rem] md:order-1">
              <img
                src={featureShowcaseReader}
                alt="Jaib reader view showcase"
                className="rounded-xl shadow-2xl w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Showcase Item 3 */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-16 items-center">
            <div className="md:pr-8 text-center md:text-left">
              <Highlighter
                size={36}
                className="text-orange-400 mb-4 mx-auto md:mx-0"
              />
              <h3 className="text-2xl md:text-3xl font-semibold mb-4">
                Powerful Annotations
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Engage deeply with your articles. Highlight crucial insights,
                add notes, and easily revisit your key takeaways. Turn passive
                reading into active learning.
              </p>
            </div>
            <div className="w-full max-w-[12.5rem] mx-auto md:max-w-[18.75rem]">
              <img
                src={featureShowcaseAnnotations}
                alt="Jaib annotation UI showcase"
                className="rounded-xl shadow-2xl w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Reading?
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Join Jaib today and create your personal, focused library of
            essential reads.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
          >
            Sign Up Free & Start Reading
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-border py-4 px-4 sm:px-6 lg:px-8 bg-background">
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
            <Link
              to="/privacy"
              className="hover:text-foreground hover:underline"
            >
              Privacy policy
            </Link>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              Terms of service
            </Link>
          </nav>
        </div>
      </footer>

      {/* Pocket Import Popup Modal */}
      {isPocketImportPopupOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[999] p-4 transition-opacity duration-300 ease-in-out"
          onClick={() => setIsPocketImportPopupOpen(false)}
        >
          <div
            className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full relative text-gray-800 transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPocketImportPopupOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close pocket import popup"
            >
              <XIcon size={24} />
            </button>

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                Migrating from Pocket?
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Pocket's service will be discontinued on July 8, 2025. Jaib offers
              a simple, one-click process to import your entire Pocket library,
              including articles, tags, and collections.
            </p>

            <div className="space-y-4 mt-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  1. Log in or Create a Jaib Account:
                </h3>
                <button
                  onClick={() => {
                    navigate("/login");
                    setIsPocketImportPopupOpen(false);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-md shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm"
                >
                  Login or Sign Up with Jaib
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  2. Initiate Pocket Import:
                </h3>
                <p className="text-sm text-gray-600">
                  After logging in, you'll be guided to import your Pocket data.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Welcome to Jaib!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
