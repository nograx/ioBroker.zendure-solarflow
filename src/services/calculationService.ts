/* eslint-disable @typescript-eslint/indent */

import { toHoursAndMinutes } from "../helpers/timeHelper";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

const calculationStateKeys = [
  "packInput",
  "outputHome",
  "outputPack",
  "outputPack",
  "solarInput",
  "gridInput",
  "pvPower1",
  "pvPower2",
];

export const setEnergyWhMax = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  const currentEnergyState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh"
  );

  if (currentEnergyState) {
    await adapter?.setState(
      `${productKey}.${deviceKey}.calculations.energyWhMax`,
      currentEnergyState?.val,
      true
    );
  }
};

export const setSocToZero = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  // Set SOC to 0
  await adapter?.setState(
    `${productKey}.${deviceKey}.calculations.soc`,
    0,
    true
  );

  // Calculate new Wh Max Value
  const energyWhState = await adapter.getStateAsync(
    `${productKey}.${deviceKey}.calculations.energyWh`
  );
  const energyWhMaxState = await adapter.getStateAsync(
    `${productKey}.${deviceKey}.calculations.energyWhMax`
  );

  const newMax = Number(energyWhMaxState?.val) - Number(energyWhState?.val);

  // Set Max Energy to value minus current energy
  await adapter?.setState(
    `${productKey}.${deviceKey}.calculations.energyWhMax`,
    newMax,
    true
  );

  // Set Energy in Battery to 0
  await adapter?.setState(
    `${productKey}.${deviceKey}.calculations.energyWh`,
    0,
    true
  );
};

