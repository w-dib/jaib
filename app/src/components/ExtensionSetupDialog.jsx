import { useState } from "react";
import confetti from "canvas-confetti"; // Import confetti
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog"; // Path confirmed by user
import { Button } from "../../components/ui/button"; // Path confirmed by user
import {
  ExternalLink,
  Chrome,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Smartphone,
  Share,
} from "lucide-react"; // Changed Zap to Chrome, Added ChevronLeft, ChevronRight, and ImageIcon

// TODO: User will provide these images. Import them once available.
import noobPaulGraham from "../assets/article-placeholders/noob-paul-graham.png";
import historyOfManaAppendix from "../assets/article-placeholders/history-of-mana-appendix.png";
import sayHardThingRands from "../assets/article-placeholders/say-hard-thing-rands.png";
import pinExtensionGuideWebm from "../assets/pin-extension-guide.webm"; // Import WebM
import pinExtensionGuidePng from "../assets/pin-extension-guide.png"; // Import PNG
import jaibLogo from "../assets/icon48.png"; // Import the Jaib logo

export default function ExtensionSetupDialog({ isOpen, onOpenChange }) {
  const [currentStep, setCurrentStep] = useState(1);

  const BrowserIcon = () => (
    // Using Chrome icon as requested
    <div className="p-4 bg-orange-500 rounded-lg shadow-md">
      <Chrome size={64} className="text-white" />
    </div>
  );

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const handleDialogClose = () => {
    // Launch confetti!
    confetti({
      particleCount: 150, // Slightly more confetti
      spread: 90, // Wider spread
      origin: { y: 0.5 }, // Centered origin
      zIndex: 9999, // Ensure it's on top
    });

    onOpenChange(false);
    setTimeout(() => setCurrentStep(1), 300); // Reset step on close
  };

  const placeholderArticles = [
    {
      title: "Being a Noob",
      blogName: "Paul Graham",
      url: "https://www.paulgraham.com/noob.html",
      expectedImage: noobPaulGraham, // Use imported image
    },
    {
      title: "The History of Mana",
      blogName: "The Appendix",
      url: "https://theappendix.net/issues/2014/4/the-history-of-mana-how-an-austronesian-concept-became-a-video-game-mechanic",
      expectedImage: historyOfManaAppendix, // Use imported image
    },
    {
      title: "Say The Hard Thing",
      blogName: "Rands In Repose",
      url: "https://randsinrepose.com/archives/say-the-hard-thing/",
      expectedImage: sayHardThingRands, // Use imported image
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden shadow-2xl rounded-xl">
        {currentStep === 1 && (
          <>
            <div className="flex flex-col sm:flex-row min-h-96">
              <div className="flex-1 p-6 py-8 sm:p-8 md:p-10 flex flex-col justify-center">
                <DialogHeader className="mb-6 sm:mb-8 text-left">
                  <DialogTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                    Set up link saving
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg text-muted-foreground">
                    Our Chrome extension saves your URLs on Jaib.
                  </DialogDescription>
                </DialogHeader>

                <Button
                  asChild
                  size="lg" // Slightly larger button
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out whitespace-nowrap mb-8 sm:mb-0 text-lg"
                >
                  <a
                    href="#" // Replace with your actual extension link
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enable the Extension
                    <ExternalLink size={18} className="ml-2.5" />
                  </a>
                </Button>
              </div>

              <div className="flex-shrink-0 items-center justify-center p-6 py-8 sm:p-8 md:p-10 hidden sm:flex ">
                <BrowserIcon />
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t bg-background sm:justify-end rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto text-lg border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              >
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="flex flex-col p-6 py-8 sm:p-8 md:p-10 min-h-96">
              {" "}
              {/* Changed to flex-col and adjusted padding */}
              {/* Text Content Area */}
              <div className="mb-6 sm:mb-8">
                <DialogHeader className="text-left mb-6 sm:mb-8">
                  <DialogTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                    Pin the extension
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg text-muted-foreground">
                    Add it to the browser bar to save content faster.
                  </DialogDescription>
                </DialogHeader>
                <Button
                  size="lg"
                  onClick={() => goToStep(3)}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out whitespace-nowrap text-lg"
                >
                  I've pinned it
                </Button>
              </div>
              {/* Media Content Area - Below text, full width */}
              <div className="w-full mt-4 md:mt-6">
                {" "}
                {/* Added margin for spacing */}
                {/* Desktop: Video */}
                <video
                  src={pinExtensionGuideWebm}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="hidden md:block w-full rounded-lg shadow-lg"
                  width="300" // Intrinsic width, Tailwind handles responsiveness
                  height="200" // Intrinsic height
                >
                  Your browser does not support the video tag.
                </video>
                {/* Mobile: Image */}
                <img
                  src={pinExtensionGuidePng}
                  alt="Guide to pinning the extension"
                  className="block md:hidden w-full rounded-lg shadow-lg"
                  width="300" // Intrinsic width, Tailwind handles responsiveness
                  height="200" // Intrinsic height (will be overridden by w-full aspect ratio if image is different)
                />
              </div>
            </div>
            <DialogFooter className="border-t bg-background rounded-b-xl">
              <div className="flex justify-between w-full items-center pl-6 sm:pl-8 md:pl-10 pr-6 sm:pr-8 md:pr-10 py-4 sm:py-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goToStep(1)}
                  className="pl-0 pr-2 py-2 sm:pl-0 sm:pr-2.5 sm:py-2.5 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Back"
                >
                  <ChevronLeft className="!size-7 sm:!size-9" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goToStep(3)}
                  className="w-auto text-lg border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                >
                  Skip
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="flex flex-col md:flex-row items-stretch min-h-96">
              {/* Left Panel for Step 3 */}
              <div className="flex-1 p-6 py-8 sm:p-8 md:p-10 flex flex-col justify-center">
                <DialogHeader className="mb-6 sm:mb-8 text-left">
                  <DialogTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                    Save your first article
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg text-muted-foreground mb-8">
                    Pick an article, then click{" "}
                    <img
                      src={jaibLogo}
                      alt="Jaib extension icon"
                      className="inline-block h-5 w-5 align-middle mx-1"
                    />{" "}
                    the extension after the webpage opens.
                  </DialogDescription>
                </DialogHeader>
                <Button
                  size="lg"
                  onClick={() => goToStep(4)}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out whitespace-nowrap text-lg"
                >
                  I saved an article
                </Button>
              </div>

              {/* Right Panel for Step 3 */}
              <div className="flex-shrink-0 w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center p-6 space-y-3">
                {placeholderArticles.map((article, index) => (
                  <a
                    key={index}
                    href={article.url} // Use the actual URL
                    target="_blank" // Open in new tab
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center mr-3 overflow-hidden">
                      {article.expectedImage ? (
                        <img
                          src={article.expectedImage}
                          alt={`Cover for ${article.title}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // Fallback if expectedImage is somehow not available
                        <ImageIcon
                          size={20}
                          className="text-gray-500 dark:text-gray-400"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {article.blogName}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-2"
                    />
                  </a>
                ))}
              </div>
            </div>

            <DialogFooter className="border-t bg-background rounded-b-xl">
              <div className="flex justify-between w-full items-center pl-6 sm:pl-8 md:pl-10 pr-6 sm:pr-8 md:pr-10 py-4 sm:py-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goToStep(2)}
                  className="pl-0 pr-2 py-2 sm:pl-0 sm:pr-2.5 sm:py-2.5 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Back"
                >
                  <ChevronLeft className="!size-7 sm:!size-9" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goToStep(4)}
                  className="w-auto text-lg border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                >
                  Skip
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="flex flex-col md:flex-row items-stretch min-h-96">
              {/* Content Panel for Step 4 */}
              <div className="flex-1 p-6 py-8 sm:p-8 md:p-10 flex flex-col justify-center">
                <DialogHeader className="mb-6 sm:mb-8 text-left">
                  <DialogTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                    One Last Step: Quick Access!
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg text-muted-foreground mb-6">
                    A native Jaib app is coming soon! For now, you can install
                    Jaib on your device for a fast, app-like experience.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 md:space-y-5">
                  {/* iOS Instructions */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex items-center mb-2.5">
                      {/* Smartphone icon removed */}
                      <h4 className="font-semibold text-md text-gray-700 dark:text-gray-200">
                        For iPhone & iPad
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600 dark:text-gray-300 text-sm">
                      <li>
                        In Safari, tap the{" "}
                        <Share
                          size={15}
                          className="inline align-text-bottom mx-0.5 text-orange-500"
                        />{" "}
                        <span className="font-medium">Share</span> icon (at the
                        bottom).
                      </li>
                      <li>
                        Scroll and tap{" "}
                        <span className="font-medium">Add to Home Screen</span>.
                      </li>
                    </ol>
                  </div>

                  {/* Android Instructions */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex items-center mb-2.5">
                      {/* Smartphone icon removed */}
                      <h4 className="font-semibold text-md text-gray-700 dark:text-gray-200">
                        For Android
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600 dark:text-gray-300 text-sm">
                      <li>
                        In Chrome, tap the{" "}
                        <span className="font-bold text-lg align-middle">
                          &#8942;
                        </span>{" "}
                        <span className="font-medium">Menu</span> (top-right).
                      </li>
                      <li>
                        Select <span className="font-medium">Install app</span>{" "}
                        or{" "}
                        <span className="font-medium">Add to Home Screen</span>.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-background dark:bg-gray-850 dark:border-gray-700 rounded-b-xl">
              <div className="flex justify-between w-full items-center pl-6 sm:pl-8 md:pl-10 pr-6 sm:pr-8 md:pr-10 py-4 sm:py-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goToStep(3)}
                  className="pl-0 pr-2 py-2 sm:pl-0 sm:pr-2.5 sm:py-2.5 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Back"
                >
                  <ChevronLeft className="!size-7 sm:!size-9" />
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleDialogClose}
                  className="w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out whitespace-nowrap text-lg"
                >
                  All Done!
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
