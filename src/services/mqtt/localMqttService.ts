/* eslint-disable @typescript-eslint/indent */
import mqtt from "mqtt";
import { ZendureSolarflow } from "../../main";
import { MqttService } from "./mqttService";

export class LocalMqttService extends MqttService {
  constructor(adapter: ZendureSolarflow) {
    super(adapter);
  }

  connect(): boolean {
    if (!this.adapter.config || !this.adapter.config.localMqttUrl) {
      this.adapter.log.error("[LocalMqttService] local MQTT url missing!");
      return false;
    }

    const opts: mqtt.IClientOptions = {
      clientId: "ioBroker.zendure-solarflow." + this.adapter.instance,
    };

    this.adapter.log.debug(
      `[LocalMqttService] Connecting to local MQTT broker at ${this.adapter.config.localMqttUrl} with client ID ${opts.clientId}`,
    );

    const url = `mqtt://${this.adapter.config.localMqttUrl}:1883`;
    const ok = this.connectWithOptions(opts, url, true);

    if (ok) {
      // we previously set the flag immediately for local mode
      this.adapter.setState("info.connection", true, true);
    }

    return ok;
  }
}
