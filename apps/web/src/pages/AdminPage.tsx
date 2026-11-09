import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  PhoneCall,
  Clock,
  IndianRupee,
  Server,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, callsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(1),
        api.getAdminCalls(1)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data?.users || []);
      setCalls(callsRes.data?.calls || []);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUserStatus(userId, nextStatus);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 mt-1">
            Administrator privileges are required to view this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>NetCall Administration Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platform metrics, user governance, and Indian telecom gateway status
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Total Users</div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats?.totalCalls || 0}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Calls ({stats?.webrtcCallsCount || 0} WebRTC / {stats?.pstnCallsCount || 0} PSTN)
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {Math.round((stats?.totalDurationSeconds || 0) / 60)}m
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Voice Traffic Duration</div>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{stats?.totalRevenueINR || '0.00'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Telecom Usage Revenue</div>
        </div>
      </div>

      {/* Telephony Gateway Status Card */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Indian Telephony Adapter Status</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Adapter Active</span>
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-navy-950 p-3.5 rounded-2xl border border-navy-800">
            <div className="text-slate-400 mb-1">Provider Engine</div>
            <div className="font-bold text-white text-sm">{stats?.telephonyProvider?.name || 'MOCK'}</div>
          </div>
          <div className="bg-navy-950 p-3.5 rounded-2xl border border-navy-800">
            <div className="text-slate-400 mb-1">Operating Mode</div>
            <div className="font-bold text-amber-400 text-sm">
              {stats?.telephonyProvider?.isSandboxMode ? 'Certified Mock Sandbox' : 'Live Carrier Gateway'}
            </div>
          </div>
          <div className="bg-navy-950 p-3.5 rounded-2xl border border-navy-800">
            <div className="text-slate-400 mb-1">Territory Coverage</div>
            <div className="font-bold text-white text-sm">India (+91) Interconnect</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
          {stats?.telephonyProvider?.complianceNotes}
        </p>
      </div>

      {/* User Management Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-navy-800">
          <h3 className="text-base font-bold text-white">Registered User Directory</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 border-b border-navy-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-navy-850/50 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-semibold text-white">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">@{u.username} • {u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono uppercase text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-navy-800 text-slate-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    ₹{((u.balancePaise || 0) / 100).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      u.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          u.status === 'active'
                            ? 'bg-navy-800 hover:bg-rose-950 text-rose-400 border border-navy-700'
                            : 'bg-emerald-500 text-navy-950 font-bold'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
