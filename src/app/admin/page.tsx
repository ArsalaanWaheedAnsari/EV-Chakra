'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, BatteryCharging, List } from 'lucide-react';

interface Stats {
  userCount: number;
  waitlistCount: number;
  deviceCount: number;
}

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        alert('You must be logged in with Admin privileges to view this page.');
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        alert('Access Denied. You do not have Admin privileges.');
        router.push('/dashboard');
      } else {
        // Fetch Admin Stats
        fetch('http://127.0.0.1:5000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(console.error);
      }
    }
  }, [user, loading, router, token]);

  if (loading || !stats) {
    return <div className="min-h-screen bg-[#030712] flex items-center justify-center text-brand-primary">Loading Admin Panel...</div>;
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
            <ShieldAlert className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-slate-400">Welcome, {user?.name} ({user?.role})</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <Users className="w-10 h-10 text-brand-primary" />
            <div>
              <div className="text-3xl font-bold text-white">{stats.userCount}</div>
              <div className="text-sm text-slate-400">Registered Users</div>
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <List className="w-10 h-10 text-yellow-500" />
            <div>
              <div className="text-3xl font-bold text-white">{stats.waitlistCount}</div>
              <div className="text-sm text-slate-400">Waitlist Signups</div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <BatteryCharging className="w-10 h-10 text-brand-secondary" />
            <div>
              <div className="text-3xl font-bold text-white">{stats.deviceCount}</div>
              <div className="text-sm text-slate-400">Active Devices</div>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
           <h2 className="text-xl font-bold text-white mb-4">System Settings</h2>
           <p className="text-slate-400">User management UI and hardware provisioning tools will be available here in the full version.</p>
        </div>
      </div>
    </div>
  );
}
