"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mqttSharedService_exports = {};
__export(mqttSharedService_exports, {
  adapter: () => adapter,
  initAdapter: () => initAdapter,
  knownPackDataProperties: () => knownPackDataProperties,
  onConnected: () => onConnected,
  onDisconnected: () => onDisconnected,
  onError: () => onError,
  onMessage: () => onMessage,
  onMessageCloud: () => onMessageCloud,
  onMessageLocal: () => onMessageLocal,
  onReconnected: () => onReconnected,
  onSubscribeIotTopic: () => onSubscribeIotTopic,
  onSubscribeReportTopic: () => onSubscribeReportTopic
});
module.exports = __toCommonJS(mqttSharedService_exports);
var import_processDeviceProperties = require("../../helpers/processDeviceProperties");
let adapter = void 0;
const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh",
  "power",
  "batcur"
];
const initAdapter = (_adapter) => {
  adapter = _adapter;
  adapter.log.debug("[initAdapter] Init adapter in mqttSharedService!");
  return true;
};
const onMessage = async (productKey, deviceKey, obj) => {
  if (adapter) {
    const _device = adapter == null ? void 0 : adapter.zenIobDeviceList.find(
      (x) => x.deviceKey == deviceKey
    );
    if (!_device) {
      adapter.log.error(
        `[onMessage] DeviceKey '${deviceKey} not found in device list!'}`
      );
    }
    let isSolarFlow = false;
    if ((_device == null ? void 0 : _device.productKey) != "8bM93H") {
      isSolarFlow = true;
    }
    if (_device && obj.properties) {
      (0, import_processDeviceProperties.processDeviceProperties)(_device, obj.properties, isSolarFlow);
    }
    if (_device && obj.packData) {
      _device.addOrUpdatePackData(obj.packData, isSolarFlow);
    }
    if (obj.function && obj.success != null && obj.success != void 0) {
      if ((obj.function == "deviceAutomation" || obj.function == "hemsEP") && obj.success == 1) {
        const currentValue = await adapter.getStateAsync(
          productKey + "." + deviceKey + ".control.setDeviceAutomationInOutLimit"
        );
        _device == null ? void 0 : _device.updateSolarFlowControlState(
          "setDeviceAutomationInOutLimit",
          (currentValue == null ? void 0 : currentValue.val) ? currentValue.val : 0
        );
      } else if ((obj.function == "deviceAutomation" || obj.function == "hemsEP") && obj.success == 0) {
        adapter == null ? void 0 : adapter.log.warn(
          `[onMessage] device automation failed for ${_device == null ? void 0 : _device.productName}: ${productKey}/${deviceKey}!`
        );
      }
    }
  }
};
const onMessageLocal = async (topic, message) => {
  var _a;
  const topicSplitted = topic.replace("/server/app", "").split("/");
  const productKey = topicSplitted[1];
  const deviceKey = topicSplitted[2];
  let obj = {};
  try {
    obj = JSON.parse(message.toString());
  } catch (e) {
    const txt = message.toString();
    adapter == null ? void 0 : adapter.log.error(`[onMessageLocal] JSON Parse error!`);
    adapter == null ? void 0 : adapter.log.debug(`[onMessageLocal] JSON Parse error: ${txt}!`);
  }
  if ((adapter == null ? void 0 : adapter.log.level) == "debug") {
    adapter == null ? void 0 : adapter.log.debug(
      `[onMessageLocal] MQTT message on topic '${topic}': ${message.toString()}`
    );
  }
  onMessage(productKey, deviceKey, obj);
  if ((adapter == null ? void 0 : adapter.config.relayMqttToCloud) && ((_a = adapter == null ? void 0 : adapter.cloudMqttService) == null ? void 0 : _a.mqttClient)) {
    adapter == null ? void 0 : adapter.log.debug(
      `[onMessageLocal] Relay local message to Zendure cloud MQTT!`
    );
    obj.isHA = true;
    adapter.cloudMqttService.mqttClient.publish(
      topic,
      JSON.stringify(obj, (_, v) => v)
    );
  }
};
const onMessageCloud = async (topic, message) => {
  var _a;
  if (topic.toLowerCase().includes("loginOut/force")) {
  }
  const topicSplitted = topic.replace("/server/app", "").split("/");
  const productKey = topicSplitted[1];
  const deviceKey = topicSplitted[2];
  let obj = {};
  try {
    obj = JSON.parse(message.toString());
    if (obj.isHA) {
      return;
    }
  } catch (e) {
    const txt = message.toString();
    adapter == null ? void 0 : adapter.log.error(`[onMessageCloud] JSON Parse error!`);
    adapter == null ? void 0 : adapter.log.debug(`[onMessageCloud] JSON Parse error: ${txt}!`);
  }
  if ((adapter == null ? void 0 : adapter.log.level) == "debug") {
    adapter == null ? void 0 : adapter.log.debug(
      `[onMessageCloud] MQTT message on topic '${topic}': ${message.toString()}`
    );
  }
  onMessage(productKey, deviceKey, obj);
  if (!obj.isHA && ((_a = adapter == null ? void 0 : adapter.localMqttService) == null ? void 0 : _a.mqttClient)) {
    adapter == null ? void 0 : adapter.log.debug(`[onMessageCloud] Relay Cloud message to local MQTT!`);
    adapter.localMqttService.mqttClient.publish(
      topic,
      JSON.stringify(obj, (_, v) => v)
    );
  }
};
const onConnected = (url, opts) => {
  if (adapter) {
    adapter.lastLogin = /* @__PURE__ */ new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info(
      `[onConnected] Connected with MQTT! URL: ${url}, Client ID: ${opts.clientId}`
    );
  }
};
const onReconnected = (url) => {
  if (adapter) {
    adapter.lastLogin = /* @__PURE__ */ new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info(`[onReconnected] Reconnected to MQTT! URL: ${url}`);
  }
};
const onDisconnected = (url) => {
  if (adapter) {
    adapter.lastLogin = /* @__PURE__ */ new Date();
    adapter.setState("info.connection", false, true);
    adapter.log.info(`[onDisconnected] Disconnected from MQTT! URL: ${url}`);
  }
};
const onError = (error, url) => {
  if (adapter) {
    adapter.setState("info.connection", false, true);
    adapter.log.error(
      `[onError] Connection to MQTT failed! URL: ${url}, Error: ${error}`
    );
  }
};
const onSubscribeReportTopic = (error) => {
  if (error) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter == null ? void 0 : adapter.log.debug("Subscription of Report Topic successful!");
  }
};
const onSubscribeIotTopic = (error, productKey, deviceKey) => {
  if (error) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + error);
  } else if (adapter) {
    adapter == null ? void 0 : adapter.log.debug(
      `Subscription of IOT Topic successful! ProductKey: ${productKey}, DeviceKey: ${deviceKey}`
    );
    const _device = adapter.zenIobDeviceList.find(
      (x) => x.productKey == productKey && x.deviceKey == deviceKey
    );
    if (_device) {
      const randomDelay = Math.floor(Math.random() * 10) + 3;
      setTimeout(() => {
        _device.triggerFullTelemetryUpdate();
      }, randomDelay * 1e3);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adapter,
  initAdapter,
  knownPackDataProperties,
  onConnected,
  onDisconnected,
  onError,
  onMessage,
  onMessageCloud,
  onMessageLocal,
  onReconnected,
  onSubscribeIotTopic,
  onSubscribeReportTopic
});
//# sourceMappingURL=mqttSharedService.js.map
