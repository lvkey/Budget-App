import { useState, useEffect } from 'react';

const VALID_PARTIAL = /^\d*\.?\d*$/;

export function MoneyInput({ value, onChange, className, autoFocus, onBlur, onKeyDown }) {
  const [text, setText] = useState(() => (Number(value) || 0).toFixed(2));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText((Number(value) || 0).toFixed(2));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      autoFocus={autoFocus}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (!VALID_PARTIAL.test(next)) return;
        setText(next);
        onChange(next);
      }}
      onBlur={(e) => {
        setFocused(false);
        setText((Number(value) || 0).toFixed(2));
        onBlur?.(e);
      }}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}
