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

export const connectCloudZenMqttClient = (
  _adapter: ZendureSolarflow
): boolean => {
  if (!_adapter) {
    return false;
  }

  initAdapter(_adapter);

  if (!adapter || !adapter.mqttSettings) {
    _adapter.log.error(`[connectCloudMqttClient] MQTT settings missing!`);
    return false;
  }

  const options: mqtt.IClientOptions = {
    clientId: adapter.mqttSettings.clientId,
    username: adapter.mqttSettings.username,
    password: adapter.mqttSettings.password,
    clean: true,
    protocolVersion: 5,
  };

  if (mqtt && adapter && adapter.mqttSettings) {
    adapter.log.debug(
      `[connectCloudMqttClient] Connecting to MQTT broker ${
        adapter.mqttSettings.url + ":1883"
      }...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.mqttSettings.url + ":1883",
      options
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      adapter.mqttClient.on("message", onMessage);

      // Job starten die states in der Nacht zu resetten
      startResetValuesJob(adapter);

      // Job starten die States zu checken
      startCheckStatesAndConnectionJob(adapter);

      // Calculation Job starten sofern aktiviert
      if (adapter.config.useCalculation) {
        startCalculationJob(adapter);
      }

      return true;
    }
  }

  return false;
};
