import { useApp } from '../context/AppContext';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function RequestLog() {
  const { requestLogs } = useApp();

  return (
    <section className="section glass-card request-log">
      <div className="section-header">
        <div className="section-icon log-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div>
          <h2>Request Log</h2>
          <p className="section-sub">Every explorer request recorded in real time</p>
        </div>
        <span className="log-count">{requestLogs.length}</span>
      </div>

      <div className="table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {requestLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No requests yet — fire one from the explorer above
                </td>
              </tr>
            ) : (
              requestLogs.map((log) => (
                <tr key={log.id} className="log-row animate-in">
                  <td className="mono">{formatTime(log.time)}</td>
                  <td>
                    <span className="method-badge">{log.method}</span>
                  </td>
                  <td className="mono endpoint-cell">{log.endpoint}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        log.status >= 200 && log.status < 300
                          ? 'status-pill--ok'
                          : 'status-pill--err'
                      }`}
                    >
                      {log.status || 'NET'}
                    </span>
                  </td>
                  <td className="mono latency-cell">{log.latency} ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
