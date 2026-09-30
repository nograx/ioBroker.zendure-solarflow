import mqtt from "mqtt";
import type { ZendureSolarflow } from "../../main";
import {
  initAdapter,
  onConnected,
  onDisconnected,
  onError,
  onMessageCloud,
  onMessageLocal,
  onReconnected,
} from "./mqttSharedService";
import { startCalculationJob, startCheckStatesAndConnectionJob, startResetValuesJob } from "../jobSchedule";

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
   *
   * @param opts
   * @param url
   * @param isLocal
   */
  protected connectWithOptions(opts: mqtt.IClientOptions, url: string, isLocal: boolean): boolean {
    if (!mqtt) {
      this.adapter.log.error("[MqttService] mqtt dependency missing");
      return false;
    }

    this.adapter.log.debug(`[MqttService] Connecting to MQTT broker ${url}...`);
    this.mqttClient = mqtt.connect(url, opts);

    if (this.mqttClient) {
      // keep the old public field in sync for existing code
      this.mqttClient.on("connect", () => onConnected(url, opts));
      this.mqttClient.on("reconnect", () => onReconnected(url));
      this.mqttClient.on("disconnect", () => onDisconnected(url));
      this.mqttClient.on("offline", () => onDisconnected(url));
      this.mqttClient.on("error", (error) => onError(error, url));
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
   * Tear down the client if it exists. Sends a clean DISCONNECT if possible, but never blocks the
   * adapter shutdown: a non-forced end() waits for unacknowledged QoS 1 messages, which never
   * arrive if the broker is unreachable. In that case (or on timeout) the connection is closed forcibly.
   *
   * @param timeoutMs maximum time to wait for a clean disconnect
   */
  async disconnect(timeoutMs = 500): Promise<void> {
    const client = this.mqttClient;
    if (!client) {
      return;
    }

    this.mqttClient = undefined;

    // Don't process any further events (messages, state updates) while shutting down
    client.removeAllListeners();
    client.on("error", () => {});

    // Pending QoS 1 messages or no connection: a clean disconnect is not possible, close immediately
    const force = !client.connected || Object.keys(client.outgoing).length > 0;

    let timeout: NodeJS.Timeout | undefined;
    const timedOut = await Promise.race([
      client.endAsync(force).then(
        () => false,
        () => false,
      ),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => resolve(true), timeoutMs);
      }),
    ]);
    clearTimeout(timeout);

    if (timedOut) {
      // end() can't be forced once it is in progress, so destroy the underlying socket
      client.stream?.destroy();
    }
  }
}
