"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var jobSchedule_exports = {};
__export(jobSchedule_exports, {
  startCalculationJob: () => startCalculationJob,
  startCheckStatesAndConnectionJob: () => startCheckStatesAndConnectionJob,
  startRefreshAccessTokenTimerJob: () => startRefreshAccessTokenTimerJob,
  startResetValuesJob: () => startResetValuesJob
});
module.exports = __toCommonJS(jobSchedule_exports);
var import_node_schedule = require("node-schedule");
const startRefreshAccessTokenTimerJob = async (adapter) => {
  adapter.refreshAccessTokenInterval = adapter.setInterval(
    async () => {
      adapter.log.info(
        `Refresh Access Token - Adapter will restart in 20 seconds!`
      );
      await adapter.delay(20 * 1e3);
      adapter.restart();
    },
    3 * 60 * 60 * 1e3
  );
};
const startResetValuesJob = async (adapter) => {
  adapter.resetValuesJob = (0, import_node_schedule.scheduleJob)("5 0 0 * * *", () => {
    adapter.zenHaDeviceList.forEach((device) => {
      device.resetValuesForDevice();
    });
  });
};
const startCalculationJob = async (adapter) => {
  adapter.calculationJob = (0, import_node_schedule.scheduleJob)("*/30 * * * * *", () => {
    adapter.zenHaDeviceList.forEach((device) => {
      if (device.productKey != "s3Xk4x") {
        device.calculateEnergy();
      }
    });
  });
};
const startCheckStatesAndConnectionJob = async (adapter) => {
  const statesToReset = [
    "outputHomePower",
    "outputPackPower",
    "gridInputPower",
    "packInputPower",
    "solarInputPower",
    "packPower"
  ];
  let refreshAccessTokenNeeded = false;
  adapter.log.debug(
    `[checkStatesJob] Starting check of states and connection!`
  );
  adapter.checkStatesJob = (0, import_node_schedule.scheduleJob)("*/5 * * * *", async () => {
    adapter.zenHaDeviceList.forEach(async (device) => {
      if (refreshAccessTokenNeeded) {
        return;
      }
      const lastUpdate = await (adapter == null ? void 0 : adapter.getStateAsync(
        device.productKey + "." + device.deviceKey + ".lastUpdate"
      ));
      const wifiState = await (adapter == null ? void 0 : adapter.getStateAsync(
        device.productKey + "." + device.deviceKey + ".wifiState"
      ));
      const fiveMinutesAgo = (Date.now() / 1e3 - 5 * 60) * 1e3;
      const tenMinutesAgo = (Date.now() / 1e3 - 10 * 60) * 1e3;
      if (lastUpdate && lastUpdate.val && Number(lastUpdate.val) < tenMinutesAgo && (wifiState == null ? void 0 : wifiState.val) == "Connected" && adapter.config.connectionMode == "authKey") {
        adapter.log.warn(
          `[checkStatesJob] Last update for deviceKey ${device.deviceKey} was at ${new Date(
            Number(lastUpdate)
          )}, device seems to be online - so maybe connection is broken - restart adapter in 20 seconds!`
        );
        await adapter.delay(20 * 1e3);
        adapter.restart();
        refreshAccessTokenNeeded = true;
      } else if (lastUpdate && lastUpdate.val && Number(lastUpdate.val) < tenMinutesAgo && (wifiState == null ? void 0 : wifiState.val) == "Connected" && adapter.config.connectionMode == "local") {
        adapter.log.warn(
          `[checkStatesJob] Last update for deviceKey ${device.deviceKey} was at ${new Date(
            Number(lastUpdate)
          )}, set Wifi state to Disconnected!`
        );
        device == null ? void 0 : device.updateSolarFlowState("wifiState", "Disconnected");
      }
      if (lastUpdate && lastUpdate.val && Number(lastUpdate.val) < fiveMinutesAgo && !refreshAccessTokenNeeded) {
        adapter.log.debug(
          `[checkStatesJob] Last update for deviceKey ${device.deviceKey} was at ${new Date(
            Number(lastUpdate)
          )}, checking for pseudo power values!`
        );
        await statesToReset.forEach(async (stateName) => {
          await (adapter == null ? void 0 : adapter.setState(
            device.productKey + "." + device.deviceKey + "." + stateName,
            0,
            true
          ));
        });
      }
    });
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startRefreshAccessTokenTimerJob,
  startResetValuesJob
});
//# sourceMappingURL=jobSchedule.js.map
