import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Globe, Radio, Delete, Search, UserCheck, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { soundFX } from '../../hooks/useSound';
import { api } from '../../services/api';
import { CallType } from '@netcall/shared';

const DIAL_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const DialPad: React.FC = () => {
  const { startCall, callState } = useCall();
  const { user, wallet } = useAuth();

  const [callType, setCallType] = useState<CallType>('INTERNET_WEBRTC');
  
  // Internet Call state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // PSTN Call state
  const [phoneNumber, setPhoneNumber] = useState('+91');

  // Search users for Internet calling
  useEffect(() => {
    if (callType !== 'INTERNET_WEBRTC') return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchUsers(searchQuery.trim());
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, callType]);

  const handleKeyPress = (digit: string) => {
    soundFX.playDTMF(digit);
    if (callType === 'TELECOM_PSTN') {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (callType === 'TELECOM_PSTN') {
      setPhoneNumber(prev => (prev.length > 3 ? prev.slice(0, -1) : '+91'));
    }
  };

  const handleStartCall = async () => {
    if (callState !== 'IDLE') return;

    if (callType === 'INTERNET_WEBRTC') {
      if (!selectedUser) return;
      await startCall({
        callType: 'INTERNET_WEBRTC',
        targetUserId: selectedUser.id,
        targetUsername: selectedUser.username,
        targetFullName: selectedUser.fullName
      });
    } else {
      const cleaned = phoneNumber.trim();
      if (cleaned.length < 10) return;
      await startCall({
        callType: 'TELECOM_PSTN',
        destinationNumber: cleaned
      });
    }
  };

  const isPstnValid = phoneNumber.replace(/[\s-+]/g, '').length >= 10;
  const canCall = callType === 'INTERNET_WEBRTC' ? Boolean(selectedUser) : isPstnValid;

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-md mx-auto w-full">
      {/* Mode Switcher */}
      <div className="bg-navy-950 p-1.5 rounded-2xl flex items-center mb-6 border border-navy-800/80">
        <button
          type="button"
          onClick={() => {
            setCallType('INTERNET_WEBRTC');
            setSelectedUser(null);
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            callType === 'INTERNET_WEBRTC'
              ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Internet Voice (Free)</span>
        </button>

        <button
          type="button"
          onClick={() => setCallType('TELECOM_PSTN')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            callType === 'TELECOM_PSTN'
              ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Telecom SIM (India)</span>
        </button>
      </div>

      {/* Mode A: Internet WebRTC Calling */}
      {callType === 'INTERNET_WEBRTC' ? (
        <div className="space-y-4">
          <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WebRTC Direct HD Voice</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Call any registered NetCall user for free over Wi-Fi or mobile data. End-to-end encrypted audio via Opus codec.
            </p>
          </div>

          {/* Search or Selected Contact */}
          {selectedUser ? (
            <div className="bg-navy-950 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-base">
                  {selectedUser.fullName?.charAt(0) || selectedUser.username?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{selectedUser.fullName}</div>
                  <div className="text-xs text-slate-400">@{selectedUser.username}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-xs text-slate-400 hover:text-rose-400 font-medium px-2 py-1"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search user by username, email, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="bg-navy-950 border border-navy-700/80 rounded-2xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-navy-800/80">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-navy-800/60 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-navy-800 text-slate-200 flex items-center justify-center text-xs font-bold">
                          {u.fullName?.charAt(0) || u.username?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{u.fullName}</div>
                          <div className="text-xs text-slate-400">@{u.username}</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Select
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-6 text-xs text-slate-500">
                  No registered users found matching "{searchQuery}"
                </div>
              )}

              {/* Instructions when search empty */}
              {!searchQuery && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Type a username to start a peer-to-peer WebRTC voice call.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode B: Indian Telecom PSTN Dial Pad */
        <div className="space-y-4">
          {/* Regulatory Disclaimer Banner */}
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="font-semibold text-amber-300">Indian Telecom Sandbox:</strong> Calls terminate through the mock carrier adapter at ₹1.50/min. In accordance with DoT & TRAI, production PSTN bridging requires carrier interconnect credentials.
            </div>
          </div>

          {/* Number Display */}
          <div className="bg-navy-950 border border-navy-700/80 rounded-2xl px-4 py-3 flex items-center justify-between">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="bg-transparent text-xl sm:text-2xl font-bold tracking-wider text-white focus:outline-none w-full"
            />
            {phoneNumber.length > 3 && (
              <button
                type="button"
                onClick={handleBackspace}
                className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-xl transition-colors"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Demo Preset Numbers */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() => setPhoneNumber('+919876543210')}
              className="px-2 py-0.5 rounded-lg bg-navy-800 text-slate-300 hover:text-emerald-400 border border-navy-700 text-[11px]"
            >
              +91 98765 43210
            </button>
            <button
              type="button"
              onClick={() => setPhoneNumber('+919123456789')}
              className="px-2 py-0.5 rounded-lg bg-navy-800 text-slate-300 hover:text-emerald-400 border border-navy-700 text-[11px]"
            >
              +91 91234 56789
            </button>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {DIAL_KEYS.map((k) => (
              <button
                key={k.digit}
                type="button"
                onClick={() => handleKeyPress(k.digit)}
                className="h-14 sm:h-16 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 active:scale-95 border border-navy-700/50 flex flex-col items-center justify-center transition-all shadow-sm"
              >
                <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                  {k.digit}
                </span>
                {k.letters && (
                  <span className="text-[10px] text-slate-400 tracking-widest font-semibold mt-1">
                    {k.letters}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Call Action Button */}
      <div className="pt-6">
        <button
          type="button"
          disabled={!canCall}
          onClick={handleStartCall}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
            canCall
              ? 'bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-emerald-500/25 active:scale-[0.98]'
              : 'bg-navy-800 text-slate-500 border border-navy-700 cursor-not-allowed opacity-60'
          }`}
        >
          <PhoneCall className="w-5 h-5" />
          <span>
            {callType === 'INTERNET_WEBRTC'
              ? selectedUser
                ? `Call @${selectedUser.username}`
                : 'Select a User to Call'
              : 'Dial Telecom Cellular'}
          </span>
        </button>
      </div>
    </div>
  );
};
