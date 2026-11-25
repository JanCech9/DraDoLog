import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'> & {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  /** Allow a leading minus (OZ, iniciativa). Drops inputMode="numeric": iOS shows no minus key on that keypad. */
  allowNegative?: boolean;
  /** Value committed when the field is left empty. Defaults to `min`, or 0. */
  fallback?: number;
};

/**
 * Number field that lets you clear it on a phone.
 *
 * A plain controlled `<input type="number">` that maps "" to 0 (or to a
 * minimum) snaps back the moment the last digit is deleted, so changing 1 to 2
 * meant typing 21 and deleting the 1. Here the typed text is kept locally
 * while editing and pushed up only when it parses; an emptied field gets
 * `fallback` on blur. The content is selected on focus, so typing replaces it.
 */
export function NumberInput({ value, onChange, min, max, allowNegative, fallback, onFocus, onBlur, ...rest }: Props) {
  const [typing, setTyping] = useState<string | null>(null);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  return (
    <input
      {...rest}
      type="number"
      inputMode={allowNegative ? undefined : 'numeric'}
      min={min}
      max={max}
      value={typing ?? value}
      onFocus={(e) => {
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setTyping(raw);
        const n = Number(raw);
        if (raw !== '' && Number.isFinite(n)) onChange(clamp(n));
      }}
      onBlur={(e) => {
        if (typing !== null && (typing === '' || !Number.isFinite(Number(typing)))) {
          onChange(clamp(fallback ?? min ?? 0));
        }
        setTyping(null);
        onBlur?.(e);
      }}
    />
  );
}
