import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { CallRecordDTO, CallType } from '@netcall/shared';
import {
  History,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Globe,
  Radio,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState<CallRecordDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | CallType>('ALL');

  const fetchCalls = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await api.getCallHistory(pageNum, 15);
      setCalls(res.data?.calls || []);
      setTotalPages(res.data?.pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch calls error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(1);
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (filterType === 'ALL') return true;
    return c.callType === filterType;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Call History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete auditable record of your internet and telecom voice calls
          </p>
        </div>

        {/* Filter buttons */}
        <div className="bg-navy-900 border border-navy-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-emerald-500 text-navy-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Calls
          </button>
          <button
            onClick={() => setFilterType('INTERNET_WEBRTC')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'INTERNET_WEBRTC'
                ? 'bg-emerald-500 text-navy-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Internet
          </button>
          <button
            onClick={() => setFilterType('TELECOM_PSTN')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'TELECOM_PSTN'
                ? 'bg-emerald-500 text-navy-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PSTN Telecom
          </button>
        </div>
      </div>

      {/* Call List Card */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading call logs...
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No call records found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Place your first call via the WebRTC dialer or Indian Telecom bridge.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-800">
            {filteredCalls.map((call) => {
              const isCaller = call.callerId === user?.id;
              const isPstn = call.callType === 'TELECOM_PSTN';
              const displayName = isPstn
                ? call.destinationNumber
                : isCaller
                ? call.receiverName || call.receiverUsername || 'User'
                : call.callerName;

              const isMissed = call.status === 'MISSED' || call.status === 'FAILED';

              return (
                <div
                  key={call.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-navy-850/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isMissed
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isCaller
                          ? 'bg-navy-800 text-slate-300 border border-navy-700'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isMissed ? (
                        <PhoneMissed className="w-5 h-5" />
                      ) : isCaller ? (
                        <PhoneOutgoing className="w-5 h-5" />
                      ) : (
                        <PhoneIncoming className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">
                          {displayName}
                        </span>
                        {isPstn ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5" /> PSTN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" /> WebRTC
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(call.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span>Duration: {formatDuration(call.durationSeconds)}</span>
                        {call.costPaise > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">₹{(call.costPaise / 100).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl hidden sm:inline-block ${
                        call.status === 'COMPLETED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : call.status === 'REJECTED'
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : 'bg-navy-800 text-slate-400 border border-navy-700'
                      }`}
                    >
                      {call.status}
                    </span>

                    <button
                      onClick={() => handleRedial(call)}
                      className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-emerald-500 hover:text-navy-950 text-slate-200 border border-navy-700 font-bold transition-all text-xs"
                    >
                      Redial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
            <button
              disabled={page <= 1}
              onClick={() => fetchCalls(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchCalls(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
