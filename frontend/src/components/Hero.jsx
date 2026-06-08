const BADGES = [
  { label: 'Node.js', color: '#68a063' },
  { label: 'Redis', color: '#dc382d' },
  { label: 'SQLite', color: '#0f80cc' },
  { label: 'JWT', color: '#d63aff' },
];

export default function Hero() {
  return (
    <section className="hero section">
      <div className="hero-glow" aria-hidden="true" />
      <p className="hero-eyebrow">Live Interactive Demo</p>
      <h1 className="hero-title">
        API <span className="gradient-text">Gateway</span>
      </h1>
      <p className="hero-tagline">
        A unified entry point for Weather, News &amp; Crypto — with auth, caching,
        rate limiting, and real-time observability.
      </p>
      <div className="badge-strip">
        {BADGES.map((b) => (
          <span key={b.label} className="badge" style={{ '--badge-color': b.color }}>
            <span className="badge-dot" />
            {b.label}
          </span>
        ))}
      </div>
    </section>
  );
}
