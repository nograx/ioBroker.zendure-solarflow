/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

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

  const newValue =
    stateKey == "outputPack"
      ? Number(currentEnergyState?.val) + value
      : Number(currentEnergyState?.val) - value;

  adapter?.setStateAsync(
    productKey + "." + deviceKey + ".calculations.energyWh",
    newValue,
    true,
  );

  if (currentEnergyMaxState) {
    const soc = (newValue / Number(currentEnergyMaxState.val)) * 100;
    adapter?.setStateAsync(
      productKey + "." + deviceKey + ".calculations.soc",
      soc,
      true,
    );

    if (newValue > Number(currentEnergyMaxState.val)) {
      // Extend maxVal
      adapter?.setStateAsync(
        productKey + "." + deviceKey + ".calculations.energyWhMax",
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
  stateKey: string, // e.g. packInput, outputHome, outputPack, solarInput
  state: ioBroker.State,
): Promise<void> => {
  const stateNameWh =
    productKey +
    "." +
    deviceKey +
    ".calculations." +
    stateKey +
    "EnergyTodayWh";

  const stateNamekWh =
    productKey +
    "." +
    deviceKey +
    ".calculations." +
    stateKey +
    "EnergyTodaykWh";
  const currentState = await adapter?.getStateAsync(stateNameWh);

  if (currentState?.val == 0) {
    // Workaround, set Val to very low value to avoid Jump in data...
    adapter?.setStateAsync(stateNameWh, 0.000001, true);
  } else if (
    currentState &&
    currentState.lc &&
    state.val != undefined &&
    state.val != null
  ) {
    const timeFrame = state.lc - currentState?.lc;

    const addValue = (Number(state.val) * timeFrame) / 3600000; // Wh
    const newValue = Number(currentState.val) + addValue;

    adapter?.setStateAsync(stateNameWh, newValue, true);
    adapter?.setStateAsync(
      stateNamekWh,
      Number((newValue / 1000).toFixed(2)),
      true,
    );

    // SOC and energy in batteries
    if (stateKey == "outputPack" || stateKey == "packInput") {
      calculateSocAndEnergy(adapter, productKey, deviceKey, stateKey, addValue);
    }
  } else {
    adapter?.setStateAsync(stateNameWh, 0, true);
    adapter?.setStateAsync(stateNamekWh, 0, true);
  }
};

export const resetTodaysValues = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
    const names = ["packInput", "outputHome", "outputPack", "solarInput"];

    names.forEach((name: string) => {
      const stateNameWh =
        device.productKey +
        "." +
        device.deviceKey +
        ".calculations." +
        name +
        "EnergyTodayWh";
      const stateNamekWh =
        device.productKey +
        "." +
        device.deviceKey +
        ".calculations." +
        name +
        "EnergyTodaykWh";

      adapter?.setStateAsync(stateNameWh, 0, true);
      adapter?.setStateAsync(stateNamekWh, 0, true);
    });
  });
};
