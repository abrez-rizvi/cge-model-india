import { useState, useEffect } from 'react';

const PolicySlider = ({ label, value, min, max, step = 0.01, onChange, suffix = "", color = "var(--accent)", baseline = null }) => {
  const [displayValue, setDisplayValue] = useState(value);

  // Sync with prop value when it changes externally (e.g., Reset)
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInputChange = (e) => {
    const val = e.target.value;
    setDisplayValue(val);

    if (val !== "" && !isNaN(val)) {
      const numVal = Number(val);
      const clampedVal = Math.max(min, Math.min(max, numVal));
      onChange(clampedVal);
    }
  };

  const handleBlur = () => {
    if (displayValue === "" || isNaN(displayValue)) {
      setDisplayValue(value);
    } else {
      const numVal = Number(displayValue);
      const clamped = Math.max(min, Math.min(max, numVal));
      setDisplayValue(clamped);
      onChange(clamped);
    }
  };

  return (
    <div className="policy-slider-container">
      <div className="slider-top">
        <span className="slider-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            className="slider-val-input"
            value={displayValue}
            step={step}
            onChange={handleInputChange}
            onBlur={handleBlur}
            min={min}
            max={max}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{suffix}</span>
        </div>
      </div>

      <div className="policy-slider-track" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const p = x / rect.width;
        const val = min + p * (max - min);
        onChange(Math.round(val / step) * step);
      }}>
        {/* Progress Fill */}
        <div
          className="policy-slider-fill"
          style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${color}, #fff)` }}
        />

        {/* Baseline Marker */}
        {baseline !== null && (
          <div
            className="policy-slider-baseline"
            style={{ left: `${((baseline - min) / (max - min)) * 100}%` }}
          />
        )}

        {/* Thumb */}
        <div
          className="policy-slider-thumb"
          style={{ left: `${percentage}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute', opacity: 0, width: '100%', cursor: 'pointer',
          height: '20px', marginTop: '-20px', zIndex: 3
        }}
      />
    </div>
  );
};

export default PolicySlider;
