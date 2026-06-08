import { useApp } from '../context/AppContext';

const NODES = [
  { id: 'client', label: 'Client', x: 60, y: 200 },
  { id: 'auth', label: 'Auth', x: 200, y: 200 },
  { id: 'rate', label: 'Rate Limiter', x: 360, y: 200 },
  { id: 'cache', label: 'Cache', x: 520, y: 200 },
  { id: 'router', label: 'Router', x: 680, y: 200 },
  { id: 'weather', label: 'Weather Svc', x: 860, y: 80 },
  { id: 'news', label: 'News Svc', x: 860, y: 200 },
  { id: 'crypto', label: 'Crypto Svc', x: 860, y: 320 },
  { id: 'external', label: 'External APIs', x: 1040, y: 200 },
];

const EDGES = [
  { from: 'client', to: 'auth' },
  { from: 'auth', to: 'rate' },
  { from: 'rate', to: 'cache' },
  { from: 'cache', to: 'router' },
  { from: 'router', to: 'weather' },
  { from: 'router', to: 'news' },
  { from: 'router', to: 'crypto' },
  { from: 'weather', to: 'external' },
  { from: 'news', to: 'external' },
  { from: 'crypto', to: 'external' },
];

function getNode(id) {
  return NODES.find((n) => n.id === id);
}

function edgePath(from, to) {
  const a = getNode(from);
  const b = getNode(to);
  const x1 = a.x + 50;
  const y1 = a.y + 20;
  const x2 = b.x;
  const y2 = b.y + 20;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export default function ArchitectureDiagram() {
  const { inFlight } = useApp();

  return (
    <section className="section glass-card arch-section">
      <div className="section-header">
        <div className="section-icon arch-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div>
          <h2>Architecture</h2>
          <p className="section-sub">
            Request flow through the gateway pipeline
            {inFlight && <span className="flow-indicator"> — data in flight</span>}
          </p>
        </div>
      </div>

      <div className="arch-diagram-wrap">
        <svg viewBox="0 0 1120 400" className="arch-svg" aria-label="Gateway architecture diagram">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {EDGES.map((edge) => (
            <g key={`${edge.from}-${edge.to}`}>
              <path
                d={edgePath(edge.from, edge.to)}
                className="arch-edge"
                fill="none"
                stroke="url(#edgeGrad)"
                strokeWidth="2"
              />
              {inFlight && (
                <circle r="4" fill="#a5b4fc" filter="url(#glow)">
                  <animateMotion
                    dur="1.2s"
                    repeatCount="indefinite"
                    path={edgePath(edge.from, edge.to)}
                  />
                </circle>
              )}
            </g>
          ))}

          {NODES.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="arch-node">
              <rect
                width="100"
                height="40"
                rx="8"
                className={`arch-node-rect ${inFlight ? 'arch-node-rect--active' : ''}`}
              />
              <text x="50" y="25" textAnchor="middle" className="arch-node-label">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
