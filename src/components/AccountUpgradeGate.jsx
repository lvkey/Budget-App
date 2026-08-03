import { useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

export function AccountUpgradeGate({ onUpgrade }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError('');
    try {
      await onUpgrade(email.trim());
      setStatus('sent');
    } catch (err) {
      setError(err.message || 'Something went wrong sending the link.');
      setStatus('error');
    }
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400">
        <ShieldCheck size={22} />
      </div>
      <div>
        <h2 className="font-semibold text-slate-800 dark:text-white/90">Verify your email to continue</h2>
        <p className="text-sm text-slate-500 dark:text-white/60 mt-1.5 leading-relaxed">
          Statement imports involve real bank data, so this section needs a recoverable login rather than the anonymous
          session the rest of Ledgr uses. Your existing scenarios and expenses aren't affected — they stay exactly as
          they are.
        </p>
      </div>

      {status === 'sent' ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          Check your inbox for a link from Supabase to confirm {email}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-left">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Email address</span>
            <div className="mt-1 relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </label>
          {status === 'error' && <p className="text-xs text-red-500 dark:text-red-400 text-left">{error}</p>}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 transition-colors"
          >
            {status === 'sending' ? 'Sending…' : 'Send verification link'}
          </button>
        </form>
      )}
    </div>
  );
}
