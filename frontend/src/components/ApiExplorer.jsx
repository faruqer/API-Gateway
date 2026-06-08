import { useState } from 'react';
import { useApp } from '../context/AppContext';
import JsonResponse from './JsonResponse';

const TABS = [
  { id: 'weather', label: 'Weather', icon: '☁' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
];

const DEFAULTS = {
  city: 'London',
  topic: 'technology',
  symbol: 'BTC',
};

export default function ApiExplorer() {
  const { token, gatewayFetch } = useApp();
  const [activeTab, setActiveTab] = useState('weather');
  const [params, setParams] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [dashboardResponses, setDashboardResponses] = useState(null);

  const updateParam = (key, value) => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const sendRequest = async () => {
    if (!token) return;

    setLoading(true);
    setResponse(null);
    setDashboardResponses(null);

    if (activeTab === 'dashboard') {
      const [weather, news, crypto] = await Promise.all([
        gatewayFetch(`/weather?city=${encodeURIComponent(params.city)}`, { label: '/weather' }),
        gatewayFetch(`/news?topic=${encodeURIComponent(params.topic)}`, { label: '/news' }),
        gatewayFetch(`/crypto?symbol=${encodeURIComponent(params.symbol)}`, { label: '/crypto' }),
      ]);
      setDashboardResponses({ weather, news, crypto });
    } else {
      const paths = {
        weather: `/weather?city=${encodeURIComponent(params.city)}`,
        news: `/news?topic=${encodeURIComponent(params.topic)}`,
        crypto: `/crypto?symbol=${encodeURIComponent(params.symbol)}`,
      };
      const result = await gatewayFetch(paths[activeTab], { label: `/${activeTab}` });
      setResponse(result);
    }

    setLoading(false);
  };

  return (
    <section className="section glass-card explorer">
      <div className="section-header">
        <div className="section-icon explorer-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <div>
          <h2>Live API Explorer</h2>
          <p className="section-sub">Send real requests to the gateway at localhost:3000</p>
        </div>
      </div>

      {!token && (
        <div className="alert alert-info animate-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Authenticate first — get a JWT token above to unlock protected endpoints.
        </div>
      )}

      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setResponse(null);
              setDashboardResponses(null);
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="explorer-body">
        <div className="explorer-controls">
          <div className="param-grid">
            {(activeTab === 'weather' || activeTab === 'dashboard') && (
              <div className="input-group">
                <label htmlFor="city">city</label>
                <input
                  id="city"
                  value={params.city}
                  onChange={(e) => updateParam('city', e.target.value)}
                  placeholder="London"
                />
              </div>
            )}
            {(activeTab === 'news' || activeTab === 'dashboard') && (
              <div className="input-group">
                <label htmlFor="topic">topic</label>
                <input
                  id="topic"
                  value={params.topic}
                  onChange={(e) => updateParam('topic', e.target.value)}
                  placeholder="technology"
                />
              </div>
            )}
            {(activeTab === 'crypto' || activeTab === 'dashboard') && (
              <div className="input-group">
                <label htmlFor="symbol">symbol</label>
                <input
                  id="symbol"
                  value={params.symbol}
                  onChange={(e) => updateParam('symbol', e.target.value)}
                  placeholder="BTC"
                />
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-send"
            onClick={sendRequest}
            disabled={!token || loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Sending…
              </span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Request
              </>
            )}
          </button>
        </div>

        <div className="explorer-response">
          {activeTab === 'dashboard' && dashboardResponses && (
            <div className="dashboard-split">
              {['weather', 'news', 'crypto'].map((key) => (
                <div key={key} className="dashboard-panel">
                  <h4 className="dashboard-panel-title">{key}</h4>
                  <JsonResponse
                    data={dashboardResponses[key].data}
                    status={dashboardResponses[key].status}
                    latency={dashboardResponses[key].latency}
                    compact
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab !== 'dashboard' && response && (
            <JsonResponse
              data={response.data}
              status={response.status}
              latency={response.latency}
            />
          )}

          {!response && !dashboardResponses && (
            <div className="response-placeholder">
              <div className="placeholder-icon">{'{ }'}</div>
              <p>Response will appear here</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
