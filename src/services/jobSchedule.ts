/* eslint-disable @typescript-eslint/indent */
import { scheduleJob } from "node-schedule";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { calculateEnergy, resetTodaysValues } from "./calculationService";

export const startRefreshAccessTokenTimerJob = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  // Restart adapter every 3 hours
  adapter.refreshAccessTokenInterval = adapter.setInterval(
    async () => {
      adapter.log.info(
        `Refresh Access Token - Adapter will restart in 20 seconds!`
      );

      await adapter.delay(20 * 1000);
      adapter.restart();
    },
    3 * 60 * 60 * 1000
  );
};

export const startResetValuesJob = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  adapter.resetValuesJob = scheduleJob("5 0 0 * * *", () => {
    // Reset Values
    resetTodaysValues(adapter);
  });
};

export const startCalculationJob = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  adapter.calculationJob = scheduleJob("*/30 * * * * *", () => {
    if (adapter.config.server == "local") {
      if (
        adapter.config.localDevice1ProductKey &&
        adapter.config.localDevice1DeviceKey
      ) {
        calculateEnergy(
          adapter,
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey
        );
      }

      if (
        adapter.config.localDevice2ProductKey &&
        adapter.config.localDevice2DeviceKey
      ) {
        calculateEnergy(
          adapter,
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey
        );
      }

      if (
        adapter.config.localDevice3ProductKey &&
        adapter.config.localDevice3DeviceKey
      ) {
        calculateEnergy(
          adapter,
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey
        );
      }

      if (
        adapter.config.localDevice4ProductKey &&
        adapter.config.localDevice4DeviceKey
      ) {
        calculateEnergy(
          adapter,
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey
        );
      }
    } else {
      adapter.deviceList.forEach((device) => {
        if (device.productKey != "s3Xk4x") {
          calculateEnergy(adapter, device.productKey, device.deviceKey);

          // Check if connected with ACE, then calculate also for ACE device
          if (device.packList && device.packList.length > 0) {
            device.packList.forEach(async (subDevice) => {
              if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
                calculateEnergy(
                  adapter,
                  subDevice.productKey,
                  subDevice.deviceKey
                );
              }
            });
          }
        }
      });
    }
  });
};

export const startCheckStatesAndConnectionJob = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  // Check for states that has no updates in the last 5 minutes and set them to 0
  const statesToReset: string[] = [
    "outputHomePower",
    "outputPackPower",
    "gridInputPower",
    "packInputPower",
    "solarInputPower",
  ];

  let refreshAccessTokenNeeded = false;

  adapter.log.debug(
    `[checkStatesJob] Starting check of states and connection!`
  );

  adapter.checkStatesJob = scheduleJob("*/5 * * * *", async () => {
    adapter.deviceList.forEach(async (device: ISolarFlowDeviceDetails) => {
      if (refreshAccessTokenNeeded) {
        return;
      }

      const lastUpdate = await adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".lastUpdate"
      );

      const wifiState = await adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".wifiState"
      );

      const fiveMinutesAgo = (Date.now() / 1000 - 5 * 60) * 1000; // Five minutes ago
      const tenMinutesAgo = (Date.now() / 1000 - 10 * 60) * 1000; // Ten minutes ago

      if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < fiveMinutesAgo &&
        wifiState?.val == "Connected"
      ) {
        adapter.log.warn(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate)
          )}, device seems to be online - so maybe connection is broken - restart adapter in 20 seconds!`
        );

        await adapter.delay(20 * 1000);
        adapter.restart();

        // set marker, so we discontinue the forEach Loop because of reconnect!
        refreshAccessTokenNeeded = true;
      }

      if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < tenMinutesAgo &&
        !refreshAccessTokenNeeded
      ) {
        adapter.log.debug(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate)
          )}, checking for pseudo power values!`
        );
        // State was not updated in the last 10 minutes... set states to 0
        await statesToReset.forEach(async (stateName: string) => {
          await adapter?.setState(
            device.productKey + "." + device.deviceKey + "." + stateName,
            0,
            true
          );
        });

        // set electricLevel from deviceList
        if (device.electricity) {
          await adapter?.setState(
            device.productKey + "." + device.deviceKey + ".electricLevel",
            device.electricity,
            true
          );
        }
      }
    });
  });
};
