import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, Lock, Mail, Shield, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/agent/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role, demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900 text-white shadow-xl mb-3">
            <Utensils className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary-900">Food Bill Portal</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Internal Food Expense Submission & Management</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200/80">
          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary-900 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-800 focus:ring-2 focus:ring-primary-900/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials selector */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
              Quick Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDemoAccount('ADMIN', 'admin@company.com', 'admin123')}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  email === 'admin@company.com'
                    ? 'border-primary-900 bg-primary-50 text-primary-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary-900" />
                  <span className="text-xs font-bold">Admin Role</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">admin@company.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('AGENT', 'lahari@company.com', 'agent123')}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  email === 'lahari@company.com'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-bold">Agent (Lahari)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">lahari@company.com</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Food Bill Submission & Verification System &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
