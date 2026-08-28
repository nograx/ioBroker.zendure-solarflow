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
var SmartMeter3Ct_exports = {};
__export(SmartMeter3Ct_exports, {
  SmartMeter3Ct: () => SmartMeter3Ct
});
module.exports = __toCommonJS(SmartMeter3Ct_exports);
var import_ZenSdkIobDevice = require("./ZenSdkIobDevice");
class SmartMeter3Ct extends import_ZenSdkIobDevice.ZenSdkIobDevice {
  isZenSdkSupported = true;
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SmartMeter3Ct
});
//# sourceMappingURL=SmartMeter3Ct.js.map
