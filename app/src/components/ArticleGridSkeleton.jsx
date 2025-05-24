import { Skeleton } from "../../components/ui/skeleton";

function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="border rounded-lg overflow-hidden shadow-sm flex flex-col h-full"
        >
          {/* Image skeleton */}
          <Skeleton className="w-full h-32" />

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center">
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
