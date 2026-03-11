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
var enums_exports = {};
__export(enums_exports, {
  DeviceConnectionMode: () => DeviceConnectionMode
});
module.exports = __toCommonJS(enums_exports);
var DeviceConnectionMode = /* @__PURE__ */ ((DeviceConnectionMode2) => {
  DeviceConnectionMode2[DeviceConnectionMode2["CloudMqtt"] = 1] = "CloudMqtt";
  DeviceConnectionMode2[DeviceConnectionMode2["LocalMqtt"] = 2] = "LocalMqtt";
  DeviceConnectionMode2[DeviceConnectionMode2["LocalMqttWithCloudRelay"] = 3] = "LocalMqttWithCloudRelay";
  DeviceConnectionMode2[DeviceConnectionMode2["zenSDK"] = 4] = "zenSDK";
  return DeviceConnectionMode2;
})(DeviceConnectionMode || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeviceConnectionMode
});
//# sourceMappingURL=enums.js.map
