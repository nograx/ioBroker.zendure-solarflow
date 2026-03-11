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
var cloudMqttService_exports = {};
__export(cloudMqttService_exports, {
  CloudMqttService: () => CloudMqttService
});
module.exports = __toCommonJS(cloudMqttService_exports);
var import_mqttService = require("./mqttService");
class CloudMqttService extends import_mqttService.MqttService {
  constructor(adapter) {
    super(adapter);
  }
  connect() {
    if (!this.adapter.mqttSettings) {
      this.adapter.log.error("[CloudMqttService] MQTT settings missing!");
      return false;
    }
    const opts = {
      clientId: this.adapter.mqttSettings.clientId,
      username: this.adapter.mqttSettings.username,
      password: this.adapter.mqttSettings.password,
      clean: true,
      protocolVersion: 5
    };
    this.adapter.log.debug(
      `[CloudMqttService] Connecting to cloud MQTT broker at ${this.adapter.mqttSettings.url} with client ID ${opts.clientId}`
    );
    const result = this.adapter.mqttSettings.url.includes(":") ? this.adapter.mqttSettings.url.split(/:(?=[^:]*$)/) : [this.adapter.mqttSettings.url, "1883"];
    const url = `mqtt://${result[0]}:${result[1]}`;
    return this.connectWithOptions(opts, url, false);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudMqttService
});
//# sourceMappingURL=cloudMqttService.js.map
