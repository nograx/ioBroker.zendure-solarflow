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
  createDeviceModel: () => createDeviceModel,
  findProductByMdnsModelName: () => findProductByMdnsModelName
});
module.exports = __toCommonJS(helpers_exports);
var import_Ace1500 = require("../models/deviceModels/Ace1500");
var import_Aio2400 = require("../models/deviceModels/Aio2400");
var import_Hyper2000 = require("../models/deviceModels/Hyper2000");
var import_Sf1600AcPlus = require("../models/deviceModels/Sf1600AcPlus");
var import_Sf2400Ac = require("../models/deviceModels/Sf2400Ac");
var import_Sf2400AcPlus = require("../models/deviceModels/Sf2400AcPlus");
var import_Sf2400Pro = require("../models/deviceModels/Sf2400Pro");
var import_Sf3000MixAcPlus = require("../models/deviceModels/Sf3000MixAcPlus");
var import_Sf4000MixAcPlus = require("../models/deviceModels/Sf4000MixAcPlus");
var import_Sf4000MixPro = require("../models/deviceModels/Sf4000MixPro");
var import_Sf800 = require("../models/deviceModels/Sf800");
var import_Sf800Plus = require("../models/deviceModels/Sf800Plus");
var import_Sf800Pro = require("../models/deviceModels/Sf800Pro");
var import_SfHub1200 = require("../models/deviceModels/SfHub1200");
var import_SfHub2000 = require("../models/deviceModels/SfHub2000");
var import_SmartMeter3Ct = require("../models/deviceModels/SmartMeter3Ct");
var import_SmartMeterD0 = require("../models/deviceModels/SmartMeterD0");
const deviceDefinitions = [
  {
    productKeys: ["73bktv"],
    productModel: "HUB 1200",
    ctor: import_SfHub1200.SfHub1200
  },
  {
    productKeys: ["a8yh63"],
    productModel: "HUB 2000",
    ctor: import_SfHub2000.SfHub2000
  },
  {
    productKeys: ["ywf7hv"],
    productModel: "AIO 2400",
    ctor: import_Aio2400.Aio2400
  },
  {
    productKeys: ["ja72u0ha", "b3dxda", "gda3tb"],
    productModel: "Hyper 2000",
    ctor: import_Hyper2000.Hyper2000
  },
  {
    productKeys: ["8bm93h"],
    productModel: "Ace 1500",
    ctor: import_Ace1500.Ace1500
  },
  {
    productKeys: ["64174u", "65174u"],
    productModel: "Solarflow 1600 AC+",
    ctor: import_Sf1600AcPlus.Sf1600AcPlus,
    mdnsModelNames: ["solarflow1600acplus"]
  },
  {
    productKeys: ["5fg27j"],
    productModel: "Solarflow 2400 AC+",
    ctor: import_Sf2400AcPlus.Sf2400AcPlus,
    mdnsModelNames: ["solarflow2400acplus"]
  },
  {
    productKeys: ["bc8b7f"],
    productModel: "Solarflow 2400 AC",
    ctor: import_Sf2400Ac.Sf2400Ac,
    mdnsModelNames: ["solarflow2400ac"]
  },
  {
    productKeys: ["2qe7c9"],
    productModel: "Solarflow 2400 Pro",
    ctor: import_Sf2400Pro.Sf2400Pro,
    mdnsModelNames: ["solarflow2400pro"]
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow4000mixpro"],
    productModel: "Solarflow 4000 Mix Pro",
    ctor: import_Sf4000MixPro.Sf4000MixPro,
    mdnsModelNames: ["solarflow4000mixpro"]
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow3000mixacplus"],
    productModel: "Solarflow 3000 Mix AC+",
    ctor: import_Sf3000MixAcPlus.Sf3000MixAcPlus,
    mdnsModelNames: ["solarflow3000mixacplus"]
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow4000mixacplus"],
    productModel: "Solarflow 4000 Mix AC+",
    ctor: import_Sf4000MixAcPlus.Sf4000MixAcPlus,
    mdnsModelNames: ["solarflow4000mixacplus"]
  },
  {
    productKeys: ["a4ss5p", "b1nhmc"],
    productModel: "Solarflow 800",
    ctor: import_Sf800.Sf800,
    mdnsModelNames: ["solarflow800"]
  },
  {
    productKeys: ["r3mn8u"],
    productModel: "Solarflow 800 Pro",
    ctor: import_Sf800Pro.Sf800Pro,
    mdnsModelNames: ["solarflow800pro"]
  },
  {
    productKeys: ["nvyeqm"],
    productModel: "Solarflow 800 Pro 2",
    ctor: import_Sf800Pro.Sf800Pro
  },
  {
    productKeys: ["8n77v3"],
    productModel: "Solarflow 800 Plus",
    ctor: import_Sf800Plus.Sf800Plus,
    mdnsModelNames: ["solarflow800plus"]
  },
  {
    // No cloud productKey known for this accessory - it's only ever created via mDNS auto-discovery.
    productKeys: ["smartmeter3ct"],
    productModel: "Smart Meter 3CT",
    ctor: import_SmartMeter3Ct.SmartMeter3Ct,
    mdnsModelNames: ["smartmeter3ct"]
  },
  {
    // No cloud productKey known for this accessory - it's only ever created via mDNS auto-discovery.
    productKeys: ["smartmeterd0"],
    productModel: "Smart Meter D0",
    ctor: import_SmartMeterD0.SmartMeterD0,
    mdnsModelNames: ["meterreader"]
  }
];
function findDeviceDefinitionByProductKey(productKey) {
  const normalizedProductKey = productKey.toLowerCase();
  return deviceDefinitions.find((definition) => definition.productKeys.includes(normalizedProductKey));
}
const createDeviceModel = (_adapter, _productKey, _deviceKey, _zenHaDeviceDetails) => {
  var _a, _b;
  const definition = findDeviceDefinitionByProductKey(_productKey);
  if (!definition) {
    return void 0;
  }
  const productModel = (_a = _zenHaDeviceDetails == null ? void 0 : _zenHaDeviceDetails.productModel) != null ? _a : definition.productModel;
  const deviceName = (_b = _zenHaDeviceDetails == null ? void 0 : _zenHaDeviceDetails.deviceName) != null ? _b : definition.productModel;
  _adapter.log.debug(`[onReady] Creating deviceModel ${definition.productModel} ${_productKey}`);
  return new definition.ctor(_adapter, _productKey, _deviceKey, productModel, deviceName, _zenHaDeviceDetails);
};
function findProductByMdnsModelName(normalizedMdnsModelName) {
  const definition = deviceDefinitions.find((d) => {
    var _a;
    return (_a = d.mdnsModelNames) == null ? void 0 : _a.includes(normalizedMdnsModelName);
  });
  if (!definition) {
    return void 0;
  }
  return { productKey: definition.productKeys[0], productModel: definition.productModel };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createDeviceModel,
  findProductByMdnsModelName
});
//# sourceMappingURL=helpers.js.map
