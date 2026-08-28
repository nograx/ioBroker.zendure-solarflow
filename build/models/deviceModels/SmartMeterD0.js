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
var SmartMeterD0_exports = {};
__export(SmartMeterD0_exports, {
  SmartMeterD0: () => SmartMeterD0
});
module.exports = __toCommonJS(SmartMeterD0_exports);
var import_ZenIobDevice = require("./ZenIobDevice");
class SmartMeterD0 extends import_ZenIobDevice.ZenIobDevice {
  isZenSdkSupported = true;
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(_adapter, _productKey, _deviceKey, _productName, _deviceName, true, _zenHaDeviceDetails);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SmartMeterD0
});
//# sourceMappingURL=SmartMeterD0.js.map
