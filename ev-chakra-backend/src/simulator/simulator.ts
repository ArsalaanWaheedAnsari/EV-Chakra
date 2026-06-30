/**
 * ESP32 Simulator — Mimics an EV Chakra IoT device
 * 
 * This script connects to the local MQTT broker and:
 *   1. Publishes realistic telemetry every 2 seconds
 *   2. Listens for control commands from the backend
 * 
 * Usage:  npx ts-node src/simulator/simulator.ts
 */

import mqtt from 'mqtt';

const DEVICE_ID = process.argv[2] || 'DEMO_DEVICE_123';
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';

const TELEMETRY_TOPIC = `evchakra/${DEVICE_ID}/telemetry`;
const CONTROL_TOPIC = `evchakra/${DEVICE_ID}/control`;

// Simulated device state
let isCharging = true;
let maxAmps = 16;

// Simulation parameters
let time = 0;
const BASE_VOLTAGE = 230;      // Indian grid voltage
const BASE_CURRENT = 14;       // ~3.2 kW charging
const BASE_TEMPERATURE = 35;   // Ambient temp in India

console.log('═══════════════════════════════════════════');
console.log('  🔌 EV Chakra — ESP32 Simulator');
console.log(`  Device ID : ${DEVICE_ID}`);
console.log(`  Broker    : ${BROKER_URL}`);
console.log('═══════════════════════════════════════════');
console.log();

const client = mqtt.connect(BROKER_URL, {
  clientId: `simulator-${DEVICE_ID}-${Date.now()}`,
  clean: true,
});

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  console.log(`📡 Publishing telemetry to: ${TELEMETRY_TOPIC}`);
  console.log(`📥 Listening for commands on: ${CONTROL_TOPIC}`);
  console.log();

  // Subscribe to control commands
  client.subscribe(CONTROL_TOPIC, { qos: 1 }, (err) => {
    if (err) {
      console.error('Failed to subscribe to control topic:', err);
    }
  });

  // Start publishing telemetry every 2 seconds
  setInterval(() => {
    time += 2;

    // Realistic voltage fluctuation (228V - 232V sine wave)
    const voltage = BASE_VOLTAGE + Math.sin(time * 0.05) * 2 + (Math.random() - 0.5) * 0.5;

    // Current depends on charging state
    let current = 0;
    if (isCharging) {
      // Fluctuating charge current (soft ramp + noise)
      const rampFactor = Math.min(1, time / 30); // Ramp up over 30s
      current = BASE_CURRENT * rampFactor + Math.sin(time * 0.1) * 0.5 + (Math.random() - 0.5) * 0.3;
      current = Math.min(current, maxAmps); // Respect max amps limit
    }

    // Power in kW
    const power = (voltage * current) / 1000;

    // Temperature rises slowly while charging, cools when idle
    const tempDelta = isCharging ? 0.02 : -0.05;
    const temperature = BASE_TEMPERATURE + Math.sin(time * 0.01) * 3 + time * tempDelta * 0.01;

    const payload = {
      voltage: Math.round(voltage * 10) / 10,
      current: Math.round(current * 100) / 100,
      power: Math.round(power * 1000) / 1000,
      temperature: Math.round(temperature * 10) / 10,
      timestamp: Math.floor(Date.now() / 1000),
    };

    client.publish(TELEMETRY_TOPIC, JSON.stringify(payload), { qos: 1 });

    // Print a nice dashboard-style log
    const chargingIcon = isCharging ? '⚡' : '💤';
    process.stdout.write(
      `\r${chargingIcon} V: ${payload.voltage.toFixed(1)}V | ` +
      `I: ${payload.current.toFixed(2)}A | ` +
      `P: ${payload.power.toFixed(3)}kW | ` +
      `T: ${payload.temperature.toFixed(1)}°C | ` +
      `t+${time}s   `
    );

  }, 2000);
});

// Handle control commands from the backend
client.on('message', (topic: string, message: Buffer) => {
  if (topic === CONTROL_TOPIC) {
    try {
      const cmd = JSON.parse(message.toString());
      console.log(); // New line after the live telemetry
      console.log(`📨 COMMAND RECEIVED: ${JSON.stringify(cmd)}`);

      if (cmd.command === 'SET_CHARGE') {
        isCharging = cmd.isCharging ?? isCharging;
        maxAmps = cmd.maxAmps ?? maxAmps;
        console.log(`   → Charging: ${isCharging ? 'ON' : 'OFF'}, Max Amps: ${maxAmps}A`);
      }
    } catch (err) {
      console.error('Failed to parse control command:', err);
    }
  }
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
  console.log('   Make sure Mosquitto is running: mosquitto -v');
});

client.on('offline', () => {
  console.log('⚠️  Broker connection lost. Reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Simulator stopped.');
  client.end();
  process.exit(0);
});
