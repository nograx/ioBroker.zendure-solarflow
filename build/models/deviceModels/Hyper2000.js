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
var Hyper2000_exports = {};
__export(Hyper2000_exports, {
  Hyper2000: () => Hyper2000
});
module.exports = __toCommonJS(Hyper2000_exports);
var import_hyperControlStates = require("../../constants/hyperControlStates");
var import_hyperStates = require("../../constants/hyperStates");
var import_ZenHaDevice = require("./ZenHaDevice");
class Hyper2000 extends import_ZenHaDevice.ZenHaDevice {
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails
    );
    this.maxInputLimit = 1200;
    this.maxOutputLimit = 1200;
    this.states = import_hyperStates.hyperStates;
    this.controlStates = import_hyperControlStates.hyperControlStates;
  }
  async setAcMode(acMode) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        const setAcMode = { properties: { acMode } };
        this.adapter.log.debug(`[setAcMode] Set AC mode to ${acMode}!`);
        (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
          this.iotTopic,
          JSON.stringify(setAcMode)
        );
      } else {
        this.adapter.log.error(
          `[setAcMode] AC mode must be a value between 0 and 3!`
        );
      }
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
  async setDeviceAutomationInOutLimit(limit) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`
      );
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true && limit > 0) {
          limit = 0;
        }
        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded"
        );
        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true && limit > 0) {
          limit = 0;
        }
      }
      if (limit < 0 && limit < -this.maxInputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is below the maximum input limit of ${this.maxInputLimit}, setting to ${-this.maxInputLimit}!`
        );
        limit = -this.maxInputLimit;
      } else if (limit > this.maxOutputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is higher the maximum output limit of ${this.maxOutputLimit}, setting to ${this.maxOutputLimit}!`
        );
        limit = this.maxOutputLimit;
      }
      this.messageId += 1;
      const timestamp = /* @__PURE__ */ new Date();
      timestamp.setMilliseconds(0);
      let _arguments = [];
      if (limit < 0) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using CHARGE variant of HYPER device automation, as device '${this.deviceKey}' detected and limit (${limit}) is negative!`
        );
        _arguments = [
          {
            autoModelProgram: 1,
            autoModelValue: {
              chargingType: 1,
              price: 2,
              chargingPower: Math.abs(limit),
              prices: [
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1
              ],
              outPower: 0,
              freq: 0
            },
            msgType: 1,
            autoModel: 8
          }
        ];
      } else {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using FEED IN variant of HYPER device automation, as device '${this.productName}' detected and limit (${limit}) is positive!`
        );
        _arguments = [
          {
            autoModelProgram: 2,
            autoModelValue: {
              chargingType: 0,
              chargingPower: 0,
              freq: 0,
              outPower: limit
            },
            msgType: 1,
            autoModel: 8
          }
        ];
      }
      const deviceAutomation = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: this.messageId,
        deviceKey: this.deviceKey,
        timestamp: timestamp.getTime() / 1e3
      };
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.functionTopic,
        JSON.stringify(deviceAutomation)
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Hyper2000
});
//# sourceMappingURL=Hyper2000.js.map
