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
var deleteCalculationStates_exports = {};
__export(deleteCalculationStates_exports, {
  deleteCalculationStates: () => deleteCalculationStates
});
module.exports = __toCommonJS(deleteCalculationStates_exports);
const deleteCalculationStates = async (adapter, productKey, deviceKey) => {
  const stateNames = [
    "energyWhMax",
    "energyWh",
    "soc",
    "remainOutTime",
    "remainInputTime",
    "outputHomeEnergyTodaykWh",
    "outputHomeEnergyTodayWh",
    "packInputEnergyTodaykWh",
    "packInputEnergyTodayWh",
    "outputPackEnergyTodaykWh",
    "outputPackEnergyTodayWh",
    "solarInputEnergyTodaykWh",
    "solarInputEnergyTodayWh"
  ];
  stateNames.forEach(async (stateName) => {
    const key = productKey + "." + deviceKey + ".calculations." + stateName;
    if (await adapter.objectExists(key)) {
      await (adapter == null ? void 0 : adapter.deleteStateAsync(key));
    }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteCalculationStates
});
//# sourceMappingURL=deleteCalculationStates.js.map
