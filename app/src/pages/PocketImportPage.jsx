import React from "react";
import PocketImportBanner from "../components/PocketImportBanner"; // Adjust path as necessary
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function PocketImportPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 group"
          >
            <ArrowLeft
              size={18}
              className="mr-1.5 text-orange-500 transition-transform group-hover:-translate-x-0.5"
            />
            Back to Saves
          </Link>
        </div>
        <PocketImportBanner isInsideModal={false} />{" "}
        {/* Render the banner, not in modal mode */}
      </div>
    </div>
  );
}

export default PocketImportPage;
