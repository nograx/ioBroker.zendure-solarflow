/* eslint-disable @typescript-eslint/indent */

import { toHoursAndMinutes } from "../helpers/timeHelper";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

const calculationStateKeys = [
  "packInput",
  "outputHome",
  "outputPack",
  "solarInput",
];

export const setEnergyWhMax = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  const currentEnergyState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh",
  );

  if (currentEnergyState) {
    await adapter?.setStateAsync(
      `${productKey}.${deviceKey}.calculations.energyWhMax`,
      currentEnergyState?.val,
      true,
    );
  }
};

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
    adapter?.setState(
      `${productKey}.${deviceKey}.calculations.energyWh`,
      newValue,
      true,
    );

    if (currentEnergyMaxState) {
      const soc = Number(
        ((newValue / Number(currentEnergyMaxState.val)) * 100).toFixed(1),
      );

      await adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.soc`,
        soc > 100.0 ? 100 : soc,
        true,
      );

      if (newValue > Number(currentEnergyMaxState.val)) {
        // Extend maxVal
        await adapter?.setStateAsync(
          `${productKey}.${deviceKey}.calculations.energyWhMax`,
          newValue,
          true,
        );
      }

      const currentOutputPackPower = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.outputPackPower`,
      );

      const currentPackInputPower = await adapter?.getStateAsync(
        productKey + "." + deviceKey + ".packInputPower",
      );

      if (stateKey == "outputPack" && currentOutputPackPower?.val) {
        // Charging, calculate remaining charging time
        const toCharge = Number(currentEnergyMaxState.val) - newValue;

        const remainHoursAsDecimal = toCharge / Number(currentOutputPackPower.val);
        const remainFormatted = toHoursAndMinutes(remainHoursAsDecimal * 60);

        await adapter?.setStateAsync(
          `${productKey}.${deviceKey}.calculations.remainInputTime`,
          remainFormatted,
          true,
        );
      } else if (stateKey == "packInput" && currentPackInputPower) {
        // Discharging, calculate remaining discharge time
        const remainHoursAsDecimal = newValue / Number(currentPackInputPower.val);
        const remainFormatted = toHoursAndMinutes(remainHoursAsDecimal * 60);

        await adapter?.setStateAsync(
          `${productKey}.${deviceKey}.calculations.remainOutTime`,
          remainFormatted,
          true,
        );
      }
    } else {
      await adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWhMax`,
        newValue,
        true,
      );
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
      await adapter?.setStateAsync(stateNameEnergyWh, 0.000001, true);
    } else if (
      currentEnergyState &&
      currentEnergyState.lc &&
      currentPowerState &&
      currentPowerState.val != undefined &&
      currentPowerState.val != null
    ) {
      // Timeframe = 30000ms, Job runs every 30 seconds...
      const timeFrame = 30000;

      // Calculate Energy value (Wh) from current power in the timeframe from last run...
      let addEnergyValue =
        (Number(currentPowerState.val) * timeFrame) / 3600000; // Wh

      // Use efficiency factor (used the one from Youtube Channel VoltAmpereLux - thanks!)
      const chargingFactor = 0.96; // Efficiency 96%
      const dischargingFactor = 1.08 - addEnergyValue / 10000; // Efficiency 92% - 98% (92% + Energy / 10000 = 600W -> +6%)

      // Calculate energy from efficiency factor if value for charging or discharging
      addEnergyValue =
        stateKey == "outputPack" && addEnergyValue > 0
          ? addEnergyValue * chargingFactor
          : addEnergyValue;
      addEnergyValue =
        stateKey == "packInput" && addEnergyValue > 0
          ? addEnergyValue * dischargingFactor
          : addEnergyValue;

      let newEnergyValue = Number(currentEnergyState.val) + addEnergyValue;

      // Fix negative value
      if (newEnergyValue < 0) {
        newEnergyValue = 0;
      }

      await adapter?.setStateAsync(stateNameEnergyWh, newEnergyValue, true);
      await adapter?.setStateAsync(
        stateNameEnergykWh,
        Number((newEnergyValue / 1000).toFixed(2)),
        true,
      );

      // SOC and energy in batteries
      if (
        (stateKey == "outputPack" || stateKey == "packInput") &&
        addEnergyValue > 0
      ) {
        await calculateSocAndEnergy(
          adapter,
          productKey,
          deviceKey,
          stateKey,
          addEnergyValue,
        );
      }
    } else {
      await adapter?.setStateAsync(stateNameEnergyWh, 0, true);
      await adapter?.setStateAsync(stateNameEnergykWh, 0, true);
    }
  });
};

export const resetTodaysValues = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
    calculationStateKeys.forEach(async (stateKey: string) => {
      const stateNameEnergyWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
      const stateNameEnergykWh = `${device.productKey}.${device.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;

      await adapter?.setStateAsync(stateNameEnergyWh, 0, true);
      await adapter?.setStateAsync(stateNameEnergykWh, 0, true);
    });
  });
};
