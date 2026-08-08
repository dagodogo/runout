import { PageShell } from '@/components/layout/PageShell';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { RangeChartTeaser } from '@/components/landing/RangeChartTeaser';
import { FreeCallout } from '@/components/landing/FreeCallout';
import { Faq } from '@/components/landing/Faq';

export function LandingPage() {
  return (
    <PageShell>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <RangeChartTeaser />
      <FreeCallout />
      <Faq />
    </PageShell>
  );
}
