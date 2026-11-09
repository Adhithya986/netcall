import React from 'react';
import { PhoneOff, Globe, Radio } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const OutgoingCallModal: React.FC = () => {
  const { callState, currentCall, endCall } = useCall();

  if (callState !== 'OUTGOING_RINGING' || !currentCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden glow-navy">
        {/* Call Type Indicator Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          {currentCall.callType === 'INTERNET_WEBRTC' ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Internet Call (WebRTC)</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5" />
              <span>Telecom Cellular (India PSTN)</span>
            </>
          )}
        </div>

        {/* Pulse Ring Graphic */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping"></div>
          <div className="w-full h-full rounded-full bg-navy-800 border-4 border-navy-700 flex items-center justify-center text-3xl font-extrabold text-slate-100 shadow-xl">
            {currentCall.peerName?.charAt(0) || 'D'}
          </div>
        </div>

        {/* Destination Info */}
        <h3 className="text-xl font-bold text-white mb-1 truncate">
          {currentCall.peerName}
        </h3>
        {currentCall.peerUsername && (
          <p className="text-sm text-slate-400 mb-2">
            @{currentCall.peerUsername}
          </p>
        )}
        {currentCall.destinationNumber && (
          <p className="text-sm font-mono text-emerald-400 mb-2">
            {currentCall.destinationNumber}
          </p>
        )}

        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Ringing destination...</span>
        </div>

        {/* End Call / Cancel Button */}
        <div>
          <button
            type="button"
            onClick={() => endCall('Caller cancelled')}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            title="Cancel Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="block text-xs font-semibold text-slate-400 mt-2">
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
};
