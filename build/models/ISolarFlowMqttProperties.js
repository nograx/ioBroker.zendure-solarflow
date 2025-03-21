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
var ISolarFlowMqttProperties_exports = {};
__export(ISolarFlowMqttProperties_exports, {
  knownMqttProps: () => knownMqttProps
});
module.exports = __toCommonJS(ISolarFlowMqttProperties_exports);
const knownMqttProps = [
  "electricLevel",
  "packData",
  "packState",
  "pass",
  "passMode",
  "autoRecover",
  "outputHomePower",
  "outputLimit",
  "buzzerSwitch",
  "outputPackPower",
  "packInputPower",
  "solarInputPower",
  "pvPower1",
  "pvPower2",
  "solarPower1",
  "solarPower2",
  "remainOutTime",
  "remainInputTime",
  "socSet",
  "minSoc",
  "pvBrand",
  "inverseMaxPower",
  "wifiState",
  "hubState",
  "sn",
  "inputLimit",
  "gridInputPower",
  "acOutputPower",
  "acSwitch",
  "dcSwitch",
  "autoModel",
  "dcOutputPower",
  "packNum",
  "gridPower",
  "energyPower",
  "batteryElectric",
  "acMode",
  "hyperTmp",
  "autoModel",
  "heatState"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  knownMqttProps
});
//# sourceMappingURL=ISolarFlowMqttProperties.js.map
