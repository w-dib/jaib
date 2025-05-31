import { Skeleton } from "../../components/ui/skeleton";

function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full bg-white dark:bg-gray-800"
        >
          {/* Image skeleton with aspect ratio */}
          <Skeleton className="w-full aspect-[16/9]" />

          {/* Content skeleton */}
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
              {/* Title Skeleton (simulating 2 lines of text-lg) */}
              <Skeleton className="h-5 w-3/4 mb-1" />
              <Skeleton className="h-5 w-5/6 mb-2" />

              {/* Excerpt Skeleton (simulating 3 lines of text-sm) */}
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-4/5 mb-2" />
            </div>

            {/* Footer skeleton (site name and reading time/actions) */}
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ArticleGridSkeleton;
