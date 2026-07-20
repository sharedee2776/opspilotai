import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { MailWarning, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import Sidebar from './Sidebar';

export default function Layout() {
  const { isAuthenticated, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent'>('idle');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const showBanner = !dismissed && user && user.emailVerified === false;

  async function handleResend() {
    setResendState('loading');
    try {
      await authApi.resendVerification();
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-white overflow-hidden">
      {showBanner && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-sm">
          <MailWarning className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Please verify your email address to unlock all features.
            {resendState === 'sent' ? (
              <span className="ml-2 text-green-400">Verification email sent!</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendState === 'loading'}
                className="ml-2 underline hover:no-underline disabled:opacity-50"
              >
                {resendState === 'loading' ? 'Sending…' : 'Resend email'}
              </button>
            )}
          </span>
          <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
