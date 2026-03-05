import mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import {
  initAdapter,
  onConnected,
  onDisconnected,
  onError,
  onMessage,
  onReconnected,
} from "./mqttSharedService";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startResetValuesJob,
} from "./jobSchedule";

/**
 * Base class encapsulating common MQTT client setup and job scheduling.
 * Concrete subclasses supply connection-specific options/URL.
 */
export abstract class MqttService {
  protected adapter: ZendureSolarflow;
  protected client?: mqtt.MqttClient;

  constructor(adapter: ZendureSolarflow) {
    this.adapter = adapter;
    initAdapter(adapter);
  }

  /**
   * Helper used by subclasses to wire up a client once options and URL are known.
   * Returns true when the client was successfully created and listeners attached.
   */
  protected connectWithOptions(
    opts: mqtt.IClientOptions,
    url: string,
  ): boolean {
    if (!mqtt) {
      this.adapter.log.error("[MqttService] mqtt dependency missing");
      return false;
    }

    this.adapter.log.debug(`[MqttService] Connecting to MQTT broker ${url}...`);
    this.client = mqtt.connect(url, opts);

    if (this.client) {
      // keep the old public field in sync for existing code
      this.adapter.mqttClient = this.client;

      this.client.on("connect", onConnected);
      this.client.on("reconnect", onReconnected);
      this.client.on("disconnect", onDisconnected);
      this.client.on("error", onError);
      this.client.on("message", onMessage);

      this.startJobs();
      return true;
    }

    return false;
  }

  /**
   * Start all background jobs that are common to local/cloud clients.
   */
  protected startJobs(): void {
    startResetValuesJob(this.adapter);
    startCheckStatesAndConnectionJob(this.adapter);
    if (this.adapter.config.useCalculation) {
      startCalculationJob(this.adapter);
    }
  }

  /**
   * Establish a connection; subclasses must implement specifics.
   */
  abstract connect(): boolean;

  /**
   * Tear down the client if it exists.
   */
  disconnect(): void {
    this.client?.end(true);
  }
}
