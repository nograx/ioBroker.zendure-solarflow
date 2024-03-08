/* eslint-disable @typescript-eslint/indent */
import { scheduleJob } from "node-schedule";
import { ZendureSolarflow } from "../main";
import { connectMqttClient } from "./mqttService";
import { getDeviceList, login } from "./webService";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { calculateEnergy, resetTodaysValues } from "./calculationService";

export const startReloginAndResetValuesJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.resetValuesJob = scheduleJob("0 0 * * *", () => {
    // Relogin at night to get a fresh accessToken!
    adapter.log.info(`[startReloginAndResetValuesJob] Refreshing accessToken!`);

    if (adapter.mqttClient) {
      adapter.mqttClient.end();
      adapter.mqttClient = undefined;
    }

    if (adapter.config.userName && adapter.config.password) {
      login(adapter)?.then((_accessToken: string) => {
        adapter.accessToken = _accessToken;
        adapter.lastLogin = new Date();
        adapter.connected = true;

        connectMqttClient(adapter);
      });
    }

    // Reset Values
    resetTodaysValues(adapter);
  });
};

export const startCalculationJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.calculationJob = scheduleJob("*/10 * * * * *", () => {
    adapter.deviceList.forEach((device) => {
      calculateEnergy(adapter, device.productKey, device.deviceKey);
    });
  });
};

export const startCheckStatesJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  // Check for states that has no updates in the last 5 minutes and set them to 0
  const statesToReset: string[] = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower",
  ];

  adapter.checkStatesJob = scheduleJob("*/10 * * * *", async () => {
    getDeviceList(adapter)
      .then((deviceList: ISolarFlowDeviceDetails[]) => {
        deviceList.forEach(async (device: ISolarFlowDeviceDetails) => {
          const lastUpdate = await adapter?.getStateAsync(
            device.productKey + "." + device.deviceKey + ".lastUpdate",
          );

          const tenMinutesAgo = Date.now() / 1000 - 10 * 60; // Ten minutes ago

          if (
            lastUpdate &&
            lastUpdate.val &&
            Number(lastUpdate.val) < tenMinutesAgo
          ) {
            adapter.log.debug(
              `[checkStatesJob] Last update for deviceKey ${
                device.deviceKey
              } was at ${new Date(
                Number(lastUpdate),
              )}, checking for pseudo power values!`,
            );
            // State was not updated in the last 10 minutes... set states to 0
            await statesToReset.forEach(async (stateName: string) => {
              await adapter?.setStateAsync(
                device.productKey + "." + device.deviceKey + "." + stateName,
                0,
                true,
              );
            });

            // set electricLevel from deviceList
            if (device.electricity) {
              await adapter?.setStateAsync(
                device.productKey + "." + device.deviceKey + ".electricLevel",
                device.electricity,
                true,
              );
            }
          }
        });
      })
      .catch(() => {
        adapter.log?.error(
          "[checkStatesJob] Retrieving device failedRetrieving device failed!",
        );
      });
  });
};
