// frontend/src/components/Skeleton.jsx
export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`skeleton-pulse rounded-md bg-white/10 ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-4 space-y-3">
      <SkeletonLine width="40%" height={16} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? '90%' : '70%'} height={12} />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="stat-icon skeleton-pulse bg-white/10" />
      <div className="stat-content space-y-2">
        <SkeletonLine width="50%" height={10} />
        <SkeletonLine width="70%" height={20} />
        <SkeletonLine width="40%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={4} />
        </div>
        <div className="space-y-6">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
      </div>
    </div>
  );
}