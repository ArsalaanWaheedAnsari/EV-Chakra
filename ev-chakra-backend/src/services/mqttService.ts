import mqtt, { MqttClient } from 'mqtt';
import Device from '../models/Device';
import Telemetry from '../models/Telemetry';

let client: MqttClient | null = null;

// Topic patterns
const TELEMETRY_TOPIC = 'evchakra/+/telemetry';  // + is a single-level wildcard
const CONTROL_TOPIC_PREFIX = 'evchakra';

interface TelemetryPayload {
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  timestamp?: number;
}

interface ControlPayload {
  command: string;
  isCharging?: boolean;
  maxAmps?: number;
}

/**
 * Initialize the MQTT client and subscribe to telemetry topics.
 * Call this once after the Express server starts.
 */
export function initMqttService(): void {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
  
  console.log(`[MQTT] Connecting to broker at ${brokerUrl}...`);
  
  client = mqtt.connect(brokerUrl, {
    clientId: `evchakra-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000, // Auto-reconnect every 5s if disconnected
  });

  client.on('connect', () => {
    console.log('[MQTT] ✅ Connected to broker');
    
    // Subscribe to telemetry from all devices
    client!.subscribe(TELEMETRY_TOPIC, { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT] Failed to subscribe to telemetry:', err);
      } else {
        console.log(`[MQTT] 📡 Subscribed to: ${TELEMETRY_TOPIC}`);
      }
    });
  });

  client.on('message', async (topic: string, message: Buffer) => {
    try {
      // Parse topic: evchakra/{deviceId}/telemetry
      const parts = topic.split('/');
      if (parts.length !== 3 || parts[2] !== 'telemetry') return;
      
      const deviceId = parts[1];
      const payload: TelemetryPayload = JSON.parse(message.toString());

      // Validate payload
      if (typeof payload.voltage !== 'number' || typeof payload.current !== 'number') {
        console.warn(`[MQTT] Invalid telemetry payload from ${deviceId}`);
        return;
      }

      const power = payload.power ?? (payload.voltage * payload.current) / 1000; // kW

      // Update the Device document with latest telemetry
      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          voltage: payload.voltage,
          current: payload.current,
          temperature: payload.temperature ?? 0,
          homeLoad: power,
          chargePower: power,
          isOnline: true,
          lastHeartbeat: new Date(),
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      // Save a Telemetry record for historical data
      await Telemetry.create({
        deviceId,
        voltage: payload.voltage,
        current: payload.current,
        power,
        temperature: payload.temperature ?? 0,
        timestamp: payload.timestamp ? new Date(payload.timestamp * 1000) : new Date(),
      });

      // Log occasionally (every ~10th message to avoid console spam)
      if (Math.random() < 0.1) {
        console.log(`[MQTT] 📊 ${deviceId}: ${power.toFixed(2)} kW, ${payload.voltage.toFixed(1)} V, ${payload.temperature?.toFixed(1) ?? '?'} °C`);
      }

    } catch (err) {
      console.error('[MQTT] Error processing message:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] ❌ Connection error:', err.message);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] 🔄 Reconnecting to broker...');
  });

  client.on('offline', () => {
    console.log('[MQTT] ⚠️ Client went offline');
  });

  // Mark devices as offline if no heartbeat for 30 seconds
  setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - 30000); // 30 seconds ago
      await Device.updateMany(
        { isOnline: true, lastHeartbeat: { $lt: threshold } },
        { isOnline: false }
      );
    } catch (err) {
      // Silently ignore — this is a background cleanup task
    }
  }, 10000); // Check every 10 seconds
}

/**
 * Publish a control command to a specific device via MQTT.
 * Called from the REST API when a user toggles charging, etc.
 */
export function publishCommand(deviceId: string, payload: ControlPayload): boolean {
  if (!client || !client.connected) {
    console.warn('[MQTT] Cannot publish — client not connected');
    return false;
  }

  const topic = `${CONTROL_TOPIC_PREFIX}/${deviceId}/control`;
  const message = JSON.stringify(payload);
  
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, err);
    } else {
      console.log(`[MQTT] 📤 Command sent to ${deviceId}: ${payload.command}`);
    }
  });

  return true;
}

/**
 * Get the current MQTT client instance (for testing/status checks).
 */
export function getMqttClient(): MqttClient | null {
  return client;
}
