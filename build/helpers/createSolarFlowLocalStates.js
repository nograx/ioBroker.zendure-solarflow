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
var createSolarFlowLocalStates_exports = {};
__export(createSolarFlowLocalStates_exports, {
  createSolarFlowLocalStates: () => createSolarFlowLocalStates
});
module.exports = __toCommonJS(createSolarFlowLocalStates_exports);
var import_createCalculationStates = require("./createCalculationStates");
var import_createControlStates = require("./createControlStates");
var import_createSolarFlowStates = require("./createSolarFlowStates");
const createSolarFlowLocalStates = async (adapter, productKey, deviceKey) => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  let productName = "";
  let type = "";
  switch (productKey) {
    case "73bkTV":
      productName = "Hub 1200";
      type = "solarflow";
      break;
    case "A8yh63":
      productName = "Hub 2000";
      type = "solarflow";
      break;
    case "yWF7hV":
      productName = "AIO 2400";
      type = "aio";
      break;
    case "ja72U0ha":
      productName = "Hyper 2000";
      type = "hyper";
      break;
    case "gDa3tb":
      productName = "Hyper 2000";
      type = "hyper";
      break;
    case "8bM93H":
      productName = "ACE 1500";
      type = "ace";
      break;
    default:
      break;
  }
  adapter.log.debug(
    `[createSolarFlowLocalStates] Creating or updating SolarFlow states for ${productName} (${productKey}/${deviceKey}).`
  );
  await (adapter == null ? void 0 : adapter.extendObject(productKey, {
    type: "device",
    common: {
      name: {
        de: `${productName} (${productKey})`,
        en: `${productName} (${productKey})`
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: {
        de: `Device Key ${deviceKey}`,
        en: `Device Key ${deviceKey}`
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
  const states = (0, import_createSolarFlowStates.getStateDefinition)(type);
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
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowLocalStates
});
//# sourceMappingURL=createSolarFlowLocalStates.js.map
