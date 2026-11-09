import React from 'react';
import { Phone, PhoneOff, Globe, Radio, Shield } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const IncomingCallModal: React.FC = () => {
  const { callState, currentCall, acceptCall, rejectCall } = useCall();

  if (callState !== 'INCOMING_RINGING' || !currentCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden glow-navy">
        {/* Animated Background Ripple Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-48 h-48 rounded-full border-2 border-emerald-400 animate-ping"></div>
          <div className="w-72 h-72 rounded-full border border-emerald-500 animate-pulse"></div>
        </div>

        {/* Call Type Indicator Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          {currentCall.callType === 'INTERNET_WEBRTC' ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Incoming HD Internet Call</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5" />
              <span>Incoming Telecom Call</span>
            </>
          )}
        </div>

        {/* Caller Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 border-4 border-navy-800 flex items-center justify-center text-3xl font-extrabold text-navy-950 shadow-xl">
            {currentCall.peerName?.charAt(0) || 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-navy-900 flex items-center justify-center text-navy-950">
            <Phone className="w-3.5 h-3.5 animate-bounce" />
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-white mb-1 truncate">
          {currentCall.peerName}
        </h3>
        {currentCall.peerUsername && (
          <p className="text-sm text-slate-400 mb-6">
            @{currentCall.peerUsername}
          </p>
        )}

        <p className="text-xs text-emerald-400 font-medium animate-pulse mb-8">
          Incoming voice call...
        </p>

        {/* Action Controls: Decline / Accept */}
        <div className="flex items-center justify-center space-x-6">
          <button
            type="button"
            onClick={rejectCall}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 group-hover:bg-rose-500 group-hover:text-white flex items-center justify-center transition-all shadow-lg shadow-rose-500/20 active:scale-95">
              <PhoneOff className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-rose-400">Decline</span>
          </button>

          <button
            type="button"
            onClick={acceptCall}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-navy-950 group-hover:bg-emerald-400 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 active:scale-95 animate-pulse-fast">
              <Phone className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-emerald-400">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

