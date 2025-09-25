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
var Ace1500_exports = {};
__export(Ace1500_exports, {
  Ace1500: () => Ace1500
});
module.exports = __toCommonJS(Ace1500_exports);
var import_aceControlStates = require("../../constants/aceControlStates");
var import_aceStates = require("../../constants/aceStates");
var import_ZenHaDevice = require("./ZenHaDevice");
class Ace1500 extends import_ZenHaDevice.ZenHaDevice {
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails
    );
    this.maxInputLimit = 900;
    this.maxOutputLimit = 900;
    this.states = import_aceStates.aceStates;
    this.controlStates = import_aceControlStates.aceControlStates;
  }
  setDcSwitch(dcSwitch) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setDcSwitchContent = {
        properties: { dcSwitch: dcSwitch ? 1 : 0 }
      };
      this.adapter.log.debug(
        `[setDcSwitch] Set DC Switch for device ${this.deviceKey} to ${dcSwitch}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(setDcSwitchContent)
      );
    }
  }
  setAcSwitch(acSwitch) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setAcSwitchContent = {
        properties: { acSwitch: acSwitch ? 1 : 0 }
      };
      this.adapter.log.debug(
        `[setAcSwitch] Set AC Switch for device ${this.deviceKey} to ${acSwitch}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(setAcSwitchContent)
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Ace1500
});
//# sourceMappingURL=Ace1500.js.map
