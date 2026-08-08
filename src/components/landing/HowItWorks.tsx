const STEPS = [
  {
    n: '01',
    title: 'Pick a trainer',
    description: 'Preflop ranges, postflop scenarios, or GTO frequency drills — start wherever your game needs it most.',
  },
  {
    n: '02',
    title: 'Get instant feedback',
    description: 'Every decision is graded on the spot, with the full action mix and the reasoning behind it.',
  },
  {
    n: '03',
    title: 'Watch your leaks shrink',
    description: 'The Leak Finder and dashboard track accuracy by category so you know exactly what to drill next.',
  },
];

export function HowItWorks() {
  return (
    <section className="mt-28">
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">How it works</h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n}>
            <div className="font-mono text-sm text-gold">{step.n}</div>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
