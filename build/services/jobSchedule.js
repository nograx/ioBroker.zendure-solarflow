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
  startCheckStatesJob: () => startCheckStatesJob,
  startReloginAndResetValuesJob: () => startReloginAndResetValuesJob
});
module.exports = __toCommonJS(jobSchedule_exports);
var import_node_schedule = require("node-schedule");
var import_mqttService = require("./mqttService");
var import_webService = require("./webService");
var import_calculationService = require("./calculationService");
const startReloginAndResetValuesJob = async (adapter) => {
  adapter.resetValuesJob = (0, import_node_schedule.scheduleJob)("0 0 * * *", () => {
    var _a;
    adapter.log.debug(`Refreshing accessToken!`);
    if (adapter.config.userName && adapter.config.password) {
      (_a = (0, import_webService.login)(adapter)) == null ? void 0 : _a.then((_accessToken) => {
        adapter.accessToken = _accessToken;
        adapter.lastLogin = /* @__PURE__ */ new Date();
        adapter.connected = true;
        (0, import_mqttService.connectMqttClient)(adapter);
      });
    }
    (0, import_calculationService.resetTodaysValues)(adapter);
  });
};
const startCheckStatesJob = async (adapter) => {
  const statesToReset = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower"
  ];
  adapter.checkStatesJob = (0, import_node_schedule.scheduleJob)("*/10 * * * *", async () => {
    (0, import_webService.getDeviceList)(adapter).then((deviceList) => {
      deviceList.forEach(async (device) => {
        const lastUpdate = await (adapter == null ? void 0 : adapter.getStateAsync(
          device.productKey + "." + device.deviceKey + ".lastUpdate"
        ));
        const tenMinutesAgo = Date.now() / 1e3 - 10 * 60;
        if (lastUpdate && lastUpdate.val && Number(lastUpdate.val) < tenMinutesAgo) {
          adapter.log.debug(
            `Last update for deviceKey ${device.deviceKey} was at ${new Date(
              Number(lastUpdate)
            )}, checking for pseudo power values!`
          );
          await statesToReset.forEach(async (stateName) => {
            await (adapter == null ? void 0 : adapter.setStateAsync(
              device.productKey + "." + device.deviceKey + "." + stateName,
              0,
              true
            ));
          });
          await (adapter == null ? void 0 : adapter.setStateAsync(
            device.productKey + "." + device.deviceKey + ".electricLevel",
            device.electricity,
            true
          ));
        }
      });
    }).catch(() => {
      var _a;
      (_a = adapter.log) == null ? void 0 : _a.error("Retrieving device failed!");
      return null;
    });
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startCheckStatesJob,
  startReloginAndResetValuesJob
});
//# sourceMappingURL=jobSchedule.js.map
