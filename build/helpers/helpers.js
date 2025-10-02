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
var helpers_exports = {};
__export(helpers_exports, {
  createDeviceModel: () => createDeviceModel
});
module.exports = __toCommonJS(helpers_exports);
var import_Ace1500 = require("../models/deviceModels/Ace1500");
var import_Aio2400 = require("../models/deviceModels/Aio2400");
var import_Hyper2000 = require("../models/deviceModels/Hyper2000");
var import_Sf2400Ac = require("../models/deviceModels/Sf2400Ac");
var import_Sf800 = require("../models/deviceModels/Sf800");
var import_SfHub1200 = require("../models/deviceModels/SfHub1200");
var import_SfHub2000 = require("../models/deviceModels/SfHub2000");
const createDeviceModel = (_adapter, _productKey, _deviceKey, _zenHaDeviceDetails) => {
  switch (_productKey.toLowerCase()) {
    case "73bktv":
      return new import_SfHub1200.SfHub1200(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 1200",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 1200",
        _zenHaDeviceDetails
      );
    case "a8yh63":
      return new import_SfHub2000.SfHub2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 2000",
        _zenHaDeviceDetails
      );
    case "ywf7hv":
      return new import_Aio2400.Aio2400(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "AIO 2400",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "AIO 2400",
        _zenHaDeviceDetails
      );
    case "ja72u0ha":
      return new import_Hyper2000.Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "gda3tb":
      return new import_Hyper2000.Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "b3dxda":
      return new import_Hyper2000.Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "8bm93h":
      return new import_Ace1500.Ace1500(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Ace 1500",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Ace 1500",
        _zenHaDeviceDetails
      );
    case "bc8b7f":
      return new import_Sf2400Ac.Sf2400Ac(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Solarflow 2400 AC",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 2400 AC",
        _zenHaDeviceDetails
      );
    case "a4ss5P":
      return new import_Sf800.Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    case "b1nhmc":
      return new import_Sf800.Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    case "R3mn8U":
      return new import_Sf800.Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    default:
      return void 0;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createDeviceModel
});
//# sourceMappingURL=helpers.js.map
