import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    authApi.verifyEmail(token)
      .then((res) => { setMessage(res.message ?? 'Email verified!'); setStatus('success'); })
      .catch((err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setMessage(typeof msg === 'string' ? msg : 'Verification failed — the link may have expired.');
        setStatus('error');
      });
  }, [token]);

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

        <div className="bg-surface-card rounded-xl border border-surface-border p-6 text-center space-y-3">
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-semibold">Email verified!</p>
              <p className="text-slate-400 text-sm">{message}</p>
              <Link to="/" className="block w-full py-2 bg-brand text-white rounded-lg text-sm font-medium mt-4">
                Go to dashboard
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-white font-semibold">Verification failed</p>
              <p className="text-slate-400 text-sm">{message}</p>
              <Link to="/" className="block w-full py-2 bg-brand text-white rounded-lg text-sm font-medium mt-4">
                Go to dashboard
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          <Link to="/login" className="text-brand-light hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
