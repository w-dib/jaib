import React from "react";

const SkeletonCard = () => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full w-full max-w-sm mx-auto animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full h-32 bg-gray-200"></div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Title Placeholder */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>

        {/* Text Placeholder */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>

        <div className="mt-auto flex items-center justify-between">
          {/* Source and Reading Time Placeholder */}
          <div className="flex flex-col items-start w-1/2">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>

          {/* More Options Placeholder */}
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
