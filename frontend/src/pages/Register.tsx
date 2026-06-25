import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Zap, CheckCircle } from 'lucide-react';

const STEPS = ['Account', 'Workspace', 'Done'];

export default function Register() {
  const { loginWithData } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  function nextStep(e: FormEvent) {
    e.preventDefault();
    if (step === 0) {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setStep(1);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        organizationName: form.organizationName,
      });
      loginWithData(res);
      setStep(2);
      setTimeout(() => navigate('/settings?onboarding=1'), 1800);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  i < step
                    ? 'text-green-400'
                    : i === step
                    ? 'text-white'
                    : 'text-slate-600'
                }`}
              >
                {i < step ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      i === step ? 'bg-brand text-white' : 'bg-surface-border text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? 'bg-green-400' : 'bg-surface-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          {step === 2 ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-1">Workspace created!</h2>
              <p className="text-slate-400 text-sm">Taking you to setup…</p>
            </div>
          ) : step === 0 ? (
            /* Step 1: Account */
            <>
              <h1 className="text-lg font-semibold text-white mb-5">Create your account</h1>
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={nextStep} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Work email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  Continue →
                </button>
              </form>
            </>
          ) : (
            /* Step 2: Workspace */
            <>
              <h1 className="text-lg font-semibold text-white mb-2">Name your workspace</h1>
              <p className="text-slate-400 text-sm mb-5">
                This is the name of your team or company. You can change it later.
              </p>
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Workspace name</label>
                  <input
                    required
                    value={form.organizationName}
                    onChange={(e) => set('organizationName', e.target.value)}
                    placeholder="Acme Engineering"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                  />
                  <p className="text-slate-600 text-xs mt-1">Your team will see this name in notifications</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="px-4 py-2 border border-surface-border text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    {loading ? 'Creating workspace…' : 'Create workspace'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {step < 2 && (
          <p className="text-center text-slate-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-light hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
