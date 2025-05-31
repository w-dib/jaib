import { X, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import logo from "../assets/icon48.png";

function PremiumModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <img src={logo} alt="Jaib Logo" className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Go Premium!</h2>
          <p className="mt-2 text-gray-600">
            Unlock all features and get the best Jaib experience.
          </p>

          <div className="mt-8 space-y-4 text-left">
            <FeatureItem>Unlimited article saves & imports</FeatureItem>
            <FeatureItem>Advanced search & filtering</FeatureItem>
            <FeatureItem>Text-to-speech for articles</FeatureItem>
            <FeatureItem>Automatic tags</FeatureItem>
          </div>

          <div className="mt-10">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                // Handle actual upgrade logic here (e.g., redirect to Stripe)
                console.log("Upgrade to Premium clicked!");
                onClose(); // Close modal for now
              }}
            >
              Upgrade Now - $20/year
            </Button>
            <Button
              variant="link"
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              Maybe later
            </Button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}

function FeatureItem({ children }) {
  return (
    <div className="flex items-center">
      <CheckCircle size={20} className="mr-3 text-green-500 flex-shrink-0" />
      <span className="text-gray-700">{children}</span>
    </div>
  );
}

export default PremiumModal;
