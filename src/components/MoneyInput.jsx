import { useState, useEffect } from 'react';

const formatCents = (cents) => (cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function MoneyInput({ value, onChange, className, autoFocus, onBlur, onKeyDown }) {
  const [cents, setCents] = useState(() => Math.round((Number(value) || 0) * 100));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setCents(Math.round((Number(value) || 0) * 100));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={formatCents(cents)}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        const next = digits === '' ? 0 : Number(digits);
        setCents(next);
        onChange((next / 100).toFixed(2));
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}
