const RED_SUITS = new Set(['♥', '♦']);

export function MiniCard({ card, size = 'md' }: { card: string; size?: 'sm' | 'md' }) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const isRed = RED_SUITS.has(suit);
  const dims = size === 'sm' ? 'h-10 w-7 text-sm' : 'h-16 w-11 text-lg';

  return (
    <div
      className={`flex ${dims} flex-col items-center justify-center rounded-md border border-border-strong bg-surface-2 font-mono font-bold`}
      style={{ color: isRed ? 'var(--color-error)' : 'var(--color-ink)' }}
    >
      <span>{rank}</span>
      <span className="-mt-1">{suit}</span>
    </div>
  );
}
