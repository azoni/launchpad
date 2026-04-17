import { useEffect, useRef } from 'react';

interface Props {
  include55: boolean;
  onInclude55Change: (value: boolean) => void;
  onClose: () => void;
}

export default function SettingsPanel({ include55, onInclude55Change, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="settings-panel" ref={panelRef} role="dialog" aria-label="Settings">
      <p className="section-label">Plates</p>
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={include55}
          onChange={(e) => onInclude55Change(e.target.checked)}
        />
        <span className="settings-toggle-track" aria-hidden="true">
          <span className="settings-toggle-thumb" />
        </span>
        <span className="settings-toggle-label">
          <span className="settings-toggle-swatch" style={{ background: '#e63946' }} />
          Include 55 lb plates
        </span>
      </label>
    </div>
  );
}
