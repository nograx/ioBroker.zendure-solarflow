import { processDeviceProperties } from "../../helpers/processDeviceProperties";
import { ZendureSolarflow } from "../../main";

import { IMqttData } from "../../models/ISolarFlowMqttProperties";

export let adapter: ZendureSolarflow | undefined = undefined;

export const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh",
  "power",
  "batcur",
];

export const initAdapter = (_adapter: ZendureSolarflow): boolean => {
  adapter = _adapter;

  adapter.log.debug("[initAdapter] Init adapter in mqttSharedService!");

  return true;
};

export const onMessage = async (
  productKey: string,
  deviceKey: string,
  obj: IMqttData,
): Promise<void> => {
  if (adapter) {
    const _device = adapter?.zenIobDeviceList.find(
      (x) => x.deviceKey == deviceKey,
    );

    if (!_device) {
      adapter.log.error(
        `[onMessage] DeviceKey '${deviceKey} not found in device list!'}`,
      );
    }

    let isSolarFlow = false;

    // Check if device is an solarflow or hyper device. Don't use LowVoltageBlock on an ACE device?
    if (_device?.productKey != "8bM93H") {
      isSolarFlow = true;
    }

    // Process properties if they exist in the message
    if (_device && obj.properties) {
      processDeviceProperties(_device, obj.properties, isSolarFlow);
    }

    // Process packData if it exists in the message
    if (_device && obj.packData) {
      _device.addOrUpdatePackData(obj.packData, isSolarFlow);
    }

    // Check if message is an ack for device automation and update state accordingly
    if (obj.function && obj.success != null && obj.success != undefined) {
      if (
        (obj.function == "deviceAutomation" || obj.function == "hemsEP") &&
        obj.success == 1
      ) {
        // setDeviceAutomationInOutLimit ack = true setzen;
        const currentValue = await adapter.getStateAsync(
          productKey +
            "." +
            deviceKey +
            ".control.setDeviceAutomationInOutLimit",
        );

        _device?.updateSolarFlowControlState(
          "setDeviceAutomationInOutLimit",
          currentValue?.val ? currentValue.val : 0,
        );
      } else if (
        (obj.function == "deviceAutomation" || obj.function == "hemsEP") &&
        obj.success == 0
      ) {
        adapter?.log.warn(
          `[onMessage] device automation failed for ${_device?.productName}: ${productKey}/${deviceKey}!`,
        );
      }
    }
  }
};

export const onMessageLocal = async (
  topic: string,
  message: Buffer,
): Promise<void> => {
  const topicSplitted = topic.replace("/server/app", "").split("/");
  const productKey = topicSplitted[1];
  const deviceKey = topicSplitted[2];

  let obj: IMqttData = {};
  try {
    obj = JSON.parse(message.toString());
  } catch (e) {
    const txt = message.toString();
    adapter?.log.error(`[onMessageLocal] JSON Parse error!`);

    adapter?.log.debug(`[onMessageLocal] JSON Parse error: ${txt}!`);
  }

  if (adapter?.log.level == "debug") {
    adapter?.log.debug(
      `[onMessageLocal] MQTT message on topic '${topic}': ${message.toString()}`,
    );
  }

  onMessage(productKey, deviceKey, obj);

  // Relay message to cloud
  if (
    adapter?.config.relayMqttToCloud &&
    adapter?.cloudMqttService?.mqttClient
  ) {
    adapter?.log.debug(
      `[onMessageLocal] Relay local message to Zendure cloud MQTT!`,
    );

    // Set flag to avoid loops, because the cloud will relay the message back to local and we don't want to process it twice
    obj.isHA = true;

    adapter.cloudMqttService.mqttClient.publish(
      topic,
      JSON.stringify(obj, (_, v) => v),
    );
  }
};

export const onMessageCloud = async (
  topic: string,
  message: Buffer,
): Promise<void> => {
  if (topic.toLowerCase().includes("loginOut/force")) {
    // TODO: Ausloggen???
  }

  const topicSplitted = topic.replace("/server/app", "").split("/");
  const productKey = topicSplitted[1];
  const deviceKey = topicSplitted[2];

  let obj: IMqttData = {};
  try {
    obj = JSON.parse(message.toString());

    if (obj.isHA) {
      // Message already processed in local mqtt, ignore to avoid loops
      return;
    }
  } catch (e) {
    const txt = message.toString();
    adapter?.log.error(`[onMessageCloud] JSON Parse error!`);

    adapter?.log.debug(`[onMessageCloud] JSON Parse error: ${txt}!`);
  }

  if (adapter?.log.level == "debug") {
    adapter?.log.debug(
      `[onMessageCloud] MQTT message on topic '${topic}': ${message.toString()}`,
    );
  }

  onMessage(productKey, deviceKey, obj);

  // Relay cloud message to local if not already from local
  if (!obj.isHA && adapter?.localMqttService?.mqttClient) {
    adapter?.log.debug(`[onMessageCloud] Relay Cloud message to local MQTT!`);

    adapter.localMqttService.mqttClient.publish(
      topic,
      JSON.stringify(obj, (_, v) => v),
    );
  }
};

export const onConnected = (): void => {
  if (adapter) {
    adapter.lastLogin = new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info("[onConnected] Connected with MQTT!");
  }
};

export const onReconnected = (): void => {
  if (adapter) {
    adapter.lastLogin = new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info("[onReconnected] Reconnected to MQTT!");
  }
};

export const onDisconnected = (): void => {
  if (adapter) {
    adapter.lastLogin = new Date();
    adapter.setState("info.connection", false, true);
    adapter.log.info("[onDisconnected] Disconnected from MQTT!");
  }
};

export const onError = (error: any): void => {
  if (adapter) {
    adapter.setState("info.connection", false, true);
    adapter.log.error("Connection to MQTT failed! Error: " + error);
  }
};

export const onSubscribeReportTopic: any = (error: Error | null) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter?.log.debug("Subscription of Report Topic successful!");
  }
};

export const onSubscribeIotTopic: any = (
  error: Error | null,
  productKey: string,
  deviceKey: string,
) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else if (adapter) {
    adapter?.log.debug(
      `Subscription of IOT Topic successful! ProductKey: ${productKey}, DeviceKey: ${deviceKey}`,
    );

    const _device = adapter.zenIobDeviceList.find(
      (x) => x.productKey == productKey && x.deviceKey == deviceKey,
    );

    if (_device) {
      const randomDelay = Math.floor(Math.random() * 10) + 3;
      setTimeout(() => {
        _device.triggerFullTelemetryUpdate();
      }, randomDelay * 1000);
    }
  }
};
