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
var ZenSdkIobDevice_exports = {};
__export(ZenSdkIobDevice_exports, {
  ZenSdkIobDevice: () => ZenSdkIobDevice
});
module.exports = __toCommonJS(ZenSdkIobDevice_exports);
var import_enums = require("../../helpers/enums");
var import_ZenIobDevice = require("./ZenIobDevice");
class ZenSdkIobDevice extends import_ZenIobDevice.ZenIobDevice {
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      true,
      // use zenSDK for this device
      _zenHaDeviceDetails
    );
  }
  resetAcModeTimeout;
  resetSmartModeTimeout;
  async setDeviceAutomationInOutLimit(limit) {
    if (this.productKey && this.deviceKey) {
      this.adapter.log.debug(`[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`);
      if (this.resetAcModeTimeout) {
        this.adapter.clearTimeout(this.resetAcModeTimeout);
        this.resetAcModeTimeout = void 0;
      }
      if (this.resetSmartModeTimeout) {
        this.adapter.clearTimeout(this.resetSmartModeTimeout);
        this.resetSmartModeTimeout = void 0;
      }
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
      if (this.deviceConnectionMode == import_enums.DeviceConnectionMode.zenSDK) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using zenSDK to set input/outputlimit in combination with acMode and smartMode!`
        );
        const currentSmartMode = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.smartMode`);
        const currentAcMode = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.acMode`);
        const currentInputLimit = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.inputLimit`);
        const currentOutputLimit = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.outputLimit`);
        const results = [];
        if (limit < 0) {
          if (currentAcMode && currentAcMode.val != 1) {
            results.push(await this.updateProperty("acMode", 1));
          }
          if (currentSmartMode && currentSmartMode.val != 1) {
            results.push(await this.updateProperty("smartMode", 1));
          }
          if (currentOutputLimit && currentOutputLimit.val != 0) {
            results.push(await this.updateProperty("outputLimit", 0));
          }
          if (currentInputLimit && currentInputLimit.val != Math.abs(limit)) {
            results.push(await this.updateProperty("inputLimit", Math.abs(limit)));
          }
        } else if (limit > 0) {
          if (currentAcMode && currentAcMode.val != 2) {
            results.push(await this.updateProperty("acMode", 2));
          }
          if (currentSmartMode && currentSmartMode.val != 1) {
            results.push(await this.updateProperty("smartMode", 1));
          }
          if (currentOutputLimit && currentOutputLimit.val != limit) {
            results.push(await this.updateProperty("outputLimit", limit));
          }
          if (currentInputLimit && currentInputLimit.val != 0) {
            results.push(await this.updateProperty("inputLimit", 0));
          }
        } else {
          if (currentOutputLimit && currentOutputLimit.val != 0) {
            results.push(await this.updateProperty("outputLimit", 0));
          }
          if (currentInputLimit && currentInputLimit.val != 0) {
            results.push(await this.updateProperty("inputLimit", 0));
          }
          this.resetAcModeTimeout = this.adapter.setTimeout(async () => {
            this.resetAcModeTimeout = void 0;
            if (currentAcMode && currentAcMode.val != 0) {
              results.push(await this.updateProperty("acMode", 0));
            }
          }, 2e3);
          this.resetSmartModeTimeout = this.adapter.setTimeout(async () => {
            this.resetSmartModeTimeout = void 0;
            if (currentSmartMode && currentSmartMode.val != 0) {
              results.push(await this.updateProperty("smartMode", 0));
            }
          }, 4e3);
        }
        const success = results.every((result) => result === true);
        if (success) {
          this == null ? void 0 : this.updateSolarFlowControlState("setDeviceAutomationInOutLimit", limit);
        }
      } else {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using HEMS Variant of device automation, as deviceKey '${this.deviceKey}' detected!`
        );
        await this.sendHemsEpSetpoint(limit);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZenSdkIobDevice
});
//# sourceMappingURL=ZenSdkIobDevice.js.map
