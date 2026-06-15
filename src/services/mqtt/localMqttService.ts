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
      rejectUnauthorized: this.adapter.config.localMqttAcceptSelfSignedSSL
        ? false
        : true,
    };

    const port = this.adapter.config.localMqttSSL ? 8883 : 1883;
    const protocol = this.adapter.config.localMqttSSL ? "mqtts" : "mqtt";

    this.adapter.log.debug(
      `[LocalMqttService] Connecting to local MQTT broker at ${this.adapter.config.localMqttUrl}:${port} with client ID ${opts.clientId}`,
    );

    const url = `${protocol}://${this.adapter.config.localMqttUrl}:${port}`;
    const ok = this.connectWithOptions(opts, url, true);

    if (ok) {
      // we previously set the flag immediately for local mode
      this.adapter.setState("info.connection", true, true);
    }

    return ok;
  }
}
