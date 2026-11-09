import React, { useState, useEffect } from 'react';
import { DialPad } from '../components/call/DialPad';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { api } from '../services/api';
import { Wallet, History, AlertCircle, PhoneIncoming, PhoneOutgoing, Radio, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CallRecordDTO } from '@netcall/shared';

export const DashboardPage: React.FC = () => {
  const { user, wallet } = useAuth();
  const { error, clearError, startCall } = useCall();
  const [recentCalls, setRecentCalls] = useState<CallRecordDTO[]>([]);

  useEffect(() => {
    api.getCallHistory(1, 5).then((res: any) => {
      setRecentCalls(res.data?.calls || []);
    }).catch((e: any) => console.warn('Could not load recent calls'));
  }, []);

  const formatBalance = (paise?: number) => {
    if (paise === undefined) return '₹0.00';
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const handleRedial = async (call: CallRecordDTO) => {
    if (call.callType === 'INTERNET_WEBRTC') {
      const isCaller = call.callerId === user?.id;
      const targetId = isCaller ? call.receiverId : call.callerId;
      const targetName = isCaller ? call.receiverName : call.callerName;
      const targetUsername = isCaller ? call.receiverUsername : call.callerUsername;

      if (targetId) {
        await startCall({
          callType: 'INTERNET_WEBRTC',
          targetUserId: targetId,
          targetUsername,
          targetFullName: targetName
        });
      }
    } else if (call.destinationNumber) {
      await startCall({
        callType: 'TELECOM_PSTN',
        destinationNumber: call.destinationNumber
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Error Banner */}
      {error && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-800/80 flex items-start justify-between text-xs text-rose-200">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-white font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Welcome & Balance Strip */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
        <div>
          <span className="text-xs text-slate-400">Welcome,</span>
          <h2 className="text-base font-bold text-white leading-tight">
            {user?.fullName || user?.username}
          </h2>
        </div>
        <Link
          to="/wallet"
          className="flex items-center space-x-2 bg-navy-950 hover:bg-navy-800 border border-navy-700/80 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">
            {formatBalance(wallet?.balancePaise)}
          </span>
        </Link>
      </div>

      {/* Central Dial Pad */}
      <div className="mb-10">
        <DialPad />
      </div>

      {/* Recent Calls Quick Snippet */}
      {recentCalls.length > 0 && (
        <div className="max-w-md mx-auto bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Calls</span>
            </div>
            <Link
              to="/history"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-navy-800/80">
            {recentCalls.map((call) => {
              const isCaller = call.callerId === user?.id;
              const displayName = call.callType === 'TELECOM_PSTN'
                ? call.destinationNumber
                : isCaller
                ? call.receiverName || call.receiverUsername || 'User'
                : call.callerName;

              return (
                <div
                  key={call.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300 font-bold">
                      {isCaller ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white truncate max-w-[140px]">
                        {displayName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        {call.callType === 'INTERNET_WEBRTC' ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> WebRTC
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <Radio className="w-2.5 h-2.5" /> PSTN
                          </span>
                        )}
                        <span>•</span>
                        <span>{call.durationSeconds}s</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedial(call)}
                    className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-emerald-500 hover:text-navy-950 text-slate-300 border border-navy-700 font-semibold transition-colors text-[11px]"
                  >
                    Call
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
