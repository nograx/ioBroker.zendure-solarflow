import { ZendureSolarflow } from "../main";

/* eslint-disable @typescript-eslint/indent */

export const deleteCalculationStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
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
    const key = productKey + "." + deviceKey + ".calculations." + stateName;
    if (await adapter.objectExists(key)) {
      await adapter?.deleteStateAsync(key);
    }
  });
};
