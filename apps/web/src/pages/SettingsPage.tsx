import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Settings,
  Mic,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  Lock,
  Smartphone
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Mic test state
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await api.updateProfile({ fullName, phone });
      updateUser(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMic = async () => {
    try {
      setIsMicTesting(true);
      setMicStatus('Requesting microphone permissions...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicStatus('Microphone access granted! Analyzing audio input...');

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let count = 0;

      const checkInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 2)));

        count++;
        if (count > 25) {
          clearInterval(checkInterval);
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
          setIsMicTesting(false);
          setMicStatus('Microphone test completed successfully! Audio input is clear.');
        }
      }, 150);

    } catch (err: any) {
      setIsMicTesting(false);
      setMicStatus(`Microphone access error: ${err.message}. Please verify browser site permissions.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Account & Device Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your caller identity, audio hardware, and regulatory verification status
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Personal Information</span>
        </h2>

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full bg-navy-950/50 border border-navy-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-navy-950/50 border border-navy-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (E.164 +91 Format)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Audio Hardware Checker */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Microphone & Audio Hardware Test</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Check if your browser allows audio input for low-latency WebRTC communications.
        </p>

        <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Input Audio Level:</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{audioLevel}%</span>
          </div>
          <div className="w-full bg-navy-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-100 rounded-full"
              style={{ width: `${audioLevel}%` }}
            ></div>
          </div>
          {micStatus && (
            <div className="text-xs text-slate-400 mt-3 font-medium">
              {micStatus}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isMicTesting}
          onClick={handleTestMic}
          className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-white font-semibold text-xs border border-navy-700 transition-colors disabled:opacity-50"
        >
          {isMicTesting ? 'Testing Audio Input...' : 'Test Microphone'}
        </button>
      </div>

      {/* Indian Telecom Regulatory Notice */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Indian Telecom Regulatory Compliance (DoT / TRAI)</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Under the Department of Telecommunications (DoT) and Telecom Regulatory Authority of India (TRAI) regulations:
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-navy-950 p-3.5 rounded-2xl border border-navy-800/80">
            <strong className="text-white block mb-1">VoIP to Cellular Interconnect</strong>
            Internet telephony to ordinary SIM cards requires an approved carrier trunk (Unified License Access/VNO). Real PSTN bridging is strictly gated.
          </div>
          <div className="bg-navy-950 p-3.5 rounded-2xl border border-navy-800/80">
            <strong className="text-white block mb-1">CLI Spoofing Prohibited</strong>
            Indian regulations mandate that Caller Line Identification (CLI) must accurately represent the verified subscriber origin.
          </div>
        </div>
      </div>
    </div>
  );
};
