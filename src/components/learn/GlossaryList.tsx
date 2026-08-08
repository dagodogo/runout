import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { GLOSSARY } from '@/data/glossary';

export function GlossaryList() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Glossary</h3>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search terms…"
        aria-label="Search glossary"
        className="mt-4 w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold"
      />
      <dl className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
        {filtered.map((t) => (
          <div key={t.term}>
            <dt className="font-mono text-sm font-semibold text-gold">{t.term}</dt>
            <dd className="mt-0.5 text-sm text-ink-muted">{t.definition}</dd>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-faint">No terms match "{query}".</p>}
      </dl>
    </Card>
  );
}
