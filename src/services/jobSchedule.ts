/* eslint-disable @typescript-eslint/indent */
import { scheduleJob } from "node-schedule";
import { ZendureSolarflow } from "../main";
import { connectMqttClient } from "./mqttService";
import { login } from "./webService";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { calculateEnergy, resetTodaysValues } from "./calculationService";

const refreshAccessToken = (adapter: ZendureSolarflow): void => {
  // Relogin every 3 hours to get a fresh accessToken!
  adapter.log.info(`[startRefreshAccessTokenTimerJob] Refreshing accessToken!`);

  if (adapter.mqttClient) {
    adapter.mqttClient.end();
    adapter.mqttClient = undefined;
  }

  if (adapter.config.userName && adapter.config.password) {
    login(adapter)?.then((_accessToken: string) => {
      adapter.accessToken = _accessToken;
      adapter.lastLogin = new Date();
      adapter.setState("info.connection", true, true);

      connectMqttClient(adapter);
    });
  }
};

export const startRefreshAccessTokenTimerJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.refreshAccessTokenInterval = adapter.setInterval(
    () => {
      refreshAccessToken(adapter);
    },
    3 * 60 * 60 * 1000,
  );
};

export const startResetValuesJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.resetValuesJob = scheduleJob("5 0 0 * * *", () => {
    // Reset Values
    resetTodaysValues(adapter);
  });
};

export const startCalculationJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.calculationJob = scheduleJob("*/30 * * * * *", () => {
    adapter.deviceList.forEach((device) => {
      calculateEnergy(adapter, device.productKey, device.deviceKey);
    });
  });
};

export const startCheckStatesAndConnectionJob = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  // Check for states that has no updates in the last 5 minutes and set them to 0
  const statesToReset: string[] = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower",
  ];

  let refreshAccessTokenNeeded = false;

  adapter.checkStatesJob = scheduleJob("*/10 * * * *", async () => {
    adapter.deviceList.forEach(async (device: ISolarFlowDeviceDetails) => {
      if (refreshAccessTokenNeeded) {
        return;
      }

      const lastUpdate = await adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".lastUpdate",
      );

      const wifiState = await adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".wifiState",
      );

      const fiveMinutesAgo = Date.now() / 1000 - 5 * 60; // Five minutes ago
      const tenMinutesAgo = Date.now() / 1000 - 10 * 60; // Ten minutes ago

      if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < fiveMinutesAgo &&
        wifiState?.val == "Connected"
      ) {
        adapter.log.debug(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate),
          )}, device seems to be online - so maybe connection is broken - reconnect!`,
        );

        refreshAccessToken(adapter);

        // set marker, so we discontinue the forEach Loop because of reconnect!
        refreshAccessTokenNeeded = true;
      }

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
  });
};
