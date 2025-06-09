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
var import_helpers = require("./helpers");
const createSolarFlowLocalStates = async (adapter, productKey, deviceKey) => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  const productName = (0, import_helpers.getProductNameFromProductKey)(productKey);
  if (productName == "") {
    adapter.log.error(
      `[createSolarFlowLocalStates] Unknown product (${productKey}/${deviceKey}). We cannot create control states! Please contact the developer!`
    );
    return;
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
  if (productName == null ? void 0 : productName.toLowerCase().includes("smart plug")) {
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
  const states = (0, import_createSolarFlowStates.getStateDefinition)(productName);
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
  await (0, import_createControlStates.createControlStates)(adapter, productKey, deviceKey, productName);
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
    await (0, import_createCalculationStates.createCalculationStates)(adapter, productKey, deviceKey);
  } else {
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowLocalStates
});
//# sourceMappingURL=createSolarFlowLocalStates.js.map
