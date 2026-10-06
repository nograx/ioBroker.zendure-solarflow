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
var sentryHelper_exports = {};
__export(sentryHelper_exports, {
  reportErrorToSentry: () => reportErrorToSentry,
  reportUsageStatistics: () => reportUsageStatistics
});
module.exports = __toCommonJS(sentryHelper_exports);
const getSentry = (adapter) => {
  var _a, _b;
  if (!((_a = adapter.supportsFeature) == null ? void 0 : _a.call(adapter, "PLUGINS"))) {
    return void 0;
  }
  return (_b = adapter.getPluginInstance("sentry")) == null ? void 0 : _b.getSentryObject();
};
const reportErrorToSentry = (adapter, message) => {
  var _a;
  (_a = getSentry(adapter)) == null ? void 0 : _a.captureMessage(message, "error");
};
const reportAutomationStatistics = async (adapter, sentry) => {
  var _a;
  const globalEnabled = ((_a = await adapter.getStateAsync("adapterAutomation.automationEnabled")) == null ? void 0 : _a.val) === true;
  let enabledDeviceCount = 0;
  for (const device of adapter.zenIobDeviceList) {
    const deviceEnabled = await adapter.getStateAsync(
      `${device.productKey}.${device.deviceKey}.adapterAutomation.automationEnabled`
    );
    if ((deviceEnabled == null ? void 0 : deviceEnabled.val) === true) {
      enabledDeviceCount++;
    }
  }
  const status = !adapter.config.enableAutomation ? "disabled" : globalEnabled ? "active" : "inactive";
  sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("automationStatus", status);
    scope.setTag("automationEnabledDevices", String(enabledDeviceCount));
    scope.setTag("deviceCount", String(adapter.zenIobDeviceList.length));
    scope.setTag("connectionMode", adapter.config.connectionMode);
    scope.setFingerprint(["automation-statistics", status]);
    sentry.captureMessage(`Automation statistics: ${status}`);
  });
};
const reportUsageStatistics = async (adapter) => {
  const sentry = getSentry(adapter);
  if (!sentry) {
    return;
  }
  const reported = /* @__PURE__ */ new Set();
  adapter.zenIobDeviceList.forEach((device) => {
    const deviceClass = device.constructor.name;
    if (reported.has(deviceClass)) {
      return;
    }
    reported.add(deviceClass);
    sentry.withScope((scope) => {
      scope.setLevel("info");
      scope.setTag("deviceClass", deviceClass);
      scope.setTag("productKey", device.productKey);
      scope.setTag("productName", device.productName);
      scope.setTag("connectionMode", adapter.config.connectionMode);
      scope.setFingerprint(["device-statistics", deviceClass]);
      sentry.captureMessage(`Device statistics: ${deviceClass}`);
    });
  });
  await reportAutomationStatistics(adapter, sentry);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  reportErrorToSentry,
  reportUsageStatistics
});
//# sourceMappingURL=sentryHelper.js.map
