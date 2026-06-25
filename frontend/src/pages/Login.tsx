import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Zap, AlertCircle, X, CheckCircle } from 'lucide-react';

const FIREBASE_ENABLED = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your-api-key'
);

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Login() {
  const { loginWithData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (FIREBASE_ENABLED) {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await cred.user.getIdToken();
        const res = await authApi.firebaseLogin(idToken);
        loginWithData(res);
      } else {
        const res = await authApi.login(email, password);
        loginWithData(res);
      }
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Reset your password or try again later.');
      } else if (typeof msg === 'string') {
        setError(msg);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!FIREBASE_ENABLED) { setError('Google login requires Firebase configuration.'); return; }
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      const idToken = await cred.user.getIdToken();
      const res = await authApi.firebaseLogin(idToken);
      loginWithData(res);
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail || email);
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Please check the address.');
      setShowReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">OpsPilot</span>
          </div>
          <p className="text-slate-400 text-sm">AI-powered incident management</p>
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          <h1 className="text-lg font-semibold text-white mb-5">Sign in to your workspace</h1>

          {error && (
            <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-surface-border hover:border-slate-500 text-white rounded-lg text-sm transition-colors mb-4 disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-slate-600 text-xs">or email</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-brand-light hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-light hover:underline">
            Create a free workspace
          </Link>
        </p>
      </div>

      {/* Password reset modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm p-6">
            {resetSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium mb-1">Reset email sent</p>
                <p className="text-slate-400 text-sm mb-4">Check your inbox for a password reset link.</p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="w-full py-2 bg-brand text-white rounded-lg text-sm font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white font-semibold mb-1">Reset your password</h2>
                <p className="text-slate-400 text-sm mb-4">Enter your email and we'll send a reset link.</p>
                <form onSubmit={handleReset} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resetEmail || email}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="flex-1 py-2 border border-surface-border text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-brand text-white rounded-lg text-sm font-medium"
                    >
                      Send link
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
