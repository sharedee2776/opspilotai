import { useState, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Reset failed — the link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">OpsPilot</span>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          {done ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-semibold">Password updated!</p>
              <p className="text-slate-400 text-sm">Your password has been reset successfully.</p>
              <Link to="/login" className="block w-full py-2 bg-brand text-white rounded-lg text-sm font-medium text-center mt-4">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Choose a new password</h1>
              <p className="text-slate-400 text-sm mb-5">Must be at least 8 characters.</p>

              {!token && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Invalid reset link — please request a new one.
                </div>
              )}
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">New password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" minLength={8}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <button type="submit" disabled={loading || !token}
                  className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  {loading ? 'Saving…' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          <Link to="/login" className="text-brand-light hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
