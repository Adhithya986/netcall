import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, Mail, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(identifier, password);
      } else {
        await register({
          email,
          username,
          fullName,
          password,
          phone: phone.trim() ? phone.trim() : undefined
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'user1' | 'user2' | 'admin') => {
    if (isLogin) {
      if (role === 'user1') {
        setIdentifier('rohit_sharma');
        setPassword('NetCall2026!');
      } else if (role === 'user2') {
        setIdentifier('priya_verma');
        setPassword('NetCall2026!');
      } else {
        setIdentifier('admin');
        setPassword('NetCall2026!');
      }
    } else {
      const rand = Math.floor(Math.random() * 900) + 100;
      setEmail(`user${rand}@netcall.in`);
      setUsername(`caller_${rand}`);
      setFullName(`Rohan Patel ${rand}`);
      setPassword('NetCall2026!');
      setPhone('+919876543210');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-navy-950">
      <div className="max-w-md w-full bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Phone className="w-6 h-6 text-navy-950 font-bold" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isLogin ? 'Welcome Back to NetCall' : 'Create Your NetCall Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin
              ? 'Access your dialer, call history, and wallet'
              : 'Sign up and get ₹500 instant calling balance'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-navy-950 p-1.5 rounded-2xl flex items-center mb-6 border border-navy-800">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isLogin
                ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              !isLogin
                ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-950/50 border border-rose-800/60 flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. rohit or rohit@netcall.in"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rohit_sharma"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="rohit@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="At least 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-6 disabled:opacity-50"
          >
            <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Free Account'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Demo Autofill Helper */}
        <div className="mt-6 pt-6 border-t border-navy-800 text-center">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Testing Presets
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fillDemo('user1')}
              className="text-xs bg-navy-800 hover:bg-navy-700 text-slate-300 px-2.5 py-1 rounded-lg border border-navy-700"
            >
              Preset User A
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user2')}
              className="text-xs bg-navy-800 hover:bg-navy-700 text-slate-300 px-2.5 py-1 rounded-lg border border-navy-700"
            >
              Preset User B
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
