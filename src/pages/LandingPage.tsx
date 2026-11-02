import { PageShell } from '@/components/layout/PageShell';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FreeCallout } from '@/components/landing/FreeCallout';

// RangeChartTeaser.tsx and Faq.tsx are no longer on the page (storyboard section 2); files kept, unused
export function LandingPage() {
  return (
    <PageShell>
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <FreeCallout />
    </PageShell>
  );
}
