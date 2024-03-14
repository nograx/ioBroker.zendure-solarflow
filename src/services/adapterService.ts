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

export const checkDevicesServer = async (adapter: ZendureSolarflow) => {
  const channels = await adapter.getChannelsAsync();

  channels.forEach(async (channel) => {
    if (channel._id) {
      const splitted = channel._id.split(".");
      if (splitted.length == 4) {
        const productKey = splitted[2];
        const deviceKey = splitted[3];

        const currentServerState = await adapter.getStateAsync(`${productKey}.${deviceKey}.registeredServer`);

        if (currentServerState && currentServerState.val && currentServerState.val != adapter.config.server) {
          adapter.log.warn(`Device with ProductKey '${productKey}' and DeviceKey '${deviceKey}' was configured on server '${currentServerState.val}', but adapter is configured to use server '${adapter.config.server}'! No data will be available!`)
        }
      }
    }
  })
}
