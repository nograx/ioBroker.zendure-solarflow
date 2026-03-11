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
var mqttService_exports = {};
__export(mqttService_exports, {
  MqttService: () => MqttService
});
module.exports = __toCommonJS(mqttService_exports);
var import_mqtt = __toESM(require("mqtt"));
var import_mqttSharedService = require("./mqttSharedService");
var import_jobSchedule = require("../jobSchedule");
class MqttService {
  constructor(adapter) {
    this.adapter = adapter;
    (0, import_mqttSharedService.initAdapter)(adapter);
  }
  /**
   * Helper used by subclasses to wire up a client once options and URL are known.
   * Returns true when the client was successfully created and listeners attached.
   */
  connectWithOptions(opts, url, isLocal) {
    if (!import_mqtt.default) {
      this.adapter.log.error("[MqttService] mqtt dependency missing");
      return false;
    }
    this.adapter.log.debug(`[MqttService] Connecting to MQTT broker ${url}...`);
    this.mqttClient = import_mqtt.default.connect(url, opts);
    if (this.mqttClient) {
      this.mqttClient.on("connect", () => (0, import_mqttSharedService.onConnected)(url, opts));
      this.mqttClient.on("reconnect", () => (0, import_mqttSharedService.onReconnected)(url));
      this.mqttClient.on("disconnect", () => (0, import_mqttSharedService.onDisconnected)(url));
      this.mqttClient.on("error", (error) => (0, import_mqttSharedService.onError)(error, url));
      this.mqttClient.on("message", isLocal ? import_mqttSharedService.onMessageLocal : import_mqttSharedService.onMessageCloud);
      this.startJobs();
      return true;
    }
    return false;
  }
  /**
   * Start all background jobs that are common to local/cloud clients.
   */
  startJobs() {
    (0, import_jobSchedule.startResetValuesJob)(this.adapter);
    (0, import_jobSchedule.startCheckStatesAndConnectionJob)(this.adapter);
    if (this.adapter.config.useCalculation) {
      (0, import_jobSchedule.startCalculationJob)(this.adapter);
    }
  }
  /**
   * Tear down the client if it exists.
   */
  disconnect() {
    var _a;
    (_a = this.mqttClient) == null ? void 0 : _a.end(true);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MqttService
});
//# sourceMappingURL=mqttService.js.map
