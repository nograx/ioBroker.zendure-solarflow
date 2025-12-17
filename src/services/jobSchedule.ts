/* eslint-disable @typescript-eslint/indent */
import { scheduleJob } from "node-schedule";
import { ZendureSolarflow } from "../main";

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
    adapter.zenHaDeviceList.forEach((device) => {
      device.resetValuesForDevice();
    });
  });
};

export const startCalculationJob = async (
  adapter: ZendureSolarflow
): Promise<void> => {
  adapter.calculationJob = scheduleJob("*/30 * * * * *", () => {
    adapter.zenHaDeviceList.forEach((device) => {
      if (device.productKey != "s3Xk4x") {
        device.calculateEnergy();
      }
    });
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
    "pvPower1",
    "pvPower2",
    "pvPower3",
    "pvPower4",
    "packPower",
  ];

  let refreshAccessTokenNeeded = false;

  adapter.log.debug(
    `[checkStatesJob] Starting check of states and connection!`
  );

  adapter.checkStatesJob = scheduleJob("*/5 * * * *", async () => {
    adapter.zenHaDeviceList.forEach(async (device) => {
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
      const tenMinutesAgo = (Date.now() / 1000 - 10 * 60) * 1000; // Thirty minutes ago

      if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < tenMinutesAgo &&
        wifiState?.val == "Connected" &&
        adapter.config.connectionMode == "authKey"
      ) {
        adapter.log.debug(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate.val)
          )}, device seems to be online - so maybe connection is broken!`
        );

        //await adapter.delay(20 * 1000);
        //adapter.restart();

        // set marker, so we discontinue the forEach Loop because of reconnect!
        refreshAccessTokenNeeded = true;
      } else if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < tenMinutesAgo &&
        wifiState?.val == "Connected" &&
        adapter.config.connectionMode == "local"
      ) {
        adapter.log.warn(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate.val)
          )}, set Wifi state to Disconnected!`
        );

        device?.updateSolarFlowState("wifiState", "Disconnected");
      }

      if (
        lastUpdate &&
        lastUpdate.val &&
        Number(lastUpdate.val) < fiveMinutesAgo &&
        !refreshAccessTokenNeeded
      ) {
        adapter.log.debug(
          `[checkStatesJob] Last update for deviceKey ${
            device.deviceKey
          } was at ${new Date(
            Number(lastUpdate.val)
          )}, checking for pseudo power values!`
        );
        // State was not updated in the last 5 minutes... set states to 0
        await statesToReset.forEach(async (stateName: string) => {
          await adapter?.setState(
            device.productKey + "." + device.deviceKey + "." + stateName,
            0,
            true
          );
        });
      }
    });
  });
};
