import { useState } from 'react';

const EXAMPLES = [
  "I'm an SDE3 at Amazon",
  "Grandmaster in StarCraft as Zerg",
  "I run marathons",
  "I built a startup",
  "Diamond in League of Legends",
];

const PLACEHOLDERS = [
  "I'm an SDE3 at Amazon",
  "Grandmaster in StarCraft as Zerg",
  "I solved 500 LeetCode problems",
  "I wake up at 5am every day",
];

export default function Hero({ onSubmit, loading }) {
  const [input, setInput] = useState('');
  const [placeholderIdx] = useState(
    () => Math.floor(Math.random() * PLACEHOLDERS.length)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val || loading) return;
    onSubmit(val);
  };

  const handleExample = (text) => {
    setInput(text);
    if (!loading) onSubmit(text);
  };

  const handleRandom = () => {
    const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    handleExample(pick);
  };

  return (
    <section className="hero">
      <h1 className="hero-title">
        Benchmark<span className="hero-title-accent"> your achievements</span>
      </h1>
      <p className="hero-subtitle">Turn anything into a bench press.</p>

      <form className="hero-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="hero-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          maxLength={500}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Converting...' : 'Convert to Bench'}
        </button>
      </form>

      <div className="chips">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="chip"
            onClick={() => handleExample(ex)}
            disabled={loading}
          >
            {ex}
          </button>
        ))}
        <button
          className="chip chip-random"
          onClick={handleRandom}
          disabled={loading}
        >
          Random
        </button>
      </div>
    </section>
  );
}
