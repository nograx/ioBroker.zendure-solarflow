import { ZendureSolarflow } from "../main";

/* eslint-disable @typescript-eslint/indent */

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string,
): Promise<void> => {
  adapter?.setStateAsync(`${productKey}.${deviceKey}.${state}`, val, true);
};

export const checkVoltage = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  voltage: number,
): Promise<void> => {
  if (voltage < 46.1) {
    if (adapter.config.useCalculation) {
      // Set SOC to 0
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.soc`,
        0,
        true,
      );

      // Calculate new Wh Max Value
      const energyWhState = await adapter.getStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWh`,
      );
      const energyWhMaxState = await adapter.getStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWhMax`,
      );

      const newMax = Number(energyWhMaxState?.val) - Number(energyWhState?.val);

      // Set Max Energy to value minus current energy
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWhMax`,
        newMax,
        true,
      );

      // Set Energy in Battery to 0
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.calculations.energyWh`,
        0,
        true,
      );
    }

    if (adapter.config.useLowVoltageBlock) {
      // Activate Low Voltage Block
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        true,
        true,
      );
    }
  } else if (voltage >= 48.0) {
    if (adapter.config.useLowVoltageBlock) {
      // Deactivate Low Voltage Block
      adapter?.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        false,
        true,
      );
    }
  }
};
