import { Skeleton } from "../../components/ui/skeleton"; // Corrected path

function ArticleViewSkeleton() {
  return (
    <div className="flex flex-col items-center mt-[72px] pb-16 min-h-screen">
      {/* Fixed Header Skeleton (Mimicking the Article Nav Bar) */}
      <div className="fixed top-0 w-full bg-white border-b border-gray-200 z-20 flex items-center justify-center py-4 px-4 h-[68px]">
        {/* Back Button Placeholder */}
        <Skeleton className="absolute left-4 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full" />

        {/* Action Icons Placeholder */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Article Content Skeleton */}
      <div className="max-w-[718px] mx-auto w-full pt-12 sm:pt-16 pb-16 sm:pb-24">
        {/* Article Title and Byline Skeleton */}
        <div className="text-center mb-10 md:mb-12 px-[40px]">
          <Skeleton className="h-10 w-3/4 mx-auto mb-4" /> {/* Title */}
          <Skeleton className="h-6 w-1/2 mx-auto" /> {/* Byline */}
        </div>

        {/* Main Article Content Skeleton */}
        <div className="max-w-none text-left px-[40px] prose prose-lg prose-gray mx-auto">
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />

          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />

          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-4/5 mb-4" />
        </div>
      </div>
    </div>
  );
}

export default ArticleViewSkeleton;
