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
var import_hyperControlStates = require("../../constants/controlStates/hyperControlStates");
var import_sharedControlStates = require("../../constants/controlStates/sharedControlStates");
var import_ZenIobDevice = require("./ZenIobDevice");
class Hyper2000 extends import_ZenIobDevice.ZenIobDevice {
  maxInputLimit = 1200;
  maxOutputLimit = 1200;
  controlStates = [...import_sharedControlStates.sharedControlStates, ...import_hyperControlStates.hyperControlStates];
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      false,
      // zenSDK not supported
      _zenHaDeviceDetails
    );
  }
  setAcMode(acMode) {
    if (this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        this.updateProperty("acMode", acMode);
      } else {
        this.adapter.log.error(`[setAcMode] AC mode must be a value between 0 and 3!`);
      }
    }
  }
  setAcSwitch(acSwitch) {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("acSwitch", acSwitch ? 1 : 0);
    }
  }
  async setDeviceAutomationInOutLimit(limit) {
    if (this.productKey && this.deviceKey) {
      this.adapter.log.debug(`[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`);
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true && limit > 0) {
          limit = 0;
        }
        const fullChargeNeeded = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`
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
      await this.sendHemsEpSetpoint(limit);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Hyper2000
});
//# sourceMappingURL=Hyper2000.js.map