export const calculateSocAndEnergy = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  stateKey: string,
  value: number
): Promise<void> => {
  adapter.log.debug(
    `[calculateSocAndEnergy] Calculating for: ${productKey}.${deviceKey} and stateKey ${stateKey}!`
  );

  let energyWhMax: number | undefined = undefined;

  const minSoc = (
    await adapter.getStateAsync(`${productKey}.${deviceKey}.minSoc`)
  )?.val;
  const currentSoc = (
    await adapter.getStateAsync(`${productKey}.${deviceKey}.electricLevel`)
  )?.val;

  if (currentSoc && minSoc && Number(currentSoc) < Number(minSoc)) {
    // Don't calculate if current SOC is lower then minimum
    adapter.log.debug(
      `[calculateSocAndEnergy] Don't calculate, currentSoc (${Number(currentSoc)}) is lower than minSoc (${Number(minSoc)})!`
    );

    return;
  }

  const currentEnergyState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh"
  );

  const currentEnergyMaxState = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWhMax"
  );

  const lowVoltageBlock = await adapter?.getStateAsync(
    productKey + "." + deviceKey + ".control.lowVoltageBlock"
  );

  const currentMaxValue = Number(
    currentEnergyMaxState ? currentEnergyMaxState.val : 0
  );

  const currentEnergyWh = currentEnergyState?.val
    ? Number(currentEnergyState?.val)
    : 0;

  const batteries = adapter.pack2Devices.filter(
    (x) => x.deviceKey == deviceKey
  );

  if (productKey == "yWF7hV") {
    // The device is an AIO 2400, so set maximum Wh to 2400!
    energyWhMax = 2400;
  } else {
    // Iterate over all batteries!
    for (let i = 0; i < batteries.length; i++) {
      if (batteries[i].type == "AB1000") {
        energyWhMax = (energyWhMax ? energyWhMax : 0) + 960;
      } else if (batteries[i].type == "AB2000") {
        energyWhMax = (energyWhMax ? energyWhMax : 0) + 1920;
      }
    }
  }

  // newValue is the current available energy in the batteries. If outputPack (charging) add value, if packInput (discharging) subtract value.
  let newEnergyWh =
    stateKey == "outputPack"
      ? currentEnergyWh + value
      : currentEnergyWh - value;

  // If greater than Max of batteries, set it to this value.
  if (
    stateKey == "outputPack" &&
    energyWhMax != undefined &&
    newEnergyWh > energyWhMax
  ) {
    newEnergyWh = energyWhMax;

    adapter.log.debug(
      `[calculateSocAndEnergy] newEnergyWh (${newEnergyWh}) is greater than energyWhMax (${energyWhMax}), don't extend value!`
    );
  }

  if (newEnergyWh > 0) {
    adapter?.setState(
      `${productKey}.${deviceKey}.calculations.energyWh`,
      newEnergyWh,
      true
    );

    adapter.log.debug(
      `[calculateSocAndEnergy] set '${productKey}.${deviceKey}.calculations.energyWh' to ${newEnergyWh}!`
    );

    if (currentEnergyMaxState) {
      const soc = Number(((newEnergyWh / currentMaxValue) * 100).toFixed(1));

      await adapter?.setState(
        `${productKey}.${deviceKey}.calculations.soc`,
        soc > 100.0 ? 100 : soc,
        true
      );

      if (newEnergyWh > currentMaxValue && !lowVoltageBlock?.val) {
        // Extend maxVal
        await adapter?.setState(
          `${productKey}.${deviceKey}.calculations.energyWhMax`,
          newEnergyWh,
          true
        );
      }

      const currentOutputPackPower = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.outputPackPower`
      );

      const currentPackInputPower = await adapter?.getStateAsync(
        productKey + "." + deviceKey + ".packInputPower"
      );

      if (
        stateKey == "outputPack" &&
        currentOutputPackPower?.val != null &&
        currentOutputPackPower != undefined
      ) {
        // Charging, calculate remaining charging time
        const toCharge = currentMaxValue - newEnergyWh;

        const remainHoursAsDecimal =
          toCharge / Number(currentOutputPackPower.val);

        if (remainHoursAsDecimal < 48.0) {
          const remainFormatted = toHoursAndMinutes(
            Math.round(remainHoursAsDecimal * 60)
          );

          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainInputTime`,
            remainFormatted,
            true
          );
        } else {
          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainInputTime`,
            "",
            true
          );
        }
      } else if (
        stateKey == "packInput" &&
        currentPackInputPower != null &&
        currentPackInputPower != undefined
      ) {
        // Discharging, calculate remaining discharge time
        const remainHoursAsDecimal =
          newEnergyWh / Number(currentPackInputPower.val);
        const remainFormatted = toHoursAndMinutes(
          Math.round(remainHoursAsDecimal * 60)
        );

        if (remainHoursAsDecimal < 48.0) {
          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainOutTime`,
            remainFormatted,
            true
          );
        } else {
          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainOutTime`,
            "",
            true
          );
        }
      }
    }
  } else if (newEnergyWh <= 0 && stateKey == "outputPack") {
    await adapter?.setState(
      `${productKey}.${deviceKey}.calculations.remainInputTime`,
      "",
      true
    );
  } else if (newEnergyWh <= 0 && stateKey == "packInput") {
    await adapter?.setState(
      `${productKey}.${deviceKey}.calculations.remainOutTime`,
      "",
      true
    );

    // TEST: if SOC == 0, add newValue as positive to energyWhMax
    const newEnergyWhPositive = Math.abs(newEnergyWh);

    if (energyWhMax && currentMaxValue + newEnergyWhPositive <= energyWhMax) {
      await adapter?.setState(
        `${productKey}.${deviceKey}.calculations.energyWhMax`,
        currentMaxValue + newEnergyWhPositive,
        true
      );
    }
  }
};

/**
 * Calculates the energy for all items in 'calculationStateKeys'.
 *
 * @param adapter - The core adapter object
 * @param productKey - The productKey of the device
 * @param deviceKey - The device individual key
 * @returns Promise<void>
 *
 * @beta
 */
export const calculateEnergy = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  calculationStateKeys.forEach(async (stateKey) => {
    let stateNameEnergyWh = "";
    let stateNameEnergykWh = "";
    let stateNamePower = "";

    if (stateKey == "pvPower1") {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
      stateNamePower = `${productKey}.${deviceKey}.pvPower1`;
    } else if (stateKey == "pvPower2") {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
      stateNamePower = `${productKey}.${deviceKey}.pvPower2`;
    } else {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
      stateNamePower = `${productKey}.${deviceKey}.${stateKey}Power`;
    }

    const currentPowerState = await adapter?.getStateAsync(stateNamePower);
    const currentEnergyState = await adapter?.getStateAsync(stateNameEnergyWh);

    if (currentEnergyState?.val == 0) {
      // Workaround, set Val to very low value to avoid Jump in data...
      await adapter?.setState(stateNameEnergyWh, 0.000001, true);
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
      const addEnergyValue =
        (Number(currentPowerState.val) * timeFrame) / 3600000; // Wh

      /*       // Use efficiency factor (used the one from Youtube Channel VoltAmpereLux - thanks!)
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
          : addEnergyValue; */

      let newEnergyValue = Number(currentEnergyState.val) + addEnergyValue;

      // Fix negative value
      if (newEnergyValue < 0) {
        newEnergyValue = 0;
      }

      await adapter?.setState(stateNameEnergyWh, newEnergyValue, true);
      await adapter?.setState(
        stateNameEnergykWh,
        Number((newEnergyValue / 1000).toFixed(2)),
        true
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
          addEnergyValue
        );
      } else {
        if (stateKey == "outputPack") {
          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainInputTime`,
            "",
            true
          );
        } else if (stateKey == "packInput") {
          await adapter?.setState(
            `${productKey}.${deviceKey}.calculations.remainOutTime`,
            "",
            true
          );
        }
      }
    } else {
      await adapter?.setState(stateNameEnergyWh, 0, true);
      await adapter?.setState(stateNameEnergykWh, 0, true);
    }
  });
};

