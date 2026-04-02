import { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '../utils/history';

export default function History({ onSelect, currentResult }) {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // Refresh history when a new result comes in
  useEffect(() => {
    setItems(getHistory());
  }, [currentResult]);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, 5);

  return (
    <section className="history">
      <div className="history-header">
        <h3>Recent</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            clearHistory();
            setItems([]);
          }}
        >
          Clear
        </button>
      </div>

      <div className="history-list">
        {visible.map((item, i) => (
          <button
            key={`${item.normalized_input}-${i}`}
            className="history-item"
            onClick={() => onSelect(item)}
          >
            <span className="history-item-input">{item.normalized_input}</span>
            <span className="history-item-lbs">{item.bench_estimate} lbs</span>
          </button>
        ))}
      </div>

      {items.length > 5 && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </section>
  );
}
