import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const PreflopTrainerPage = lazy(() =>
  import('./pages/PreflopTrainerPage').then((m) => ({ default: m.PreflopTrainerPage })),
);
const PostflopTrainerPage = lazy(() =>
  import('./pages/PostflopTrainerPage').then((m) => ({ default: m.PostflopTrainerPage })),
);
const GtoTrainerPage = lazy(() => import('./pages/GtoTrainerPage').then((m) => ({ default: m.GtoTrainerPage })));
const PlayHandPage = lazy(() => import('./pages/PlayHandPage').then((m) => ({ default: m.PlayHandPage })));
const PlayPloPage = lazy(() => import('./pages/PlayPloPage').then((m) => ({ default: m.PlayPloPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const LearnHubPage = lazy(() => import('./pages/LearnHubPage').then((m) => ({ default: m.LearnHubPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-gold" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/train/preflop" element={<PreflopTrainerPage />} />
          <Route path="/train/postflop" element={<PostflopTrainerPage />} />
          <Route path="/train/gto" element={<GtoTrainerPage />} />
          <Route path="/play" element={<PlayHandPage />} />
          <Route path="/play-plo" element={<PlayPloPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learn" element={<LearnHubPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
