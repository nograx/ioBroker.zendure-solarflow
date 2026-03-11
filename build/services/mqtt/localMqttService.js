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
var localMqttService_exports = {};
__export(localMqttService_exports, {
  LocalMqttService: () => LocalMqttService
});
module.exports = __toCommonJS(localMqttService_exports);
var import_mqttService = require("./mqttService");
class LocalMqttService extends import_mqttService.MqttService {
  constructor(adapter) {
    super(adapter);
  }
  connect() {
    if (!this.adapter.config || !this.adapter.config.localMqttUrl) {
      this.adapter.log.error("[LocalMqttService] local MQTT url missing!");
      return false;
    }
    const opts = {
      clientId: "ioBroker.zendure-solarflow." + this.adapter.instance
    };
    this.adapter.log.debug(
      `[LocalMqttService] Connecting to local MQTT broker at ${this.adapter.config.localMqttUrl} with client ID ${opts.clientId}`
    );
    const url = `mqtt://${this.adapter.config.localMqttUrl}:1883`;
    const ok = this.connectWithOptions(opts, url, true);
    if (ok) {
      this.adapter.setState("info.connection", true, true);
    }
    return ok;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocalMqttService
});
//# sourceMappingURL=localMqttService.js.map
