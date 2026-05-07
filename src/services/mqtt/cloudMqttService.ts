
import mqtt from "mqtt";
import { ZendureSolarflow } from "../../main";
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

    this.adapter.log.debug(
      `[CloudMqttService] Connecting to cloud MQTT broker at ${this.adapter.mqttSettings.url} with client ID ${opts.clientId}`,
    );

    const result: [string, string] = this.adapter.mqttSettings.url.includes(":")
      ? (this.adapter.mqttSettings.url.split(/:(?=[^:]*$)/) as [string, string])
      : [this.adapter.mqttSettings.url, "1883"];

    const url = `mqtt://${result[0]}:${result[1]}`;
    return this.connectWithOptions(opts, url, false);
  }
}
