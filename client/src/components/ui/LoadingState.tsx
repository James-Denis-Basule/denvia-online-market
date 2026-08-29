import Card from './Card';

interface LoadingStateProps {
  count?: number;
  className?: string;
}

function LoadingState({
  count = 8,
  className = '',
}: LoadingStateProps) {
  return (
    <section
      className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
      aria-label="Loading"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden p-0 shadow-sm"
        >
          <div className="relative h-40 animate-pulse overflow-hidden bg-gray-200">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="h-5 w-3/4 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-6 w-28 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </Card>
      ))}
    </section>
  );
}

export default LoadingState;
