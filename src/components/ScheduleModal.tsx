'use client';
import { useState, useEffect } from 'react';
import { X, Clock, Sun, Moon, Zap, TrendingDown, Calendar } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

interface Preview {
  startTime: string;
  estimatedCost: number;
  estimatedSavings: number;
  breakdown: string[];
}

const MODES = [
  { id: 'off_peak', label: 'Off-Peak', desc: 'Charge during cheapest hours (10 PM–6 AM)', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'solar_priority', label: 'Solar Priority', desc: 'Use rooftop solar first (9 AM–4 PM)', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'cheapest', label: 'Cheapest Window', desc: 'Find the absolute cheapest slot', icon: TrendingDown, color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'immediate', label: 'Charge Now', desc: 'Start charging immediately', icon: Zap, color: 'text-red-400', bg: 'bg-red-500/20' },
];

export default function ScheduleModal({ isOpen, onClose, deviceId }: ScheduleModalProps) {
  const [targetPercent, setTargetPercent] = useState(80);
  const [readyByTime, setReadyByTime] = useState('07:00');
  const [mode, setMode] = useState('off_peak');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch preview whenever settings change
  useEffect(() => {
    if (!isOpen) return;
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/schedule/${deviceId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetChargePercent: targetPercent, readyByTime, mode })
        });
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        }
      } catch (err) {
        console.error('Preview failed', err);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [targetPercent, readyByTime, mode, isOpen, deviceId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/schedule/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetChargePercent: targetPercent, readyByTime, mode })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save schedule', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0A0F1C] border border-white/10 rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0F1C]/95 backdrop-blur-xl p-6 pb-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Smart Schedule</h2>
              <p className="text-xs text-slate-400">Optimize your charging cost</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Target Charge */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Target Charge Level</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={targetPercent}
                onChange={(e) => setTargetPercent(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-green-500"
              />
              <span className="text-2xl font-bold text-white w-16 text-right">{targetPercent}%</span>
            </div>
          </div>

          {/* Ready By Time */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Ready By</label>
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <Clock className="w-5 h-5 text-slate-400" />
              <input
                type="time"
                value={readyByTime}
                onChange={(e) => setReadyByTime(e.target.value)}
                className="bg-transparent text-white text-lg font-semibold flex-1 outline-none"
              />
            </div>
          </div>

          {/* Charging Mode */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Charging Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    mode === m.id
                      ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="text-sm font-semibold text-white">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Preview */}
          {preview && (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl p-5 border border-green-500/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Optimized Start Time</p>
                  <p className="text-2xl font-bold text-white mt-1">{preview.startTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Estimated Cost</p>
                  <p className="text-2xl font-bold text-white mt-1">₹{preview.estimatedCost.toFixed(0)}</p>
                </div>
              </div>
              
              {preview.estimatedSavings > 0 && (
                <div className="flex items-center gap-2 bg-green-500/10 rounded-xl px-3 py-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    Saving ₹{preview.estimatedSavings.toFixed(0)} vs charging now
                  </span>
                </div>
              )}

              <div className="space-y-1 mt-3">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Hourly Breakdown</p>
                {preview.breakdown.slice(0, 6).map((line, i) => (
                  <p key={i} className="text-xs text-slate-300 font-mono">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            } disabled:opacity-50`}
          >
            {saved ? '✓ Schedule Saved!' : loading ? 'Saving...' : 'Set Smart Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
