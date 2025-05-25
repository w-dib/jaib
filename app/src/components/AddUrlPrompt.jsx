import React, { useState } from "react";
import { Link as LinkIcon, X } from "lucide-react"; // Using LinkIcon to avoid conflict with React Router Link
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import logo from "../assets/icon48.png";

function AddUrlPrompt({ isOpen, onClose, onAdd }) {
  const [url, setUrl] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url.trim());
      setUrl(""); // Clear input after adding
      onClose(); // Close the prompt
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center">
      {/* Top Bar with Logo and Close Button */}
      <div className="w-full flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-xl px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center"
        >
          <div className="relative w-full mb-4">
            <LinkIcon
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="url"
              placeholder="Save a URL https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-md text-lg transition-colors shadow-md"
            disabled={!url.trim()} // Disable button if URL is empty
          >
            Add
          </Button>
        </form>

        {/* Optional: Add some helper text or instructions below the form */}
        {/* <p className="mt-4 text-sm text-gray-500">Paste any link to save it to your Jaib.</p> */}
      </div>
    </div>
  );
}

export default AddUrlPrompt;
