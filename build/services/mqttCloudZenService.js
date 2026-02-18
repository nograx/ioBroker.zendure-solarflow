"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mqttCloudZenService_exports = {};
__export(mqttCloudZenService_exports, {
  connectCloudZenMqttClient: () => connectCloudZenMqttClient
});
module.exports = __toCommonJS(mqttCloudZenService_exports);
var import_mqtt = __toESM(require("mqtt"));
var import_mqttSharedService = require("./mqttSharedService");
var import_jobSchedule = require("./jobSchedule");
const connectCloudZenMqttClient = (_adapter) => {
  if (!_adapter) {
    return false;
  }
  (0, import_mqttSharedService.initAdapter)(_adapter);
  if (!import_mqttSharedService.adapter || !import_mqttSharedService.adapter.mqttSettings) {
    _adapter.log.error(`[connectCloudMqttClient] MQTT settings missing!`);
    return false;
  }
  const options = {
    clientId: import_mqttSharedService.adapter.mqttSettings.clientId,
    username: import_mqttSharedService.adapter.mqttSettings.username,
    password: import_mqttSharedService.adapter.mqttSettings.password,
    clean: true,
    protocolVersion: 5
  };
  if (import_mqtt.default && import_mqttSharedService.adapter && import_mqttSharedService.adapter.mqttSettings) {
    import_mqttSharedService.adapter.log.debug(
      `[connectCloudMqttClient] Connecting to MQTT broker ${import_mqttSharedService.adapter.mqttSettings.url + ":1883"}...`
    );
    import_mqttSharedService.adapter.mqttClient = import_mqtt.default.connect(
      "mqtt://" + import_mqttSharedService.adapter.mqttSettings.url + ":1883",
      options
    );
    if (import_mqttSharedService.adapter && import_mqttSharedService.adapter.mqttClient) {
      import_mqttSharedService.adapter.mqttClient.on("connect", import_mqttSharedService.onConnected);
      import_mqttSharedService.adapter.mqttClient.on("reconnect", import_mqttSharedService.onReconnected);
      import_mqttSharedService.adapter.mqttClient.on("disconnect", import_mqttSharedService.onDisconnected);
      import_mqttSharedService.adapter.mqttClient.on("error", import_mqttSharedService.onError);
      import_mqttSharedService.adapter.mqttClient.on("message", import_mqttSharedService.onMessage);
      (0, import_jobSchedule.startResetValuesJob)(import_mqttSharedService.adapter);
      (0, import_jobSchedule.startCheckStatesAndConnectionJob)(import_mqttSharedService.adapter);
      if (import_mqttSharedService.adapter.config.useCalculation) {
        (0, import_jobSchedule.startCalculationJob)(import_mqttSharedService.adapter);
      }
      return true;
    }
  }
  return false;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  connectCloudZenMqttClient
});
//# sourceMappingURL=mqttCloudZenService.js.map
