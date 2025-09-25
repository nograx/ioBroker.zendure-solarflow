/* eslint-disable @typescript-eslint/indent */
import mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import {
  adapter,
  initAdapter,
  onConnected,
  onError,
  onMessage,
} from "./mqttSharedService";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startResetValuesJob,
} from "./jobSchedule";

export const connectLocalMqttClient = (_adapter: ZendureSolarflow): void => {
  initAdapter(_adapter);

  if (!adapter) {
    return;
  }

  const options: mqtt.IClientOptions = {
    clientId: "ioBroker.zendure-solarflow." + adapter.instance,
  };

  if (mqtt && adapter && adapter.config && adapter.config.localMqttUrl) {
    adapter.log.debug(
      `[connectLocalMqttClient] Connecting to MQTT broker ${
        adapter.config.localMqttUrl + ":" + 1883
      }...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.config.localMqttUrl + ":" + 1883,
      options
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      adapter.setState("info.connection", true, true);

      adapter.mqttClient.on("message", onMessage);

      // Job starten die states in der Nacht zu resetten
      startResetValuesJob(adapter);

      // Job starten die States zu checken
      startCheckStatesAndConnectionJob(adapter);

      // Calculation Job starten sofern aktiviert
      if (adapter.config.useCalculation) {
        startCalculationJob(adapter);
      }
    }
  }
};
