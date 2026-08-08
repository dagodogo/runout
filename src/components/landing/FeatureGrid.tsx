import {
  Grid3x3,
  Layers,
  Percent,
  Search,
  LineChart,
  Trophy,
  BookOpen,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: 'gold' | 'violet' | 'raise' | 'call';
}

const FEATURES: Feature[] = [
  {
    icon: Grid3x3,
    title: 'Preflop Range Trainer',
    description: 'Drill every position\'s opening range on a full 169-hand grid until raise/fold is instinct.',
    tone: 'gold',
  },
  {
    icon: Layers,
    title: 'Postflop Scenario Trainer',
    description: 'Realistic flop, turn, and river spots — compare every line\'s EV, not just win or lose.',
    tone: 'violet',
  },
  {
    icon: Percent,
    title: 'GTO Frequency Trainer',
    description: 'Learn to feel mixed strategies — the blend zones where hands split between two actions.',
    tone: 'raise',
  },
  {
    icon: Search,
    title: 'Leak Finder',
    description: 'Every rep is logged and categorized automatically, surfacing your weakest spots first.',
    tone: 'call',
  },
  {
    icon: LineChart,
    title: 'Analytics Dashboard',
    description: 'Accuracy trends, position breakdowns, and reps tracked over time — all in one view.',
    tone: 'gold',
  },
  {
    icon: Trophy,
    title: '12 Skill Tiers',
    description: 'Earn XP with every rep and climb from Limper to Runout Elite as your accuracy improves.',
    tone: 'violet',
  },
  {
    icon: BookOpen,
    title: 'Learn Hub',
    description: 'A free odds calculator, glossary, and printable range charts — no login required.',
    tone: 'raise',
  },
  {
    icon: ShieldCheck,
    title: 'Local-first & private',
    description: 'No account, no server. Your practice history lives in your browser, not our database.',
    tone: 'call',
  },
];

const TONE_CLASSES: Record<Feature['tone'], string> = {
  gold: 'bg-gold/10 text-gold',
  violet: 'bg-violet/10 text-violet-soft',
  raise: 'bg-raise/10 text-raise-soft',
  call: 'bg-call/10 text-call-soft',
};

export function FeatureGrid() {
  return (
    <section className="mt-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Everything you need to actually get better
        </h2>
        <p className="mt-3 text-ink-muted">
          Not a static chart dump — a training loop that adapts to where you're actually leaking money.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASSES[f.tone]}`}>
              <f.icon size={20} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{f.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
