import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Shield, Zap, Globe, Radio, CheckCircle, ArrowRight, Sparkles, Lock } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-950 text-white selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-navy-900 border border-navy-700/80 text-emerald-400 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Voice Platform for India & Global Users</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
            Dial Any Phone with{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Internet Speed
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            NetCall gives you crystal-clear WebRTC browser calling between devices, paired with an Indian Telecom PSTN bridge architecture designed for cellular termination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-base flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
            >
              <span>Get Free ₹500 Balance</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-base border border-navy-700/80 transition-all"
            >
              Sign In to Dialer
            </Link>
          </div>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-navy-900/60 border border-navy-800/80 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-white">Free WebRTC Calls</div>
              <div className="text-xs text-slate-400">P2P encrypted Opus audio</div>
            </div>

            <div className="bg-navy-900/60 border border-navy-800/80 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-white">Indian Telecom PSTN</div>
              <div className="text-xs text-slate-400">Cellular SIM bridge adapter</div>
            </div>

            <div className="bg-navy-900/60 border border-navy-800/80 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-white">DoT Compliant Design</div>
              <div className="text-xs text-slate-400">Zero CLI spoofing, audited</div>
            </div>

            <div className="bg-navy-900/60 border border-navy-800/80 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-white">Paise Ledger</div>
              <div className="text-xs text-slate-400">Double-entry integer billing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Tier Architecture Explanation */}
      <section className="py-16 bg-navy-900/50 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              How NetCall Bridges the Internet to Indian Telephony
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              WebRTC handles peer-to-peer audio directly between browsers. When calling an ordinary phone without internet, NetCall hands off the session to licensed Indian carrier gateways.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tier 1: Internet-to-Internet Calling</h3>
                  <span className="text-xs text-emerald-400 font-medium">Free & Unlimited</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct browser-to-browser audio streaming using WebRTC RTCPeerConnection.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time Socket.IO signaling with STUN/TURN NAT traversal.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero lag, encrypted Opus codec at 48 kHz high fidelity.</span>
                </li>
              </ul>
            </div>

            <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tier 2: Internet-to-PSTN Telecom Bridge</h3>
                  <span className="text-xs text-amber-400 font-medium">₹1.50 / minute (Audited)</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Caller dials from browser; receiver answers on ordinary SIM card without internet.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Adapter layer integrates with DoT-compliant gateways (Airtel IQ, Exotel, Tata Tele).</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Verified Mock Sandbox mode for testing when live enterprise credentials are not set.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

