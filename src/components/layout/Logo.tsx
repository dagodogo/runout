export function Logo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="inline-block -translate-y-0.5">
        <path
          d="M12 2c3.2 3.4 5 6.1 5 8.4a5 5 0 0 1-10 0C7 8.1 8.8 5.4 12 2Z"
          fill="var(--color-gold)"
        />
        <path
          d="M12 12.6c1.6 0 2.9-.3 2.9-.3s-.6 3.4-2.9 3.4-2.9-3.4-2.9-3.4.3.3 2.9.3Z"
          fill="var(--color-gold)"
          opacity="0.6"
        />
        <rect x="10.7" y="15.6" width="2.6" height="4.4" rx="0.6" fill="var(--color-gold)" />
        <rect x="8.4" y="19.4" width="7.2" height="1.8" rx="0.6" fill="var(--color-gold)" />
      </svg>
    </span>
  );
}
