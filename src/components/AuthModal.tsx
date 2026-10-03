import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, Mail, User, Phone, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Database } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup' | 'admin';
  onSuccessRedirect?: (user?: any) => void;
  onOpenBackendStorage?: (tableName: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccessRedirect,
  onOpenBackendStorage,
}) => {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'admin'>(initialTab);

  // Sync tab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setValidationError(null);
    }
  }, [isOpen, initialTab]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [signupSuccessUser, setSignupSuccessUser] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!loginEmail || !loginPassword) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const loggedUser = await login(loginEmail, loginPassword);
    setSubmitting(false);

    if (loggedUser) {
      if (tab === 'admin' && loggedUser.role !== 'admin') {
        setValidationError('This account does not have administrator privileges. Please use Customer Login.');
        return;
      }
      onClose();
      if (onSuccessRedirect) onSuccessRedirect(loggedUser);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setValidationError('Please provide a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const loggedUser = await signup({
      name,
      email: signupEmail,
      phone,
      password: signupPassword,
      confirmPassword,
    });
    setSubmitting(false);

    if (loggedUser) {
      setSignupSuccessUser(loggedUser);
    }
  };

  const handleCloseModal = () => {
    setSignupSuccessUser(null);
    onClose();
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={handleCloseModal}
    >
      <div
        id="auth-modal-dialog"
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {signupSuccessUser ? (
          /* STEP 2: REGISTRATION SUCCESS CONFIRMATION */
          <div id="signup-backend-verification-screen" className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>ACCOUNT CREATED SUCCESSFULLY</span>
              </span>
              <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                Welcome to Subscribo!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your account is ready. You can now subscribe to plans and manage renewals.
              </p>
            </div>

            {/* Account Details Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                <span className="text-slate-500">user_id:</span>
                <span className="font-bold text-indigo-700">#{signupSuccessUser.user_id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                <span className="text-slate-500">name:</span>
                <span className="text-slate-900 font-sans font-semibold">{signupSuccessUser.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                <span className="text-slate-500">email:</span>
                <span className="text-slate-900">{signupSuccessUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                <span className="text-slate-500">phone:</span>
                <span className="text-slate-900">{signupSuccessUser.phone || '(not provided)'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                <span className="text-slate-500">password:</span>
                <span className="text-emerald-700 font-sans text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Bcrypt Encrypted
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">role / status:</span>
                <span className="font-bold text-slate-800">{signupSuccessUser.role} / {signupSuccessUser.status}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {signupSuccessUser.role === 'admin' && onOpenBackendStorage && (
                <button
                  id="btn-signup-check-backend"
                  onClick={() => {
                    handleCloseModal();
                    onOpenBackendStorage('users');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Check Backend Storage</span>
                </button>
              )}

              <button
                id="btn-signup-done-dashboard"
                onClick={() => {
                  handleCloseModal();
                  if (onSuccessRedirect) onSuccessRedirect(signupSuccessUser);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Navigation Bar: Back Symbol and Close Button */}
            <div className="flex items-center justify-between mb-4">
              <button
                id="auth-back-btn"
                type="button"
                onClick={() => {
                  if (tab === 'signup') {
                    setTab('login');
                  } else {
                    handleCloseModal();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer group"
                title="Go back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-transform group-hover:-translate-x-0.5" />
                <span>{tab === 'signup' ? 'Back to Sign In' : 'Back'}</span>
              </button>

              <button
                id="close-auth-modal-btn"
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6">
          <button
            id="tab-switch-login"
            onClick={() => {
              setTab('login');
              setValidationError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Login
          </button>
          <button
            id="tab-switch-admin"
            onClick={() => {
              setTab('admin');
              setValidationError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              tab === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
          <button
            id="tab-switch-signup"
            onClick={() => {
              setTab('signup');
              setValidationError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Validation error notification */}
        {validationError && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl leading-relaxed">
            {validationError}
          </div>
        )}

        {/* USER LOGIN VIEW */}
        {tab === 'login' && (
          <div>
            <div className="mb-5 text-center">
              <h3 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                Welcome Back
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to manage your active subscriptions and payments
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember-me-checkbox" className="ml-2 text-xs text-slate-600">
                  Remember my session
                </label>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setValidationError(null);
                  }}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
              <p className="text-xs text-slate-500">
                Are you an administrator?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('admin');
                    setValidationError(null);
                  }}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Switch to Admin Sign In</span>
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN VIEW */}
        {tab === 'admin' && (
          <div>
            <div className="mb-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Administrator Control Center</span>
              </div>
              <h3 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                Admin Sign In
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authenticate with your system administrator credentials
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Admin Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="admin-password-input"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="admin-remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="admin-remember-me-checkbox" className="ml-2 text-xs text-slate-600">
                  Keep administrator session active
                </label>
              </div>

              <button
                id="submit-admin-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Not an administrator?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setValidationError(null);
                  }}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Switch to Customer Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* SIGN UP VIEW */}
        {tab === 'signup' && (
          <div>
            <div className="mb-4 text-center">
              <h3 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                Create Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Join Subscribo to browse plans and manage your subscriptions
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Madhumitha R"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    id="signup-password-input"
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    id="signup-confirm-password-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Passwords are securely encrypted with industry-standard bcrypt.</span>
              </div>

              <button
                id="submit-signup-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {submitting ? 'Creating account...' : 'Create My Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
