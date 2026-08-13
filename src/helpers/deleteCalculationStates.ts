import type { ZendureSolarflow } from "../main";

export const deleteCalculationStates = (adapter: ZendureSolarflow, productKey: string, deviceKey: string): void => {
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
    "solarInputEnergyTodayWh",
  ];

  stateNames.forEach(async (stateName) => {
    const key = `${productKey}.${deviceKey}.calculations.${stateName}`;
    if (await adapter.objectExists(key)) {
      await adapter?.deleteStateAsync(key);
    }
  });
};
