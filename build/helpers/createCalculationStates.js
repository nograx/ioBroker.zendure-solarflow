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
var createCalculationStates_exports = {};
__export(createCalculationStates_exports, {
  createCalculationStates: () => createCalculationStates
});
module.exports = __toCommonJS(createCalculationStates_exports);
const createCalculationStates = async (adapter, productKey, deviceKey, type) => {
  if (type == "aio" || type == "hyper" || type == "ace" || type == "solarflow") {
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.calculations.gridInputEnergyTodayWh`,
      {
        type: "state",
        common: {
          name: {
            de: "Heutige Ladung per AC (Wh)",
            en: "Charged by AC (Wh)"
          },
          type: "number",
          desc: "gridInputEnergyTodayWh",
          role: "value.energy",
          read: true,
          write: false,
          unit: "Wh"
        },
        native: {}
      }
    ));
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.calculations.gridInputEnergyTodaykWh`,
      {
        type: "state",
        common: {
          name: {
            de: "Heutige Ladung per AC (kWh)",
            en: "Charged by AC (kWh)"
          },
          type: "number",
          desc: "gridInputEnergyTodaykWh",
          role: "value.energy",
          read: true,
          write: false,
          unit: "kWh"
        },
        native: {}
      }
    ));
  }
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag (Wh)",
          en: "Todays solar input (Wh)"
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag (kWh)",
          en: "Todays solar input (kWh)"
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV1 (Wh)",
          en: "Todays solar input PV1 (Wh)"
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV1 (kWh)",
          en: "Todays solar input PV1 (kWh)"
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV2 (Wh)",
          en: "Todays solar input PV2 (Wh)"
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV2 (kWh)",
          en: "Todays solar input PV2 (kWh)"
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.outputPackEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zu Batterie (Wh)",
          en: "Todays charge energy to battery (Wh)"
        },
        type: "number",
        desc: "outputPackEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.outputPackEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zur Batterie (kWh)",
          en: "todays charge energy to battery (kWh)"
        },
        type: "number",
        desc: "outputPackEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.packInputEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung aus Batterie (Wh)",
          en: "Todays discharge energy from battery (Wh)"
        },
        type: "number",
        desc: "packInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.packInputEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung aus Batterie (kWh)",
          en: "Todays discharge energy from battery (kWh)"
        },
        type: "number",
        desc: "packInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.outputHomeEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung ins Haus (Wh)",
          en: "Todays input energy to home (Wh)"
        },
        type: "number",
        desc: "outputHomeEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.outputHomeEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung ins Haus (kWh)",
          en: "Todays input energy to home (kWh)"
        },
        type: "number",
        desc: "outputHomeEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.remainInputTime`,
    {
      type: "state",
      common: {
        name: {
          de: "Erwartete Ladedauer (hh:mm)",
          en: "remaining charge time (hh:mm)"
        },
        type: "string",
        desc: "calcRemainInputTime",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.remainOutTime`,
    {
      type: "state",
      common: {
        name: {
          de: "Erwartete Entladedauer (hh:mm)",
          en: "remaining discharge time (hh:mm)"
        },
        type: "string",
        desc: "calcRemainOutTime",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.calculations.soc`, {
    type: "state",
    common: {
      name: {
        de: "Ladezustand in % (der nutzbaren Energie)",
        en: "State of Charge % (of usable energy)"
      },
      type: "number",
      desc: "soc",
      role: "value",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.energyWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Nutzbare Energie in den Batterien (Wh)",
          en: "Usable energy in battery (Wh)"
        },
        type: "number",
        desc: "energyWh",
        role: "value",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObject(
    `${productKey}.${deviceKey}.calculations.energyWhMax`,
    {
      type: "state",
      common: {
        name: {
          de: "Max. nutzbare Energie in allen Batterien (Wh)",
          en: "Max. usable energy in battery (Wh)"
        },
        type: "number",
        desc: "energyWhMax",
        role: "value",
        read: true,
        write: true,
        unit: "Wh"
      },
      native: {}
    }
  ));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCalculationStates
});
//# sourceMappingURL=createCalculationStates.js.map
