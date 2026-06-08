import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('json', json);

export default function JsonResponse({ data, status, latency, compact }) {
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [data]);

  const isOk = status >= 200 && status < 300;
  const jsonStr = data != null ? JSON.stringify(data, null, 2) : 'null';

  return (
    <div className={`json-panel ${compact ? 'json-panel--compact' : ''}`}>
      <div className="json-panel-header">
        <span className={`status-badge ${isOk ? 'status-badge--ok' : 'status-badge--err'}`}>
          <span className="status-dot" />
          {status || 'ERR'}
        </span>
        {latency != null && <span className="latency-badge">{latency} ms</span>}
      </div>
      <pre className="json-pre">
        <code ref={codeRef} className="language-json">
          {jsonStr}
        </code>
      </pre>
    </div>
  );
}
