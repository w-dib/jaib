import { useState } from "react";
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
  Image as ImageIcon,
} from "lucide-react"; // Changed Zap to Chrome, Added ChevronLeft, ChevronRight, and ImageIcon

// Placeholder for the image - replace with your actual image path
// const extensionPromoImage = "/src/assets/extension-promo.png";
// For now, let's use a simple placeholder div

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
    onOpenChange(false);
    setTimeout(() => setCurrentStep(1), 300); // Reset step on close
  };

  // Placeholder article data for step 3
  const placeholderArticles = [
    { title: "Lorem Ipsum Dolor Sit", blogName: "Consectetur Adipiscing" },
    { title: "Elit Sed Do Eiusmod", blogName: "Tempor Incididunt Ut" },
    { title: "Labore Et Dolore Magna", blogName: "Aliqua Ut Enim Ad" },
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
            <div className="flex flex-col md:flex-row items-stretch min-h-96">
              <div
                className="pl-6 sm:pl-8 md:pl-10 pr-4 sm:pr-6 py-4 sm:py-6
"
              >
                <p className="text-sm text-orange-500 mb-2">
                  Great! Now, let's pin the extension for quick access.
                </p>
                <DialogHeader className="mb-6 sm:mb-8 text-left">
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
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out whitespace-nowrap mb-8 sm:mb-0 text-lg"
                >
                  I've pinned it
                </Button>
              </div>
              <div className="flex-shrink-0 w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:rounded-r-xl">
                <div className="w-full h-64 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center text-muted-foreground">
                  WebM Placeholder (e.g., 300x200)
                </div>
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
                    Pick an article, then click the extension after the webpage
                    opens.
                  </DialogDescription>
                </DialogHeader>
                <Button
                  size="lg"
                  onClick={handleDialogClose}
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
                    href="#"
                    className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center mr-3">
                      <ImageIcon
                        size={20}
                        className="text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">
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
                  onClick={handleDialogClose}
                  className="w-auto text-lg border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                >
                  Skip
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
