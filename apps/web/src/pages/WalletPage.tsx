import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PricingPlan, TransactionLedgerDTO } from '@netcall/shared';
import {
  Wallet,
  Check,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
  Clock,
  CreditCard,
  X
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { wallet, refreshWallet } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [transactions, setTransactions] = useState<TransactionLedgerDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [customAmount, setCustomAmount] = useState('200');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getPricingPlans().then((res: any) => setPlans(res.data || [])).catch(console.warn);
    fetchTransactions(1);
  }, []);

  const fetchTransactions = async (pageNum: number) => {
    try {
      const res = await api.getTransactions(pageNum, 10);
      setTransactions(res.data?.transactions || []);
      setTotalPages(res.data?.pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch transactions error:', err);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTopUpSuccessMsg(null);

    try {
      const amountPaise = selectedPlan
        ? selectedPlan.creditPaise
        : Math.round(parseFloat(customAmount) * 100);

      const res = await api.topUpWallet(amountPaise, selectedPlan?.id);
      await refreshWallet();
      await fetchTransactions(1);
      setTopUpSuccessMsg(res.message || 'Balance successfully credited (Demo Sandbox)');
      setTimeout(() => {
        setIsTopUpModalOpen(false);
        setTopUpSuccessMsg(null);
        setSelectedPlan(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-navy-750 rounded-3xl p-6 sm:p-8 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Calling Balance (INR Integer Paise)</span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              ₹{((wallet?.balancePaise || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-md">
              Internet-to-Internet WebRTC calls are 100% free. Telecom SIM PSTN calls are billed at ₹1.50/min only upon confirmed carrier duration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                setSelectedPlan(null);
                setIsTopUpModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Add Sandbox Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Plans Grid */}
      <div className="mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Available Calling Plans</h2>
          <p className="text-xs text-slate-400">
            Choose a plan to top up your calling credits in sandbox mode.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-7 bg-navy-900 border transition-all relative flex flex-col justify-between ${
                plan.popular
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10'
                  : 'border-navy-800'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-navy-950 font-bold text-[10px] uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{plan.description}</p>

                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-3xl font-extrabold text-white">
                    ₹{(plan.pricePaise / 100).toFixed(0)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">one-time</span>
                </div>

                <div className="bg-navy-950/80 rounded-2xl p-3 border border-navy-800 mb-6 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Wallet Credit Value:</span>
                    <strong className="text-emerald-400">₹{(plan.creditPaise / 100).toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>PSTN Telecom Rate:</span>
                    <strong className="text-white">₹{(plan.pstnRatePerMinutePaise / 100).toFixed(2)}/min</strong>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(plan);
                  setIsTopUpModalOpen(true);
                }}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                  plan.popular
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-md shadow-emerald-500/20'
                    : 'bg-navy-800 hover:bg-navy-700 text-white border border-navy-700'
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auditable Transaction Ledger */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Auditable Transaction Ledger</h3>
            <p className="text-xs text-slate-400">
              Immutable double-entry log of all wallet credits and call debits
            </p>
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-xl">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Transaction ID</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Balance After</th>
                    <th className="py-3.5 px-4 sm:px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-300">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'CREDIT_TOPUP' || tx.type === 'PROMO_GRANT';
                    return (
                      <tr key={tx.id} className="hover:bg-navy-850/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-400 text-[11px]">
                          {tx.transactionId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              isCredit
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium truncate max-w-xs">
                          {tx.description}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₹{(tx.amountPaise / 100).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 hidden sm:table-cell">
                          ₹{(tx.balanceAfterPaise / 100).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Ledger Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
              <button
                disabled={page <= 1}
                onClick={() => fetchTransactions(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchTransactions(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sandbox Top-up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="bg-navy-900 border border-navy-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsTopUpModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {selectedPlan ? `Top-up: ${selectedPlan.name}` : 'Custom Sandbox Top-up'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Safe demonstration environment. No real bank or credit card charge occurs.
            </p>

            {topUpSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs text-center font-semibold mb-4">
                {topUpSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="space-y-4">
                {selectedPlan ? (
                  <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800">
                    <div className="flex justify-between text-sm text-slate-300 mb-1">
                      <span>Plan Credit:</span>
                      <strong className="text-emerald-400 text-base">
                        ₹{(selectedPlan.creditPaise / 100).toFixed(2)}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bonus included in package price of ₹{(selectedPlan.pricePaise / 100).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Top-up Amount (₹ INR)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      step="50"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Min ₹100.00 • Max ₹10,000.00 (Demo credit)
                    </div>
                  </div>
                )}

                <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-[11px] text-amber-300 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    In production, merchant credentials (Razorpay/Stripe) are integrated following Reserve Bank of India (RBI) e-mandate and payment gateway KYC norms.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
                >
                  {isProcessing ? 'Crediting Sandbox Wallet...' : 'Confirm Demo Top-up'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
