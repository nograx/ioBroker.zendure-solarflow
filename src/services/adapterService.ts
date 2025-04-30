import { ZendureSolarflow } from "../main";
import { setSocToZero } from "./calculationService";
import { setDischargeLimit, setOutputLimit } from "./mqttService";

/* eslint-disable @typescript-eslint/indent */

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string | boolean
): Promise<void> => {
  await adapter?.setState(`${productKey}.${deviceKey}.${state}`, val, true);
};

export const updateSolarFlowControlState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string | boolean
): Promise<void> => {
  // First check if state exist
  const stateExist = await adapter?.objectExists(
    `${productKey}.${deviceKey}.control.${state}`
  );

  // Update the control state
  if (stateExist) {
    await adapter?.setState(
      `${productKey}.${deviceKey}.control.${state}`,
      val,
      true
    );
  }
};

export const checkVoltage = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  voltage: number
): Promise<void> => {
  if (voltage < 46.1) {
    if (adapter.config.useCalculation) {
      setSocToZero(adapter, productKey, deviceKey);
    }

    if (adapter.config.useLowVoltageBlock) {
      // Activate Low Voltage Block
      await adapter?.setState(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        true,
        true
      );

      // Low Voltage Block activated, stop power input immediately
      setOutputLimit(adapter, productKey, deviceKey, 0);

      if (adapter.config.forceShutdownOnLowVoltage) {
        const currentSoc = await adapter.getStateAsync(
          `${productKey}.${deviceKey}.electricLevel`
        );

        if (currentSoc && Number(currentSoc.val) > 50) {
          // We can't shut down the device. Full charge needed!
          if (adapter.config.fullChargeIfNeeded) {
            await adapter?.setState(
              `${productKey}.${deviceKey}.control.fullChargeNeeded`,
              true,
              true
            );
          }
        } else {
          if (currentSoc && currentSoc.val) {
            setDischargeLimit(
              adapter,
              productKey,
              deviceKey,
              Number(currentSoc.val)
            );
          }

          // Check if device setting is correct
          const hubState = await adapter.getStateAsync(
            `${productKey}.${deviceKey}.hubState`
          );

          if (!hubState || Number(hubState.val) != 1) {
            adapter.log.warn(
              `[checkVoltage] hubState is not set to 'Stop output and shut down', device will NOT go offline!`
            );
          }
        }
      }
    }
  } else if (voltage >= 47.5) {
    // Deactivate Low Voltage Block
    const lowVoltageBlock = await adapter.getStateAsync(
      `${productKey}.${deviceKey}.control.lowVoltageBlock`
    );

    if (lowVoltageBlock && lowVoltageBlock.val == true) {
      await adapter?.setState(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        false,
        true
      );

      if (adapter.config.forceShutdownOnLowVoltage) {
        setDischargeLimit(
          adapter,
          productKey,
          deviceKey,
          adapter.config.dischargeLimit ? adapter.config.dischargeLimit : 5
        );
      }
    }
  }
};

export const checkDevicesServer = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  const channels = await adapter.getChannelsAsync();

  channels.forEach(async (channel) => {
    if (channel._id) {
      const splitted = channel._id.split(".");
      if (splitted.length == 4) {
        const productKey = splitted[2];
        const deviceKey = splitted[3];

        const currentServerState = await adapter.getStateAsync(
          `${productKey}.${deviceKey}.registeredServer`
        );

        if (
          currentServerState &&
          currentServerState.val &&
          currentServerState.val != adapter.config.server
        ) {
          adapter.log.warn(
            `Device with ProductKey '${productKey}' and DeviceKey '${deviceKey}' was configured on server '${currentServerState.val}', but adapter is configured to use server '${adapter.config.server}'! No data will be available!`
          );
        }
      }
    }
  });
};
