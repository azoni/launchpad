import { useState, useCallback, useEffect } from 'react';
import Hero from './components/Hero';
import ResultCard from './components/ResultCard';
import History from './components/History';
import Footer from './components/Footer';
import { fetchBenchmark } from './utils/api';
import { addToHistory } from './utils/history';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Launchpad analytics beacon — total views
  useEffect(() => {
    fetch("https://azoni-mcp.onrender.com/launchpad/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_MCP_READ_KEY}`,
      },
      body: JSON.stringify({
        app: "benchmark",
        page: window.location.pathname,
      }),
    }).catch(() => {});
  }, []);

  // Unique session beacon
  useEffect(() => {
    const key = import.meta.env.VITE_MCP_READ_KEY;
    if (!key) return;
    try { if (sessionStorage.getItem("lp_unique_benchmark")) return; } catch { return; }
    fetch("https://azoni-mcp.onrender.com/launchpad/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        app: "benchmark:unique",
        page: window.location.pathname,
      }),
    })
      .then(() => { try { sessionStorage.setItem("lp_unique_benchmark", "1"); } catch {} })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(async (input) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchBenchmark(input);
      setResult(data);
      addToHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleHistorySelect = useCallback((item) => {
    setResult(item);
    setError(null);
  }, []);

  return (
    <div className="app">
      <main className="main">
        <Hero onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="error-card fade-in">
            <p>{error}</p>
            <button onClick={handleReset} className="btn btn-secondary">
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-card fade-in">
            <div className="loader" />
            <p>Calculating your bench...</p>
          </div>
        )}

        {result && !loading && (
          <ResultCard result={result} onReset={handleReset} />
        )}

        <History onSelect={handleHistorySelect} currentResult={result} />
      </main>

      <Footer />
    </div>
  );
}
