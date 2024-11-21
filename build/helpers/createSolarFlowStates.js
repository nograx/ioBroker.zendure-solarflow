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
var createSolarFlowStates_exports = {};
__export(createSolarFlowStates_exports, {
  createSolarFlowStates: () => createSolarFlowStates,
  getStateDefinition: () => getStateDefinition
});
module.exports = __toCommonJS(createSolarFlowStates_exports);
var import_aceStates = require("../constants/aceStates");
var import_aioStates = require("../constants/aioStates");
var import_hubStates = require("../constants/hubStates");
var import_hyperStates = require("../constants/hyperStates");
var import_smartPlugStates = require("../constants/smartPlugStates");
var import_adapterService = require("../services/adapterService");
var import_createCalculationStates = require("./createCalculationStates");
var import_createControlStates = require("./createControlStates");
const getStateDefinition = (type) => {
  switch (type) {
    case "aio":
      return import_aioStates.aioStates;
    case "hyper":
      return import_hyperStates.hyperStates;
    case "solarflow":
      return import_hubStates.hubStates;
    case "ace":
      return import_aceStates.aceStates;
    case "smartPlug":
      return import_smartPlugStates.smartPlugStates;
    default:
      return [];
  }
};
const createSolarFlowStates = async (adapter, device, type) => {
  let productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  let deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  if (device.productKey == "s3Xk4x" && adapter && adapter.userId && device.id) {
    productKey = adapter.userId;
    deviceKey = device.id.toString();
  }
  adapter.log.debug(
    `[createSolarFlowStates] Creating or updating SolarFlow states for ${device.productName} (${productKey}/${deviceKey}) and name '${device.name}'.`
  );
  await (adapter == null ? void 0 : adapter.extendObject(productKey, {
    type: "device",
    common: {
      name: {
        de: `${device.productName} (${productKey})`,
        en: `${device.productName} (${productKey})`
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: {
        de: `${device.name} (${deviceKey})`,
        en: `${device.name} (${deviceKey})`
      }
    },
    native: {}
  }));
  if (type != "smartPlug") {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.packData`, {
      type: "channel",
      common: {
        name: {
          de: "Batterie Packs",
          en: "Battery packs"
        }
      },
      native: {}
    }));
  }
  const states = getStateDefinition(type);
  states.forEach(async (state) => {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.${state.title}`, {
      type: "state",
      common: {
        name: {
          de: state.nameDe,
          en: state.nameEn
        },
        type: state.type,
        desc: state.title,
        role: state.role,
        read: true,
        write: false,
        unit: state.unit,
        states: state.states
      },
      native: {}
    }));
  });
  if (device.electricity && type != "smartPlug") {
    await (0, import_adapterService.updateSolarFlowState)(
      adapter,
      device.productKey,
      device.deviceKey,
      "electricLevel",
      device.electricity
    );
  }
  if (device.snNumber) {
    await (0, import_adapterService.updateSolarFlowState)(
      adapter,
      productKey,
      deviceKey,
      "snNumber",
      device.snNumber.toString()
    );
  }
  if (type == "solarflow" && device._connectedWithAce != null && device._connectedWithAce != void 0) {
    await (0, import_adapterService.updateSolarFlowState)(
      adapter,
      device.productKey,
      device.deviceKey,
      "connectedWithAce",
      device._connectedWithAce
    );
  }
  await (0, import_adapterService.updateSolarFlowState)(
    adapter,
    productKey,
    deviceKey,
    "productName",
    device.productName
  );
  await (0, import_adapterService.updateSolarFlowState)(
    adapter,
    productKey,
    deviceKey,
    "wifiState",
    device.wifiStatus ? "Connected" : "Disconnected"
  );
  if (type != "smartPlug") {
    if (!adapter.config.useFallbackService) {
      await (0, import_createControlStates.createControlStates)(adapter, productKey, deviceKey, type);
    }
    if (adapter.config.useCalculation) {
      await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.calculations`, {
        type: "channel",
        common: {
          name: {
            de: "Berechnungen f\xFCr Ger\xE4t " + deviceKey,
            en: "Calculations for Device " + deviceKey
          }
        },
        native: {}
      }));
      await (0, import_createCalculationStates.createCalculationStates)(adapter, productKey, deviceKey, type);
    } else {
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowStates,
  getStateDefinition
});
//# sourceMappingURL=createSolarFlowStates.js.map
