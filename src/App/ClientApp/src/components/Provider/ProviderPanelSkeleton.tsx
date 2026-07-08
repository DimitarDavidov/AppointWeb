export function ProviderPanelSkeleton() {
  return (
    <div className="provider-skeleton" aria-hidden="true">
      <div className="provider-skeleton-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="provider-skeleton-stat"
            style={{ animationDelay: `${index * 0.08}s` }}
          />
        ))}
      </div>

      <div className="provider-skeleton-tabs" />

      <div className="provider-skeleton-panel">
        <div className="provider-skeleton-intro" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="provider-skeleton-card"
            style={{ animationDelay: `${0.12 + index * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}
