import { Info } from 'lucide-react';

export function InfoTooltip({ text }) {
  if (!text) return null;
  return (
    <span className="relative inline-flex shrink-0 group align-middle ml-1.5">
      <button
        type="button"
        className="flex items-center text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 focus:text-slate-600 dark:focus:text-white/70 focus:outline-none"
        aria-label="More details"
      >
        <Info size={14} />
      </button>
      <span className="pointer-events-none absolute z-20 left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block w-56 rounded-lg bg-slate-800 dark:bg-black px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-lg">
        {text}
      </span>
    </span>
  );
}
