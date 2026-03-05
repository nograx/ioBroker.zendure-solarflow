/* eslint-disable @typescript-eslint/indent */

import mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import { MqttService } from "./mqttService";

/**
 * Cloud-specific MQTT service. wraps the legacy helper for compatibility.
 */
export class CloudMqttService extends MqttService {
  constructor(adapter: ZendureSolarflow) {
    super(adapter);
  }

  connect(): boolean {
    if (!this.adapter.mqttSettings) {
      this.adapter.log.error("[CloudMqttService] MQTT settings missing!");
      return false;
    }

    const opts: mqtt.IClientOptions = {
      clientId: this.adapter.mqttSettings.clientId,
      username: this.adapter.mqttSettings.username,
      password: this.adapter.mqttSettings.password,
      clean: true,
      protocolVersion: 5,
    };

    const url = `mqtt://${this.adapter.mqttSettings.url}:1883`;
    return this.connectWithOptions(opts, url);
  }
}

/**
 * backward‑compatible wrapper matching the old exported function.
 */
export const connectCloudZenMqttClient = (
  _adapter: ZendureSolarflow,
): boolean => {
  const svc = new CloudMqttService(_adapter);
  return svc.connect();
};
