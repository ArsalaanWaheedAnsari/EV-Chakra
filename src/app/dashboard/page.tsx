'use client';
import { useState, useEffect, useRef } from 'react';
import { Zap, Activity, BatteryCharging, History, Settings, Play, Square, ChevronLeft, Thermometer, Gauge, Wifi, WifiOff, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ScheduleModal from '@/components/ScheduleModal';

interface TelemetryPoint {
  power: number;
  voltage: number;
  current: number;
  temperature: number;
  timestamp: string;
}

export default function Dashboard() {
  const [isCharging, setIsCharging] = useState(true);
  const [chargePower, setChargePower] = useState(0);
  const [homeLoad, setHomeLoad] = useState(0);
  const [todayCost, setTodayCost] = useState(0);
  const [carbonOffset, setCarbonOffset] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const maxCapacity = 9.0;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const deviceId = 'DEMO_DEVICE_123';

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      alert('You must be logged in to access the Dashboard.');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch telemetry from backend
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/dashboard/${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setIsCharging(data.isCharging);
          setChargePower(data.chargePower);
          setHomeLoad(data.homeLoad);
          setTodayCost(data.todayCost);
          setCarbonOffset(data.carbonOffset);
          setVoltage(data.voltage);
          setCurrent(data.current);
          setTemperature(data.temperature);
          setIsOnline(data.isOnline);
        }
      } catch (err) {
        console.error('Failed to fetch telemetry', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history for chart
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/dashboard/${deviceId}/history?minutes=5`);
        if (res.ok) {
          const json = await res.json();
          setHistory(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/schedule/${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveSchedule(data.hasSchedule ? data.schedule : null);
        }
      } catch (err) {
        console.error('Failed to fetch schedule', err);
      }
    };

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 3000);
    return () => clearInterval(interval);
  }, []);

  // Draw real-time chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (H / 5) * i + 20;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
    }

    // Y-axis labels
    const maxPower = Math.max(...history.map(p => p.power), 1);
    const yScale = maxPower * 1.2;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px system-ui';
    for (let i = 0; i <= 4; i++) {
      const val = (yScale * (4 - i) / 4).toFixed(1);
      const y = 20 + (H - 40) * i / 4;
      ctx.fillText(`${val}`, 2, y + 3);
    }

    // Power line
    const drawLine = (data: number[], color: string, alpha: number = 1) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;

      for (let i = 0; i < data.length; i++) {
        const x = 40 + ((W - 50) / (data.length - 1)) * i;
        const y = 20 + (H - 40) * (1 - data[i] / yScale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Gradient fill
      const lastX = 40 + ((W - 50) / (data.length - 1)) * (data.length - 1);
      ctx.lineTo(lastX, H - 20);
      ctx.lineTo(40, H - 20);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 20, 0, H);
      gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'));
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    drawLine(history.map(p => p.power), 'rgb(16, 185, 129)');

    // Time labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '9px system-ui';
    const step = Math.max(1, Math.floor(history.length / 5));
    for (let i = 0; i < history.length; i += step) {
      const x = 40 + ((W - 50) / (history.length - 1)) * i;
      const time = new Date(history[i].timestamp);
      ctx.fillText(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), x - 20, H - 4);
    }
  }, [history]);

  const toggleCharging = async () => {
    const newState = !isCharging;
    setIsCharging(newState);
    if (!newState) setChargePower(0);

    try {
      await fetch(`http://127.0.0.1:5000/api/dashboard/${deviceId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCharging: newState })
      });
    } catch (err) {
      console.error('Failed to toggle charging', err);
      setIsCharging(!newState);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#030712] flex items-center justify-center text-brand-primary">Loading Dashboard...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-background-base text-foreground pb-24 md:pb-0">

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-background-surface/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="p-2 -ml-2 rounded-xl bg-white/5 text-slate-300">
                <ChevronLeft className="w-5 h-5" />
              </div>
            </Link>
            <div>
              <h1 className="font-bold text-lg leading-none">EV Chakra</h1>
              <p className={`text-xs mt-1 flex items-center gap-1 ${isOnline ? 'text-brand-primary' : 'text-red-400'}`}>
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                    <Wifi className="w-3 h-3" /> Device Online
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <WifiOff className="w-3 h-3" /> Device Offline
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center">
            <span className="text-sm font-medium">{user.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4 space-y-6">

          {/* Main Status Card */}
          <section className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-brand-primary/10 rounded-full blur-[80px] -z-10" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-400 font-medium text-sm">Status</p>
                <h2 className="text-2xl font-bold mt-1">
                  {isCharging ? 'Charging Optimized' : 'Standby'}
                </h2>
              </div>
              <div className={`p-3 rounded-2xl ${isCharging ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-slate-500'}`}>
                <BatteryCharging className={`w-6 h-6 ${isCharging ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                {chargePower.toFixed(1)}
              </span>
              <span className="text-xl text-slate-400 font-medium pb-2">kW</span>
            </div>

            {/* Progress Bar (Visualizing load) */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Home Load ({homeLoad.toFixed(1)} kW)</span>
                <span>Total Capacity ({maxCapacity.toFixed(1)} kW)</span>
              </div>
              <div className="h-4 rounded-full bg-background-surface overflow-hidden flex border border-white/5">
                <div
                  className="h-full bg-slate-500 transition-all duration-1000 ease-in-out"
                  style={{ width: `${(homeLoad / maxCapacity) * 100}%` }}
                />
                <div
                  className="h-full bg-brand-primary transition-all duration-1000 ease-in-out relative"
                  style={{ width: `${(chargePower / maxCapacity) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          </section>

          {/* Live Sensor Readings */}
          <section className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold">{voltage.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Volts</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold">{current.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Amps</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold">{temperature.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 font-medium">°C</div>
            </div>
          </section>

          {/* Real-Time Power Chart */}
          <section className="glass-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm">Live Power Chart</h3>
                <p className="text-[11px] text-slate-400">Last 5 minutes</p>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-primary" /> Power (kW)
                </span>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: '180px' }}
            />
            {history.length < 2 && (
              <p className="text-center text-slate-500 text-xs mt-2">
                Waiting for telemetry data... Make sure the MQTT simulator is running.
              </p>
            )}
          </section>

          {/* Active Schedule Banner */}
          {activeSchedule && (
            <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-500">Smart Schedule Active</h3>
                  <p className="text-sm text-slate-300 mt-0.5">
                    Charging {activeSchedule.targetChargePercent}% by {activeSchedule.readyByTime}
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Starting at {activeSchedule.calculatedStartTime}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch(`http://127.0.0.1:5000/api/schedule/${deviceId}`, { method: 'DELETE' });
                  setActiveSchedule(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </section>
          )}

          {/* Controls */}
          <section className="grid grid-cols-2 gap-4">
            <button
              onClick={toggleCharging}
              className={`glass-card p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all ${isCharging ? 'border-brand-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'hover:bg-white/5'
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCharging ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/10 text-slate-400'}`}>
                {isCharging ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </div>
              <span className="font-semibold">{isCharging ? 'Stop Charging' : 'Start Charging'}</span>
            </button>

            <button onClick={() => setShowSchedule(true)} className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all">
              <div className="w-12 h-12 rounded-full bg-brand-secondary/20 text-brand-secondary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-semibold text-center">
                {activeSchedule ? 'Edit Schedule' : 'Smart Schedule'}
              </span>
            </button>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-background-surface rounded-3xl p-5 border border-white/5">
              <div className="text-slate-400 text-xs font-medium mb-1">Today&apos;s Cost</div>
              <div className="text-2xl font-bold">₹ {todayCost.toFixed(2)}</div>
              <div className="text-brand-primary text-xs mt-2 font-medium flex items-center gap-1">
                ↓ ₹12 saved via Solar
              </div>
            </div>
            <div className="bg-background-surface rounded-3xl p-5 border border-white/5">
              <div className="text-slate-400 text-xs font-medium mb-1">Carbon Offset</div>
              <div className="text-2xl font-bold">{carbonOffset.toFixed(1)} kg</div>
              <div className="text-brand-secondary text-xs mt-2 font-medium flex items-center gap-1">
                equiv. to {Math.floor(carbonOffset / 2)} tree{carbonOffset >= 4 ? 's' : ''}
              </div>
            </div>
          </section>

        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 w-full glass-card border-t border-white/10 flex justify-around p-4 z-40 pb-6 rounded-t-3xl">
          <NavItem icon={<Zap />} label="Charge" active />
          <NavItem icon={<History />} label="History" />
          <NavItem icon={<Settings />} label="Settings" />
        </nav>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal isOpen={showSchedule} onClose={() => setShowSchedule(false)} deviceId={deviceId} />
    </>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? 'text-brand-primary' : 'text-slate-500'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-brand-primary/20' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
