import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { WalletsImportsPage } from "./pages/WalletsImportsPage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { TaxSummaryPage } from "./pages/TaxSummaryPage";
import { ExportsPage } from "./pages/ExportsPage";
import { AppShell } from "./components/layout/AppShell";
import { ALLOWED_UID } from "./lib/env";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="ledger-bg flex h-screen items-center justify-center text-[color:var(--color-ink-faint)]">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Hard guard: this is a single-user app. If a stranger somehow signs in,
  // refuse to render the app shell. (Firestore rules also enforce this.)
  if (ALLOWED_UID && user.uid !== ALLOWED_UID) {
    return (
      <div className="ledger-bg flex h-screen flex-col items-center justify-center gap-2 text-[color:var(--color-ink)]">
        <div className="font-display text-2xl font-bold">Access denied</div>
        <div className="text-sm text-[color:var(--color-ink-faint)]">
          This is a personal app. Signed-in UID is not authorized.
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AuthGate><OverviewPage /></AuthGate>} />
      <Route path="/wallets" element={<AuthGate><WalletsImportsPage /></AuthGate>} />
      <Route path="/review" element={<AuthGate><ReviewQueuePage /></AuthGate>} />
      <Route path="/transactions" element={<AuthGate><TransactionsPage /></AuthGate>} />
      <Route path="/summary" element={<AuthGate><TaxSummaryPage /></AuthGate>} />
      <Route path="/exports" element={<AuthGate><ExportsPage /></AuthGate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
