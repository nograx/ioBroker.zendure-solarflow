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
var paths_exports = {};
__export(paths_exports, {
  pathsEu: () => pathsEu,
  pathsGlobal: () => pathsGlobal
});
module.exports = __toCommonJS(paths_exports);
const hostname = `app.zendure.tech`;
const versionGlobal = `v2`;
const versionEu = `eu`;
const solarFlowDevRegisterPath = `developer/api/apply`;
const solarFlowTokenPath = `auth/app/token`;
const solarFlowDeviceListPath = `productModule/device/queryDeviceListByConsumerId`;
const pathsGlobal = {
  solarFlowDevRegisterUrl: `https://${hostname}/${versionGlobal}/${solarFlowDevRegisterPath}`,
  solarFlowTokenUrl: `https://${hostname}/${versionGlobal}/${solarFlowTokenPath}`,
  solarFlowQueryDeviceListUrl: `https://${hostname}/${versionGlobal}/${solarFlowDeviceListPath}`,
  mqttUrl: "mq.zen-iot.com",
  mqttPort: 1883,
  mqttPassword: "b0sjUENneTZPWnhk"
};
const pathsEu = {
  solarFlowDevRegisterUrl: `https://${hostname}/${versionEu}/${solarFlowDevRegisterPath}`,
  solarFlowTokenUrl: `https://${hostname}/${versionEu}/${solarFlowTokenPath}`,
  solarFlowQueryDeviceListUrl: `https://${hostname}/${versionEu}/${solarFlowDeviceListPath}`,
  mqttUrl: "mqtteu.zen-iot.com",
  mqttPort: 1883,
  mqttPassword: "SDZzJGo5Q3ROYTBO"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pathsEu,
  pathsGlobal
});
//# sourceMappingURL=paths.js.map
