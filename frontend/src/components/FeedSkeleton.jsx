export default function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-4 animate-pulse border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-white/10 rounded" />
              <div className="h-2 w-16 bg-white/10 rounded mt-1" />
            </div>
          </div>
          <div className="mt-2 h-4 w-full bg-white/10 rounded" />
          <div className="mt-2 h-4 w-3/4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}