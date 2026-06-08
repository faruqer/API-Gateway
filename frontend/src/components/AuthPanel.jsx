import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function AuthPanel() {
  const { token, tokenExpiry, storeToken, clearToken, gatewayFetch } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!tokenExpiry) {
      setCountdown('');
      return;
    }

    const tick = () => {
      setCountdown(formatCountdown(tokenExpiry - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tokenExpiry]);

  const handleGetToken = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await gatewayFetch('/auth/token', {
      method: 'POST',
      body: { apiKey: apiKey.trim() },
      skipAuth: true,
      label: '/auth/token',
    });

    setLoading(false);

    if (result.ok && result.data?.token) {
      storeToken(result.data.token);
    } else {
      setError(result.data?.error || 'Failed to obtain token');
    }
  };

  const copyToken = useCallback(() => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [token]);

  return (
    <section className="section glass-card auth-panel">
      <div className="section-header">
        <div className="section-icon auth-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h2>Authentication</h2>
          <p className="section-sub">Exchange your API key for a JWT bearer token</p>
        </div>
      </div>

      <div className="auth-form">
        <div className="input-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="text"
            placeholder="Paste your API key from seed output"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGetToken()}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGetToken}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" /> Getting Token…
            </span>
          ) : (
            'Get Token'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {token && (
        <div className="token-display animate-in">
          <div className="token-header">
            <span className="token-label">
              <span className="status-dot status-dot--ok" />
              JWT Active
            </span>
            {countdown && (
              <span className={`countdown ${countdown === 'Expired' ? 'countdown--expired' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {countdown}
              </span>
            )}
          </div>
          <div className="token-value-row">
            <code className="token-value">{token}</code>
            <button className="btn btn-ghost btn-sm" onClick={copyToken} title="Copy token">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="btn btn-ghost btn-sm btn-danger-text" onClick={clearToken}>
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
