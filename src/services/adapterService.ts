import { ZendureSolarflow } from "../main";
import { setSocToZero } from "./calculationService";
import { setOutputLimit } from "./mqttService";

/* eslint-disable @typescript-eslint/indent */

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string | boolean,
): Promise<void> => {
  await adapter?.setStateAsync(`${productKey}.${deviceKey}.${state}`, val, true);
};

export const checkVoltage = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  voltage: number,
): Promise<void> => {
  if (voltage < 46.1) {
    if (adapter.config.useCalculation) {
      setSocToZero(adapter, productKey,deviceKey);
    }

    if (adapter.config.useLowVoltageBlock) {
      // Activate Low Voltage Block
      await adapter?.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        true,
        true,
      );

      // Low Voltage Block activated, stop power input immediately
      setOutputLimit(adapter, productKey, deviceKey, 0);
    }
  } else if (voltage >= 48.0) {
    if (adapter.config.useLowVoltageBlock) {
      // Deactivate Low Voltage Block
      await adapter?.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        false,
        true,
      );
    }
  }
};

export const checkDevicesServer = async (adapter: ZendureSolarflow): Promise<void> => {
  const channels = await adapter.getChannelsAsync();

  channels.forEach(async (channel) => {
    if (channel._id) {
      const splitted = channel._id.split(".");
      if (splitted.length == 4) {
        const productKey = splitted[2];
        const deviceKey = splitted[3];

        const currentServerState = await adapter.getStateAsync(
          `${productKey}.${deviceKey}.registeredServer`,
        );

        if (
          currentServerState &&
          currentServerState.val &&
          currentServerState.val != adapter.config.server
        ) {
          adapter.log.warn(
            `Device with ProductKey '${productKey}' and DeviceKey '${deviceKey}' was configured on server '${currentServerState.val}', but adapter is configured to use server '${adapter.config.server}'! No data will be available!`,
          );
        }
      }
    }
  });
};
