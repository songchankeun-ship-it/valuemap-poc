export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`ui-brand-mark inline-flex items-center justify-center rounded-md ${className}`} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
        <circle cx="13" cy="15" r="7" stroke="currentColor" strokeWidth="2.4" />
        <path d="M8 19L20 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
