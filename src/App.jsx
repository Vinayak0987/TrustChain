import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { Web3Provider } from './context/Web3Context';
import { ToastProvider } from './components/shared/ToastProvider';

// Auth pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';

// App shell
import { AppLayout } from './components/layout/AppLayout';

// Core
import { DashboardPage } from './pages/DashboardPage';
import { TransactionLogPage } from './pages/TransactionLogPage';

// Borrower
import { BorrowerProfilePage } from './pages/borrower/BorrowerProfilePage';
import { RequestLoanPage } from './pages/borrower/RequestLoanPage';
import { RepaymentPage } from './pages/borrower/RepaymentPage';
import { CommunityVouchingPage } from './pages/borrower/CommunityVouchingPage';
import { CommunityPage } from './pages/borrower/CommunityPage';

// Lender
import { BrowseLoansPage } from './pages/lender/BrowseLoansPage';
import { LenderDashboardPage } from './pages/lender/LenderDashboardPage';
import { FundLoanPage } from './pages/lender/FundLoanPage';

// Trust
import { TrustScoreDetailPage } from './pages/trust/TrustScoreDetailPage';
import { IdentityVerificationPage } from './pages/trust/IdentityVerificationPage';

// KYC
import { KYCPage } from './pages/kyc/KYCPage';

// Governance
import { FraudVotingPage } from './pages/governance/FraudVotingPage';
import { LoanApprovalVotingPage } from './pages/governance/LoanApprovalVotingPage';

// Legacy prototype pages
import { SimulationPage } from './pages/SimulationPage';
import { PodPage } from './pages/PodPage';

// ─── Route Guards ─────────────────────────────────────────────

/**
 * PrivateRoute — redirects unauthenticated users to /login.
 * Shows a loading screen while session is being resolved to
 * prevent flash-of-content on page refresh.
 */
const PrivateRoute = ({ children }) => {
  const { isLoggedIn, authLoading } = useContext(AppContext);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0F9F9 0%, #F8FAFB 100%)',
        gap: '16px',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid rgba(59,155,155,0.2)',
          borderTopColor: '#3B9B9B',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#3B9B9B', fontWeight: 600, fontSize: '14px', margin: 0 }}>
          Loading TrustChain...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/**
 * PublicOnlyRoute — redirects already-logged-in users away
 * from /login and /signup back to the dashboard.
 */
const PublicOnlyRoute = ({ children }) => {
  const { isLoggedIn, authLoading } = useContext(AppContext);
  if (authLoading) return null; // Brief pause during session hydration
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
};

// ─── App ──────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Web3Provider>
        <AppProvider>
          <ToastProvider>
            <Routes>
              {/* ── Public Routes ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login"  element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />

              {/* ── Protected Routes (login required) ── */}

              {/* Dashboard */}
              <Route path="/dashboard" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<DashboardPage />} />
              </Route>

              {/* Transactions */}
              <Route path="/transactions" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<TransactionLogPage />} />
              </Route>

              {/* Borrower */}
              <Route path="/profile" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<BorrowerProfilePage />} />
              </Route>
              <Route path="/loan" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="request" replace />} />
                <Route path="request"   element={<RequestLoanPage />} />
                <Route path="repayment" element={<RepaymentPage />} />
                <Route path="fund"      element={<FundLoanPage />} />
              </Route>
              <Route path="/vouch" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<CommunityVouchingPage />} />
              </Route>
              <Route path="/community" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<CommunityPage />} />
              </Route>

              {/* Lender */}
              <Route path="/loans" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<BrowseLoansPage />} />
              </Route>
              <Route path="/lender" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<LenderDashboardPage />} />
              </Route>

              {/* Trust */}
              <Route path="/trust" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<TrustScoreDetailPage />} />
              </Route>
              <Route path="/verify" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<IdentityVerificationPage />} />
              </Route>

              {/* Governance */}
              <Route path="/fraud" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<FraudVotingPage />} />
              </Route>
              <Route path="/governance" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<LoanApprovalVotingPage />} />
              </Route>

              {/* KYC */}
              <Route path="/kyc" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<KYCPage />} />
              </Route>

              {/* Legacy prototype routes */}
              <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"  element={<DashboardPage />} />
                <Route path="pod"        element={<PodPage />} />
                <Route path="loan"       element={<RequestLoanPage />} />
                <Route path="simulation" element={<SimulationPage />} />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AppProvider>
      </Web3Provider>
    </BrowserRouter>
  );
}
