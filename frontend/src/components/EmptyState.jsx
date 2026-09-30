// frontend/src/components/EmptyState.jsx
import { Sparkles } from 'lucide-react';

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  size = 'md',
}) {
  const pad = size === 'sm' ? 'py-6 px-4' : 'py-12 px-6';
  const iconSize = size === 'sm' ? 28 : 40;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${pad}`}
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 text-brand-400" aria-hidden>
        {icon ?? <Sparkles size={iconSize} />}
      </div>

      <h3 className="text-base font-semibold text-white">{title}</h3>

      <p className="mt-1 text-sm text-white/50 max-w-xs leading-relaxed">
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:opacity-90 transition min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}