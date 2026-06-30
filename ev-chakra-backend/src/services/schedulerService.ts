import Schedule, { ISchedule } from '../models/Schedule';
import { publishCommand } from './mqttService';

/**
 * Indian Time-of-Use electricity rate tiers (₹ per kWh)
 * These are approximate rates for a residential connection in most Indian states.
 */
const RATE_TIERS = [
  // Off-peak: 10 PM - 6 AM
  { start: 22, end: 6, rate: 3.5, label: 'Off-Peak' },
  // Mid-peak: 6 AM - 10 AM, 2 PM - 6 PM
  { start: 6, end: 10, rate: 5.5, label: 'Mid-Peak' },
  { start: 14, end: 18, rate: 5.5, label: 'Mid-Peak' },
  // Peak: 10 AM - 2 PM, 6 PM - 10 PM
  { start: 10, end: 14, rate: 8.0, label: 'Peak' },
  { start: 18, end: 22, rate: 8.0, label: 'Peak' },
];

// Solar generation window (approximate for India)
const SOLAR_WINDOW = { start: 9, end: 16, rate: 0.5 }; // Almost free if you have panels

// Charger specs
const CHARGER_POWER_KW = 3.3; // ~16A at 230V
const BATTERY_CAPACITY_KWH = 40; // Typical Indian EV (Nexon EV, etc.)

/**
 * Get the electricity rate (₹/kWh) for a given hour of the day.
 */
function getRateForHour(hour: number, useSolar: boolean = false): number {
  if (useSolar && hour >= SOLAR_WINDOW.start && hour < SOLAR_WINDOW.end) {
    return SOLAR_WINDOW.rate;
  }
  
  for (const tier of RATE_TIERS) {
    if (tier.start < tier.end) {
      // Normal range (e.g. 6-10)
      if (hour >= tier.start && hour < tier.end) return tier.rate;
    } else {
      // Wrapping range (e.g. 22-6 means 22-24 and 0-6)
      if (hour >= tier.start || hour < tier.end) return tier.rate;
    }
  }
  return 5.5; // Default mid-peak
}

/**
 * Calculate the optimal start time for a charging schedule.
 * Returns the start time (HH:MM), estimated cost, and savings.
 */
export function calculateOptimalSchedule(schedule: {
  targetChargePercent: number;
  readyByTime: string;
  mode: string;
}): { startTime: string; estimatedCost: number; estimatedSavings: number; breakdown: string[] } {
  
  const energyNeeded = (schedule.targetChargePercent / 100) * BATTERY_CAPACITY_KWH; // kWh
  const hoursNeeded = Math.ceil(energyNeeded / CHARGER_POWER_KW); // Hours to charge
  
  const [readyHour, readyMin] = schedule.readyByTime.split(':').map(Number);
  const readyAt = readyHour + readyMin / 60;
  
  const useSolar = schedule.mode === 'solar_priority';
  const breakdown: string[] = [];

  if (schedule.mode === 'immediate') {
    // Just start now
    const now = new Date();
    const currentHour = now.getHours();
    let cost = 0;
    for (let i = 0; i < hoursNeeded; i++) {
      const hour = (currentHour + i) % 24;
      cost += getRateForHour(hour) * CHARGER_POWER_KW;
    }
    
    const startTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { startTime, estimatedCost: Math.round(cost * 100) / 100, estimatedSavings: 0, breakdown: ['Charging immediately at current rates'] };
  }
  
  // Try every possible start hour and find the cheapest window
  let bestCost = Infinity;
  let bestStart = 0;
  let immediateCost = 0;
  
  // Calculate immediate cost for comparison
  const currentHour = new Date().getHours();
  for (let i = 0; i < hoursNeeded; i++) {
    const hour = (currentHour + i) % 24;
    immediateCost += getRateForHour(hour) * CHARGER_POWER_KW;
  }
  
  // Search all possible start windows
  for (let startHour = 0; startHour < 24; startHour++) {
    const endHour = startHour + hoursNeeded;
    
    // Check if charging finishes before readyBy time
    // We need to handle wrapping around midnight
    let finishesInTime = false;
    if (startHour < readyAt) {
      finishesInTime = endHour <= readyAt;
    } else {
      // Start after readyBy, wrap around midnight
      finishesInTime = (endHour % 24) <= readyAt;
    }
    
    if (!finishesInTime && schedule.mode !== 'cheapest') continue;
    
    // Calculate cost for this window
    let cost = 0;
    for (let i = 0; i < hoursNeeded; i++) {
      const hour = (startHour + i) % 24;
      cost += getRateForHour(hour, useSolar) * CHARGER_POWER_KW;
    }
    
    if (cost < bestCost) {
      bestCost = cost;
      bestStart = startHour;
    }
  }
  
  const startTime = `${String(bestStart).padStart(2, '0')}:00`;
  const savings = Math.max(0, immediateCost - bestCost);
  
  // Build breakdown
  for (let i = 0; i < hoursNeeded; i++) {
    const hour = (bestStart + i) % 24;
    const rate = getRateForHour(hour, useSolar);
    breakdown.push(`${String(hour).padStart(2, '0')}:00 — ₹${rate}/kWh × ${CHARGER_POWER_KW}kW = ₹${(rate * CHARGER_POWER_KW).toFixed(1)}`);
  }
  
  return {
    startTime,
    estimatedCost: Math.round(bestCost * 100) / 100,
    estimatedSavings: Math.round(savings * 100) / 100,
    breakdown,
  };
}

/**
 * Check all active schedules and trigger charging when it's time.
 * Called periodically from the main server loop.
 */
export async function checkSchedules(): Promise<void> {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0=Sun ... 6=Sat
    
    const activeSchedules = await Schedule.find({ isActive: true });
    
    for (const schedule of activeSchedules) {
      // Check if today is a scheduled day
      if (schedule.daysOfWeek.length > 0 && !schedule.daysOfWeek.includes(currentDay)) {
        continue;
      }
      
      // Check if it's time to start
      if (schedule.calculatedStartTime === currentTime) {
        console.log(`[Scheduler] ⏰ Triggering charge for device ${schedule.deviceId}`);
        publishCommand(schedule.deviceId, {
          command: 'SET_CHARGE',
          isCharging: true,
          maxAmps: 16,
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking schedules:', err);
  }
}

/**
 * Initialize the scheduler to check every minute.
 */
export function initScheduler(): void {
  console.log('[Scheduler] ⏰ Smart scheduler started (checking every 60s)');
  setInterval(checkSchedules, 60000); // Check every minute
}
