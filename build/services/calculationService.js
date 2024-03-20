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
var calculationService_exports = {};
__export(calculationService_exports, {
  calculateEnergy: () => calculateEnergy,
  calculateSocAndEnergy: () => calculateSocAndEnergy,
  resetTodaysValues: () => resetTodaysValues,
  setEnergyWhMax: () => setEnergyWhMax
});
module.exports = __toCommonJS(calculationService_exports);
const calculationStateKeys = [
  "packInput",
  "outputHome",
  "outputPack",
  "solarInput"
];
const setEnergyWhMax = async (adapter, productKey, deviceKey) => {
  const currentEnergyState = await (adapter == null ? void 0 : adapter.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh"
  ));
  if (currentEnergyState) {
    await (adapter == null ? void 0 : adapter.setStateAsync(
      `${productKey}.${deviceKey}.calculations.energyWhMax`,
      currentEnergyState == null ? void 0 : currentEnergyState.val,
      true
    ));
  }
};
const calculateSocAndEnergy = async (adapter, productKey, deviceKey, stateKey, value) => {
  const currentEnergyState = await (adapter == null ? void 0 : adapter.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh"
  ));
  const currentEnergyMaxState = await (adapter == null ? void 0 : adapter.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWhMax"
  ));
  const currentValue = (currentEnergyState == null ? void 0 : currentEnergyState.val) ? Number(currentEnergyState == null ? void 0 : currentEnergyState.val) : 0;
  const newValue = stateKey == "outputPack" ? currentValue + value : currentValue - value;
  if (newValue > 0) {
    adapter == null ? void 0 : adapter.setState(
      `${productKey}.${deviceKey}.calculations.energyWh`,
      newValue,
      true
    );
    if (currentEnergyMaxState) {
      const soc = Number((newValue / Number(currentEnergyMaxState.val) * 100).toFixed(1));
      await (adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.calculations.soc`,
        soc,
        true
      ));
      if (newValue > Number(currentEnergyMaxState.val)) {
        await (adapter == null ? void 0 : adapter.setStateAsync(
          `${productKey}.${deviceKey}.calculations.energyWhMax`,
          newValue,
          true
        ));
      }
    }
  }
};
const calculateEnergy = async (adapter, productKey, deviceKey) => {
  calculationStateKeys.forEach(async (stateKey) => {
    const stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodayWh`;
    const stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
    const stateNamePower = `${productKey}.${deviceKey}.${stateKey}Power`;
    const currentPowerState = await (adapter == null ? void 0 : adapter.getStateAsync(stateNamePower));
    const currentEnergyState = await (adapter == null ? void 0 : adapter.getStateAsync(stateNameEnergyWh));
    if ((currentEnergyState == null ? void 0 : currentEnergyState.val) == 0) {
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergyWh, 1e-6, true));
    } else if (currentEnergyState && currentEnergyState.lc && currentPowerState && currentPowerState.val != void 0 && currentPowerState.val != null) {
      const timeFrame = 3e4;
      const addValue = Number(currentPowerState.val) * timeFrame / 36e5;
      let newValue = Number(currentEnergyState.val) + addValue;
      if (newValue < 0) {
        newValue = 0;
      }
      const chargingFactor = 0.96;
      const dischargingFactor = 1.08 - newValue / 1e4;
      newValue = stateKey == "outputPack" && newValue > 0 ? newValue * chargingFactor : newValue;
      newValue = stateKey == "packInput" && newValue > 0 ? newValue * dischargingFactor : newValue;
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergyWh, newValue, true));
      await (adapter == null ? void 0 : adapter.setStateAsync(
        stateNameEnergykWh,
        Number((newValue / 1e3).toFixed(2)),
        true
      ));
      if ((stateKey == "outputPack" || stateKey == "packInput") && addValue > 0) {
        await calculateSocAndEnergy(
          adapter,
          productKey,
          deviceKey,
          stateKey,
          addValue
        );
      }
    } else {
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergyWh, 0, true));
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergykWh, 0, true));
    }
  });
};
const resetTodaysValues = async (adapter) => {
  adapter.deviceList.forEach((device) => {
    calculationStateKeys.forEach(async (stateKey) => {
      const stateNameEnergyWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
      const stateNameEnergykWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergyWh, 0, true));
      await (adapter == null ? void 0 : adapter.setStateAsync(stateNameEnergykWh, 0, true));
    });
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateEnergy,
  calculateSocAndEnergy,
  resetTodaysValues,
  setEnergyWhMax
});
//# sourceMappingURL=calculationService.js.map
