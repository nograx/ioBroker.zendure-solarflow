import mqtt from "mqtt";
import { ZendureSolarflow } from "../../main";
import {
  initAdapter,
  onConnected,
  onDisconnected,
  onError,
  onMessageCloud,
  onMessageLocal,
  onReconnected,
} from "./mqttSharedService";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startResetValuesJob,
} from "../jobSchedule";

/**
 * Base class encapsulating common MQTT client setup and job scheduling.
 * Concrete subclasses supply connection-specific options/URL.
 */
export abstract class MqttService {
  protected adapter: ZendureSolarflow;
  public mqttClient?: mqtt.MqttClient;

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
    isLocal: boolean,
  ): boolean {
    if (!mqtt) {
      this.adapter.log.error("[MqttService] mqtt dependency missing");
      return false;
    }

    this.adapter.log.debug(`[MqttService] Connecting to MQTT broker ${url}...`);
    this.mqttClient = mqtt.connect(url, opts);

    if (this.mqttClient) {
      // keep the old public field in sync for existing code
      this.mqttClient.on("connect", onConnected);
      this.mqttClient.on("reconnect", onReconnected);
      this.mqttClient.on("disconnect", onDisconnected);
      this.mqttClient.on("error", onError);
      this.mqttClient.on("message", isLocal ? onMessageLocal : onMessageCloud);

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
    this.mqttClient?.end(true);
  }
}
