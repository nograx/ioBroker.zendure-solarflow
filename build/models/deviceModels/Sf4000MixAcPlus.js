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
var Sf4000MixAcPlus_exports = {};
__export(Sf4000MixAcPlus_exports, {
  Sf4000MixAcPlus: () => Sf4000MixAcPlus
});
module.exports = __toCommonJS(Sf4000MixAcPlus_exports);
var import_solarflow4000MixAcPlusControlStates = require("../../constants/controlStates/solarflow4000MixAcPlusControlStates");
var import_sharedControlStates = require("../../constants/controlStates/sharedControlStates");
var import_ZenSdkIobDevice = require("./ZenSdkIobDevice");
class Sf4000MixAcPlus extends import_ZenSdkIobDevice.ZenSdkIobDevice {
  maxInputLimit = 4e3;
  maxOutputLimit = 4e3;
  isZenSdkSupported = true;
  // This device uses a 24V battery pack, half the 48V systems the base thresholds are tuned for.
  lowVoltageThreshold = 23.05;
  lowVoltageRecoveryThreshold = 23.75;
  controlStates = [...import_sharedControlStates.sharedControlStates, ...import_solarflow4000MixAcPlusControlStates.solarflow4000MixAcPlusControlStates];
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails);
  }
  async setAcMode(acMode) {
    if (this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        this.updateProperty("acMode", acMode);
        const smartMode = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.control.smartMode`);
        if (smartMode && !smartMode.val) {
          this.adapter.log.warn(
            `[setAcMode] AC mode was switched and smartMode is false - changes will be written to flash memory. In the worst case, the device may break or changes may no longer be saved!`
          );
        }
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Sf4000MixAcPlus
});
//# sourceMappingURL=Sf4000MixAcPlus.js.map
