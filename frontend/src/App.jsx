import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>Crisis Monitor</h1>
        <p>Real-time public post monitoring dashboard</p>
      </header>

      <section className="status-card">
        <h2>System status</h2>
        <p>
          Backend:{' '}
          <span className={`badge badge--${backendStatus}`}>{backendStatus}</span>
        </p>
        <p className="hint">
          Filtered Mastodon posts are logged in the backend console.
        </p>
      </section>
    </div>
  );
}

export default App;
