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
var adapterService_exports = {};
__export(adapterService_exports, {
  checkDevicesServer: () => checkDevicesServer,
  checkVoltage: () => checkVoltage,
  updateSolarFlowControlState: () => updateSolarFlowControlState,
  updateSolarFlowState: () => updateSolarFlowState
});
module.exports = __toCommonJS(adapterService_exports);
var import_calculationService = require("./calculationService");
var import_mqttService = require("./mqttService");
const updateSolarFlowState = async (adapter, productKey, deviceKey, state, val) => {
  await (adapter == null ? void 0 : adapter.setStateAsync(
    `${productKey}.${deviceKey}.${state}`,
    val,
    true
  ));
};
const updateSolarFlowControlState = async (adapter, productKey, deviceKey, state, val) => {
  await (adapter == null ? void 0 : adapter.setStateAsync(
    `${productKey}.${deviceKey}.control.${state}`,
    val,
    true
  ));
};
const checkVoltage = async (adapter, productKey, deviceKey, voltage) => {
  if (voltage < 46.1) {
    if (adapter.config.useCalculation) {
      (0, import_calculationService.setSocToZero)(adapter, productKey, deviceKey);
    }
    if (adapter.config.useLowVoltageBlock) {
      await (adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        true,
        true
      ));
      (0, import_mqttService.setOutputLimit)(adapter, productKey, deviceKey, 0);
    }
  } else if (voltage >= 48) {
    if (adapter.config.useLowVoltageBlock) {
      await (adapter == null ? void 0 : adapter.setStateAsync(
        `${productKey}.${deviceKey}.control.lowVoltageBlock`,
        false,
        true
      ));
    }
  }
};
const checkDevicesServer = async (adapter) => {
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
        if (currentServerState && currentServerState.val && currentServerState.val != adapter.config.server) {
          adapter.log.warn(
            `Device with ProductKey '${productKey}' and DeviceKey '${deviceKey}' was configured on server '${currentServerState.val}', but adapter is configured to use server '${adapter.config.server}'! No data will be available!`
          );
        }
      }
    }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkDevicesServer,
  checkVoltage,
  updateSolarFlowControlState,
  updateSolarFlowState
});
//# sourceMappingURL=adapterService.js.map
