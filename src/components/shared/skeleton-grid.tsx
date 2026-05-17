export function SkeletonGrid() {
  return (
    <section className="dashboard-grid">
      <div className="panel">
        <div className="skeleton" style={{ minHeight: 72, marginBottom: 16 }} />
        <div className="service-list">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="skeleton" key={index} />
          ))}
        </div>
      </div>
      <aside className="side-stack">
        <div className="skeleton" />
        <div className="skeleton" />
      </aside>
    </section>
  );
}
