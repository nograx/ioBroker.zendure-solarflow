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
var adapterService_exports = {};
__export(adapterService_exports, {
  checkVoltage: () => checkVoltage,
  updateSolarFlowState: () => updateSolarFlowState
});
module.exports = __toCommonJS(adapterService_exports);
const updateSolarFlowState = async (adapter, productKey, deviceKey, state, val) => {
  adapter == null ? void 0 : adapter.setStateAsync(`${productKey}.${deviceKey}.${state}`, val, true);
};
const checkVoltage = async (adapter, productKey, deviceKey, voltage) => {
  if (voltage < 46.1) {
    if (adapter.config.useCalculation) {
      adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.calculations.soc`,
        0,
        true
      );
      const energyWhState = await adapter.getStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWh`
      );
      const energyWhMaxState = await adapter.getStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWhMax`
      );
      const newMax = Number(energyWhMaxState == null ? void 0 : energyWhMaxState.val) - Number(energyWhState == null ? void 0 : energyWhState.val);
      adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWhMax`,
        newMax,
        true
      );
      adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWh`,
        0,
        true
      );
    }
    if (adapter.config.useLowVoltageBlock) {
      adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        true,
        true
      );
    }
  } else if (voltage >= 48) {
    if (adapter.config.useLowVoltageBlock) {
      adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        false,
        true
      );
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkVoltage,
  updateSolarFlowState
});
//# sourceMappingURL=adapterService.js.map
