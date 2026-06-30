'use client';
import { useState } from 'react';
import { BatteryCharging, Zap, Sun, LineChart, ChevronRight, ShieldCheck, Cpu } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');
    if (email) {
      try {

        const response = await fetch('http://127.0.0.1:5000/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (response.ok) {
          setSubmitted(true);
        } else {
          const data = await response.json();
          setError(data.message || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        setError('Failed to connect to the server. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-brand-primary selection:text-white font-sans overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden -z-10">
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px]" />
          <div className="absolute top-[10%] right-[20%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs font-medium text-slate-300">India's First Affordable Smart Charging Controller</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Charge Smarter. <br />
            <span className="text-gradient">Never Trip a Breaker.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-400 mx-auto mb-10">
            EV Chakra dynamically adjusts your EV's charging speed based on your home's real-time electricity usage. Optimize for solar, save on bills, and charge safely.
          </p>

          <div className="max-w-md mx-auto" id="waitlist">
            {submitted ? (
              <div className="glass-card p-4 rounded-2xl flex items-center justify-center gap-3 text-brand-primary border-brand-primary/30">
                <ShieldCheck className="w-6 h-6" />
                <span className="font-medium">You're on the list! We'll be in touch soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 outline-none transition-all placeholder:text-slate-500 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold hover:shadow-lg hover:shadow-brand-primary/25 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Get Early Access
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
            {error && <p className="mt-4 text-sm text-red-400 font-medium">{error}</p>}
            <p className="mt-4 text-xs text-slate-500">Secure your spot for early bird pricing. No spam, ever.</p>
          </div>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 relative">
          <div className="glass-card rounded-3xl p-2 md:p-4 border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-base/80 z-10 pointer-events-none" />
            <div className="bg-background-surface rounded-2xl overflow-hidden border border-white/5">
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="ml-4 text-xs text-slate-500 font-medium">ev-chakra.local/dashboard</div>
              </div>
              <div className="p-8 grid md:grid-cols-3 gap-6 opacity-80">
                <div className="col-span-2 space-y-6">
                  <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-6 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-brand-primary flex items-center justify-center text-brand-primary">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Current Charging Power</div>
                      <div className="text-3xl font-bold text-white mt-1">4.2 kW <span className="text-sm font-normal text-brand-primary">(Optimized)</span></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="h-24 rounded-xl bg-white/5 border border-white/5 p-4">
                      <div className="text-xs text-slate-400 mb-2">Home Load</div>
                      <div className="text-2xl font-semibold text-white">3.8 kW</div>
                    </div>
                    <div className="h-24 rounded-xl bg-white/5 border border-white/5 p-4">
                      <div className="text-xs text-slate-400 mb-2">Available Capacity</div>
                      <div className="text-2xl font-semibold text-brand-secondary">5.2 kW</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-full rounded-xl bg-gradient-to-br from-brand-primary/10 to-transparent border border-brand-primary/20 p-6 flex flex-col justify-between">
                    <div>
                      <div className="text-sm text-brand-primary/80">Cost Saved Today</div>
                      <div className="text-4xl font-bold text-white mt-2">₹47.20</div>
                    </div>
                    <div className="mt-8">
                      <div className="text-xs text-slate-400">Carbon Offset</div>
                      <div className="text-lg font-medium text-white">2.1 kg CO₂</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background-base relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for the Indian Grid</h2>
            <p className="text-slate-400 text-lg">
              Most Indian homes have a 3-10 kW sanctioned load. Running your AC, geyser, and EV charger at the same time is a recipe for a tripped breaker. Until now.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Cpu className="text-brand-primary w-6 h-6" />}
              title="Dynamic Load Balancing"
              description="Automatically detects when household appliances turn on and instantly throttles down EV charging to prevent trips."
            />
            <FeatureCard
              icon={<Sun className="text-yellow-500 w-6 h-6" />}
              title="Solar Optimizer"
              description="Got rooftop solar? Charge your EV purely on excess solar generation instead of sending it back to the grid for pennies."
            />
            <FeatureCard
              icon={<LineChart className="text-brand-secondary w-6 h-6" />}
              title="Smart Cost Tracking"
              description="Monitor exactly how much your EV costs to run per session, day, or month with time-of-use tariff optimization."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background-surface py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-brand-primary" />
          <span className="font-bold text-xl text-white">EV Chakra</span>
        </div>
        <p className="text-slate-500 text-sm">© 2026 EV Chakra. Built for the future of Indian mobility.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 rounded-3xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
