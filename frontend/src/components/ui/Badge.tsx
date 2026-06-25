import { ReactNode } from 'react';

const variants = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  active: 'bg-red-500/15 text-red-400 border-red-500/20',
  investigating: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-green-500/15 text-green-400 border-green-500/20',
  pending: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  grouped: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  suggested: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  approved: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  executing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  success: 'bg-green-500/15 text-green-400 border-green-500/20',
  failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  slack: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  datadog: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  cloudwatch: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

interface Props {
  variant: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
