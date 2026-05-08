import { useState, FormEvent } from "react";
import { parseCidr } from "../lib/subnet";

type Props = {
  initialValue: string;
  onSubmit: (input: string) => void;
};

export function InputBar({ initialValue, onSubmit }: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    try {
      parseCidr(value);
      setError(null);
      onSubmit(value);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
          Network / CIDR
        </label>
        <input
          className="input font-mono w-64"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="10.0.0.0/24"
          aria-invalid={!!error}
          spellCheck={false}
        />
      </div>
      <button type="submit" className="btn btn-accent">
        Update
      </button>
      {error && (
        <span className="text-xs text-rose-600 dark:text-rose-400 self-center">{error}</span>
      )}
    </form>
  );
}
