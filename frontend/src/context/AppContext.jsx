import { createContext, useContext, useState, useCallback, useRef } from 'react';

const GATEWAY_URL = 'http://localhost:3000';

const AppContext = createContext(null);

function decodeJwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
  } catch {
    return Date.now() + 24 * 60 * 60 * 1000;
  }
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [requestLogs, setRequestLogs] = useState([]);
  const [inFlight, setInFlight] = useState(false);
  const flightCount = useRef(0);

  const addLog = useCallback((entry) => {
    setRequestLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const setFlight = useCallback((active) => {
    if (active) {
      flightCount.current += 1;
      setInFlight(true);
    } else {
      flightCount.current = Math.max(0, flightCount.current - 1);
      if (flightCount.current === 0) setInFlight(false);
    }
  }, []);

  const storeToken = useCallback((newToken) => {
    setToken(newToken);
    setTokenExpiry(decodeJwtExpiry(newToken));
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
    setTokenExpiry(null);
  }, []);

  const gatewayFetch = useCallback(
    async (path, options = {}) => {
      const { method = 'GET', body, skipAuth = false, label } = options;
      const url = `${GATEWAY_URL}${path}`;
      const headers = { 'Content-Type': 'application/json', ...options.headers };

      if (!skipAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      setFlight(true);
      const start = performance.now();

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const elapsed = Math.round(performance.now() - start);
        let data;
        const text = await res.text();
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = { raw: text };
        }

        addLog({
          id: crypto.randomUUID(),
          method,
          endpoint: label || path,
          status: res.status,
          latency: elapsed,
          time: new Date().toISOString(),
        });

        return { ok: res.ok, status: res.status, data, latency: elapsed };
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        addLog({
          id: crypto.randomUUID(),
          method,
          endpoint: label || path,
          status: 0,
          latency: elapsed,
          time: new Date().toISOString(),
          error: err.message,
        });
        return {
          ok: false,
          status: 0,
          data: { error: err.message || 'Network error — is the gateway running on port 3000?' },
          latency: elapsed,
        };
      } finally {
        setFlight(false);
      }
    },
    [token, addLog, setFlight]
  );

  return (
    <AppContext.Provider
      value={{
        gatewayUrl: GATEWAY_URL,
        token,
        tokenExpiry,
        storeToken,
        clearToken,
        requestLogs,
        gatewayFetch,
        inFlight,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