const resetValuesForDevice = (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
) => {
  calculationStateKeys.forEach(async (stateKey: string) => {
    let stateNameEnergyWh = "";
    let stateNameEnergykWh = "";

    if (stateKey == "pvPower1") {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
    } else if (stateKey == "pvPower2") {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
    } else {
      stateNameEnergyWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodayWh`;
      stateNameEnergykWh = `${productKey}.${deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
    }

    await adapter?.setState(stateNameEnergyWh, 0, true);
    await adapter?.setState(stateNameEnergykWh, 0, true);
  });
};

export const resetTodaysValues = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  if (adapter.config.server == "local") {
    if (
      adapter.config.localDevice1ProductKey &&
      adapter.config.localDevice1DeviceKey
    ) {
      resetValuesForDevice(
        adapter,
        adapter.config.localDevice1ProductKey,
        adapter.config.localDevice1DeviceKey
      );
    }

    if (
      adapter.config.localDevice2ProductKey &&
      adapter.config.localDevice2DeviceKey
    ) {
      resetValuesForDevice(
        adapter,
        adapter.config.localDevice2ProductKey,
        adapter.config.localDevice2DeviceKey
      );
    }

    if (
      adapter.config.localDevice3ProductKey &&
      adapter.config.localDevice3DeviceKey
    ) {
      resetValuesForDevice(
        adapter,
        adapter.config.localDevice3ProductKey,
        adapter.config.localDevice3DeviceKey
      );
    }

    if (
      adapter.config.localDevice4ProductKey &&
      adapter.config.localDevice4DeviceKey
    ) {
      resetValuesForDevice(
        adapter,
        adapter.config.localDevice4ProductKey,
        adapter.config.localDevice4DeviceKey
      );
    }
  } else {
    adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
      resetValuesForDevice(adapter, device.productKey, device.deviceKey);

      if (device.packList && device.packList.length > 0) {
        device.packList.forEach(async (subDevice) => {
          if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
            resetValuesForDevice(
              adapter,
              subDevice.productKey,
              subDevice.deviceKey
            );
          }
        });
      }
    });
  }
};
