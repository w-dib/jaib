import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog"; // Assuming path to ShadCN UI components
import { Button } from "../../components/ui/button";
import { Copy, Twitter, Linkedin, X as XIcon } from "lucide-react"; // XIcon for close
import { toast } from "sonner"; // For feedback on copy

function ShareDialog({ isOpen, onOpenChange, article }) {
  if (!article) {
    return null; // Don't render if no article is provided
  }

  const handleCopyToClipboard = async () => {
    if (!article.url) return;
    try {
      await navigator.clipboard.writeText(article.url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link: ", err);
      toast.error("Failed to copy link.");
    }
  };

  const handleShareToX = () => {
    if (!article.url) return;
    const text = encodeURIComponent(article.title || "Check out this article");
    const url = encodeURIComponent(article.url);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareToLinkedIn = () => {
    if (!article.url) return;
    const url = encodeURIComponent(article.url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Placeholder for a simple image if available
  const imageUrl = article.lead_image_url || null;
  const excerpt =
    article.excerpt ||
    (article.content ? article.content.substring(0, 100) + "..." : "");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Share Item
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Article Preview Section */}
          <div className="flex items-start space-x-4 mb-6">
            {imageUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={article.title || "Article image"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-grow">
              <h3
                className="text-md font-semibold text-gray-700 mb-1 line-clamp-2"
                title={article.title}
              >
                {article.title || "Untitled Article"}
              </h3>
              {excerpt && (
                <p className="text-sm text-gray-500 line-clamp-3">{excerpt}</p>
              )}
            </div>
          </div>

          {/* Sharing Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start py-3 text-base"
              onClick={handleCopyToClipboard}
            >
              <Copy size={18} className="mr-3 text-gray-600" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start py-3 text-base"
              onClick={handleShareToX}
            >
              <Twitter size={18} className="mr-3 text-blue-500" />
              Share on X
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start py-3 text-base"
              onClick={handleShareToLinkedIn}
            >
              <Linkedin size={18} className="mr-3 text-blue-700" />
              Share on LinkedIn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
