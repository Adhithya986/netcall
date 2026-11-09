import React from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, Radio, ShieldCheck } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const ActiveCallModal: React.FC = () => {
  const {
    callState,
    currentCall,
    isMuted,
    isSpeakerOn,
    peerMuted,
    durationSeconds,
    toggleMute,
    toggleSpeaker,
    endCall
  } = useCall();

  if (callState !== 'CONNECTED' || !currentCall) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-lg animate-fade-in">
      <div className="bg-navy-900 border border-navy-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden glow-emerald">
        {/* Call Type Indicator */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          {currentCall.callType === 'INTERNET_WEBRTC' ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Connected (HD Internet Audio)</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5" />
              <span>Telecom Cellular (Mock PSTN)</span>
            </>
          )}
        </div>

        {/* Peer Avatar & Status */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-navy-800 flex items-center justify-center text-3xl font-extrabold text-navy-950 shadow-xl">
            {currentCall.peerName?.charAt(0) || 'P'}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-navy-900 flex items-center justify-center text-navy-950">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Peer Info */}
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

        {/* Live Call Timer */}
        <div className="text-2xl font-mono font-bold text-emerald-400 tracking-wider mb-2">
          {formatTime(durationSeconds)}
        </div>

        {/* Dynamic Audio Visualizer Bars */}
        <div className="flex items-center justify-center space-x-1.5 h-8 mb-6">
          {[40, 70, 95, 60, 80, 50, 90, 65, 45].map((heightPercent, idx) => (
            <div
              key={idx}
              className="w-1 bg-emerald-400 rounded-full transition-all duration-300 animate-pulse"
              style={{
                height: isMuted ? '4px' : `${heightPercent}%`,
                animationDelay: `${idx * 120}ms`
              }}
            ></div>
          ))}
        </div>

        {/* Peer Mute Warning */}
        {peerMuted && (
          <div className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/40 rounded-xl py-1.5 px-3 mb-6 inline-block font-medium">
            Peer has muted their microphone
          </div>
        )}

        {/* Call Controls */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-navy-800/80">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex flex-col items-center space-y-2 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                  : 'bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700/80'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => endCall('User hung up')}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
              <PhoneOff className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-semibold text-rose-400">
              End Call
            </span>
          </button>

          {/* Speaker / Volume Button */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className="flex flex-col items-center space-y-2 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isSpeakerOn
                  ? 'bg-navy-800 hover:bg-navy-700 text-emerald-400 border border-navy-700/80'
                  : 'bg-navy-800/50 text-slate-500 border border-navy-800'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {isSpeakerOn ? 'Speaker' : 'Earpiece'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

