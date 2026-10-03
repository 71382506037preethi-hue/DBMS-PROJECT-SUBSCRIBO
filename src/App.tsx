import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { SubscriptionDetailsModal } from './components/SubscriptionDetailsModal.tsx';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { PlansPage } from './pages/PlansPage.tsx';
import { UserDashboard } from './pages/UserDashboard.tsx';
import { MySubscriptionsPage } from './pages/MySubscriptionsPage.tsx';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage.tsx';
import { DbmsVivaConsole } from './pages/DbmsVivaConsole.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.tsx';
import { AdminPlansPage } from './pages/admin/AdminPlansPage.tsx';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage.tsx';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.tsx';

import { Plan, Subscription } from './types.ts';
import { api } from './services/api.ts';

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const toast = useToast();

  const [currentView, setCurrentView] = useState<string>('landing');
  const [initialDbmsTable, setInitialDbmsTable] = useState<string>('users');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'admin'>('login');

  const handleOpenBackendStorage = (tableName: string = 'users') => {
    setInitialDbmsTable(tableName);
    setCurrentView('dbms-console');
  };

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [paymentMode, setPaymentMode] = useState<'subscribe' | 'renew' | 'upgrade'>('subscribe');
  const [targetSubscription, setTargetSubscription] = useState<Subscription | null>(null);

  // Subscription details modal state
  const [detailsSubId, setDetailsSubId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  // Receipt modal state
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // User's active subscription cache for plan buttons
  const [userActiveSub, setUserActiveSub] = useState<Subscription | null>(null);

  const fetchActiveSubscription = async () => {
    if (user && !isAdmin) {
      try {
        const res = await api.subscriptions.getAll();
        const active = res.subscriptions.find((s) => s.status === 'active' || s.status === 'expiring_soon');
        setUserActiveSub(active || null);
      } catch (err) {
        // silent catch
      }
    } else {
      setUserActiveSub(null);
    }
  };

  useEffect(() => {
    fetchActiveSubscription();
  }, [user]);

  // Handlers for plans
  const handleSelectPlan = (plan: Plan, mode: 'subscribe' | 'upgrade' = 'subscribe') => {
    if (!user) {
      toast.info('Please sign in or create an account to subscribe.', 'Sign In Required');
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }
    setSelectedPlanForPayment(plan);
    setPaymentMode(mode);
    setTargetSubscription(mode === 'upgrade' ? userActiveSub : null);
    setPaymentModalOpen(true);
  };

  // Handlers for renewal
  const handleRenewSubscription = (sub: Subscription) => {
    const mockPlan: Plan = {
      plan_id: sub.plan_id,
      plan_name: sub.plan_name,
      description: sub.plan_description || `${sub.plan_name} renewal`,
      price: sub.price,
      duration_days: sub.duration_days,
      billing_cycle: sub.billing_cycle,
      features: sub.features,
      max_users: sub.max_users,
      status: 'active',
    };
    setSelectedPlanForPayment(mockPlan);
    setPaymentMode('renew');
    setTargetSubscription(sub);
    setPaymentModalOpen(true);
  };

  // Handlers for upgrade
  const handleUpgradeSubscription = (sub: Subscription) => {
    setTargetSubscription(sub);
    setCurrentView('plans');
    toast.info('Select a higher tier plan to upgrade your membership.');
  };

  // Handler for subscription details
  const handleViewSubscriptionDetails = (id: number) => {
    setDetailsSubId(id);
    setDetailsModalOpen(true);
  };

  // Handler for viewing receipt
  const handleViewReceipt = (paymentId: number) => {
    setReceiptPaymentId(paymentId);
    setReceiptModalOpen(true);
  };

  // When payment completes
  const handlePaymentSuccess = (txnId: string, subscriptionId: number) => {
    fetchActiveSubscription();
    if (isAdmin) {
      setCurrentView('admin-subscriptions');
    } else {
      setCurrentView('user-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Global Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={(tab = 'login') => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onExplorePlans={() => setCurrentView('plans')}
            onGetStarted={() => {
              if (user) {
                setCurrentView(isAdmin ? 'admin-dashboard' : 'user-dashboard');
              } else {
                setAuthModalTab('signup');
                setAuthModalOpen(true);
              }
            }}
            onSelectPlan={(p) => handleSelectPlan(p, 'subscribe')}
            onOpenAdminLogin={() => {
              setAuthModalTab('admin');
              setAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'plans' && (
          <PlansPage
            onSelectPlan={handleSelectPlan}
            userActiveSubscription={userActiveSub}
          />
        )}

        {currentView === 'user-dashboard' && (
          <UserDashboard
            onNavigate={(view) => setCurrentView(view)}
            onRenewSubscription={handleRenewSubscription}
            onUpgradeSubscription={handleUpgradeSubscription}
            onViewSubscriptionDetails={handleViewSubscriptionDetails}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {currentView === 'my-subscriptions' && (
          <MySubscriptionsPage
            onRenew={handleRenewSubscription}
            onUpgrade={handleUpgradeSubscription}
            onViewDetails={handleViewSubscriptionDetails}
            onExplorePlans={() => setCurrentView('plans')}
          />
        )}

        {currentView === 'payment-history' && (
          <PaymentHistoryPage onViewReceipt={handleViewReceipt} />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onNavigate={(view) => setCurrentView(view)} />
        )}

        {currentView === 'admin-users' && <AdminUsersPage />}

        {currentView === 'admin-plans' && <AdminPlansPage />}

        {currentView === 'admin-subscriptions' && (
          <AdminSubscriptionsPage
            onViewSubscriptionDetails={handleViewSubscriptionDetails}
          />
        )}

        {currentView === 'admin-reports' && <AdminReportsPage />}

        {currentView === 'dbms-console' && (
          isAdmin ? (
            <DbmsVivaConsole
              initialTable={initialDbmsTable}
              onOpenSignUp={() => {
                setAuthModalTab('signup');
                setAuthModalOpen(true);
              }}
              onOpenPlans={() => setCurrentView('plans')}
              onOpenAdminPlans={() => setCurrentView('admin-plans')}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold">🔒</span>
              </div>
              <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                Admin Access Required
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The Backend Storage database console is strictly restricted to administrators. Please sign in with an administrator account to view backend tables.
              </p>
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In as Admin
              </button>
            </div>
          )
        )}

        {/* Fallback to landing if currentView is unrecognized */}
        {!['landing', 'plans', 'user-dashboard', 'my-subscriptions', 'payment-history', 'admin-dashboard', 'admin-users', 'admin-plans', 'admin-subscriptions', 'admin-reports', 'dbms-console'].includes(currentView) && (
          <LandingPage
            onExplorePlans={() => setCurrentView('plans')}
            onGetStarted={() => {
              if (user) {
                setCurrentView(isAdmin ? 'admin-dashboard' : 'user-dashboard');
              } else {
                setAuthModalTab('signup');
                setAuthModalOpen(true);
              }
            }}
            onSelectPlan={(p) => handleSelectPlan(p, 'subscribe')}
            onOpenAdminLogin={() => {
              setAuthModalTab('admin');
              setAuthModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onOpenBackendStorage={handleOpenBackendStorage}
        onSuccessRedirect={(loggedInUser) => {
          fetchActiveSubscription();
          const targetRole = loggedInUser?.role || user?.role;
          if (targetRole === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setCurrentView('user-dashboard');
          }
        }}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        mode={paymentMode}
        existingSubscription={targetSubscription}
        onSuccess={handlePaymentSuccess}
        onOpenBackendStorage={handleOpenBackendStorage}
      />

      <SubscriptionDetailsModal
        isOpen={detailsModalOpen}
        subscriptionId={detailsSubId}
        onClose={() => setDetailsModalOpen(false)}
        onRenewClick={handleRenewSubscription}
        onUpgradeClick={handleUpgradeSubscription}
        onViewReceipt={handleViewReceipt}
        onSubscriptionUpdated={() => {
          fetchActiveSubscription();
        }}
      />

      <InvoiceReceiptModal
        isOpen={receiptModalOpen}
        paymentId={receiptPaymentId}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
