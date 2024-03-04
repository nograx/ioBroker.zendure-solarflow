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
  createSolarFlowStates: () => createSolarFlowStates
});
module.exports = __toCommonJS(createSolarFlowStates_exports);
var import_createCalculationStates = require("./createCalculationStates");
var import_createControlStates = require("./createControlStates");
var import_deleteCalculationStates = require("./deleteCalculationStates");
const createSolarFlowStates = async (adapter, productKey, deviceKey) => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey, {
    type: "device",
    common: {
      name: { de: "Produkt " + productKey, en: "Product " + productKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations",
    {
      type: "channel",
      common: {
        name: {
          de: "Berechnungen f\xFCr Ger\xE4t " + deviceKey,
          en: "Calculations for Device " + deviceKey
        }
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey + "." + deviceKey + ".packData", {
    type: "channel",
    common: {
      name: {
        de: "Akku Packs",
        en: "Battery packs"
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".lastUpdate",
    {
      type: "state",
      common: {
        name: { de: "Letztes Update", en: "Last Update" },
        type: "number",
        desc: "lastUpdate",
        role: "value.time",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".electricLevel",
    {
      type: "state",
      common: {
        name: { de: "SOC Gesamtsystem", en: "SOC of the system" },
        type: "number",
        desc: "electricLevel",
        role: "value.battery",
        read: true,
        write: false,
        unit: "%"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputHomePower",
    {
      type: "state",
      common: {
        name: { de: "Ausgangsleistung", en: "output power" },
        type: "number",
        desc: "outputHomePower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputLimit",
    {
      type: "state",
      common: {
        name: { de: "Limit der Ausgangsleistung", en: "limit of output power" },
        type: "number",
        desc: "outputLimit",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputPackPower",
    {
      type: "state",
      common: {
        name: { de: "Ladeleistung zum Akku", en: "charge power" },
        type: "number",
        desc: "outputPackPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".packInputPower",
    {
      type: "state",
      common: {
        name: { de: "Entladeleistung zum Akku", en: "discharge power" },
        type: "number",
        desc: "packInputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".solarInputPower",
    {
      type: "state",
      common: {
        name: { de: "Leistung der Solarmodule", en: "solar power" },
        type: "number",
        desc: "solarInputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".pvPower1",
    {
      type: "state",
      common: {
        name: { de: "Leistung PV 1", en: "solar power channel 1" },
        type: "number",
        desc: "pvPower1",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".pvPower2",
    {
      type: "state",
      common: {
        name: { de: "Leistung PV 2", en: "solar power channel 2" },
        type: "number",
        desc: "pvPower2",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".remainInputTime",
    {
      type: "state",
      common: {
        name: { de: "Erwartete Ladedauer", en: "remaining charge time" },
        type: "number",
        desc: "remainInputTime",
        role: "value.interval",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".remainOutTime",
    {
      type: "state",
      common: {
        name: {
          de: "Erwartete Entladedauer (Minuten)",
          en: "remaining discharge time (minutes)"
        },
        type: "number",
        desc: "remainOutTime",
        role: "value.interval",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".socSet",
    {
      type: "state",
      common: {
        name: { de: "Max. SOC", en: "max. SOC" },
        type: "number",
        desc: "socSet",
        role: "value.battery",
        read: true,
        write: false,
        unit: "%"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".minSoc",
    {
      type: "state",
      common: {
        name: { de: "Min. SOC", en: "min. SOC" },
        type: "number",
        desc: "minSoc",
        role: "value.battery",
        read: true,
        write: false,
        unit: "%"
      },
      native: {}
    }
  ));
  adapter == null ? void 0 : adapter.subscribeStates(
    productKey + "." + deviceKey + ".solarInputPower"
  );
  adapter == null ? void 0 : adapter.subscribeStates(
    productKey + "." + deviceKey + ".outputPackPower"
  );
  adapter == null ? void 0 : adapter.subscribeStates(
    productKey + "." + deviceKey + ".packInputPower"
  );
  adapter == null ? void 0 : adapter.subscribeStates(
    productKey + "." + deviceKey + ".outputHomePower"
  );
  await (0, import_createControlStates.createControlStates)(adapter, productKey, deviceKey);
  if (adapter.config.useCalculation) {
    await (0, import_createCalculationStates.createCalculationStates)(adapter, productKey, deviceKey);
  } else {
    await (0, import_deleteCalculationStates.deleteCalculationStates)(adapter, productKey, deviceKey);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowStates
});
//# sourceMappingURL=createSolarFlowStates.js.map
