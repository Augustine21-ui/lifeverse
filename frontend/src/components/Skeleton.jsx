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

/* ─── Day 3 additions ──────────────────────────────────────── */

export function SkeletonOrbit({ className = '' }) {
  return (
    <div className={`card skeleton-pulse aspect-square ${className}`} aria-hidden>
      <div className="h-full w-full rounded-full bg-white/5" />
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl skeleton-pulse ${className}`} aria-hidden>
      <div className="h-9 w-9 rounded-full bg-white/10" />
      <div className="flex-1">
        <div className="h-3 w-1/2 rounded bg-white/10 mb-2" />
        <div className="h-3 w-1/3 rounded bg-white/10" />
      </div>
    </div>
  );
}