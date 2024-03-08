/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

const calculationStateKeys = [
  "packInput",
  "outputHome",
  "outputPack",
  "solarInput",
];

export const calculateSocAndEnergy = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  stateKey: string,
  value: number,
): Promise<void> => {
  const currentEnergyState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh",
  );

  const currentEnergyMaxState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWhMax",
  );

  const currentValue = currentEnergyState?.val
    ? Number(currentEnergyState?.val)
    : 0;

  const newValue =
    stateKey == "outputPack" ? currentValue + value : currentValue - value;

  if (newValue > 0) {
    adapter?.setStateAsync(
      `${productKey}.${deviceKey}.calculations.energyWh`,
      newValue,
      true,
    );

    if (currentEnergyMaxState) {
      const soc = (newValue / Number(currentEnergyMaxState.val)) * 100;
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.soc`,
        soc,
        true,
      );

      if (newValue > Number(currentEnergyMaxState.val)) {
        // Extend maxVal
        adapter?.setStateAsync(
          `${productKey}.${deviceKey}.calculations.energyWhMax`,
          newValue,
          true,
        );
      }
    }
  }
};

export const calculateEnergy = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  calculationStateKeys.forEach(async (stateKey) => {
    const stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodayWh`;
    const stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
    const stateNamePower = `${productKey}.${deviceKey}.${stateKey}Power`;

    const currentPowerState = await adapter?.getStateAsync(stateNamePower);
    const currentEnergyState = await adapter?.getStateAsync(stateNameEnergyWh);

    if (currentEnergyState?.val == 0) {
      // Workaround, set Val to very low value to avoid Jump in data...
      adapter?.setStateAsync(stateNameEnergyWh, 0.000001, true);
    } else if (
      currentEnergyState &&
      currentEnergyState.lc &&
      currentPowerState &&
      currentPowerState.val != undefined &&
      currentPowerState.val != null
    ) {
      const timeFrame = Date.now() - currentEnergyState?.lc;

      /*       console.log(
        `LC = ${currentEnergyState?.lc}, DateNow / 1000 = ${
          Date.now() / 1000
        } / DIFF = ${timeFrame}`,
      ); */

      const addValue = (Number(currentPowerState.val) * timeFrame) / 3600000; // Wh
      let newValue = Number(currentEnergyState.val) + addValue;

      // Fix negative value
      if (newValue < 0) {
        newValue = 0;
      }

      adapter?.setStateAsync(stateNameEnergyWh, newValue, true);
      adapter?.setStateAsync(
        stateNameEnergykWh,
        Number((newValue / 1000).toFixed(2)),
        true,
      );

      // SOC and energy in batteries
      if (stateKey == "outputPack" || stateKey == "packInput") {
        calculateSocAndEnergy(
          adapter,
          productKey,
          deviceKey,
          stateKey,
          addValue,
        );
      }
    } else {
      adapter?.setStateAsync(stateNameEnergyWh, 0, true);
      adapter?.setStateAsync(stateNameEnergykWh, 0, true);
    }
  });
};

export const resetTodaysValues = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
    calculationStateKeys.forEach((stateKey: string) => {
      const stateNameEnergyWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
      const stateNameEnergykWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;

      adapter?.setStateAsync(stateNameEnergyWh, 0, true);
      adapter?.setStateAsync(stateNameEnergykWh, 0, true);
    });
  });
};
