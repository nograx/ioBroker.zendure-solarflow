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
var mdnsHelper_exports = {};
__export(mdnsHelper_exports, {
  handleDiscoveredService: () => handleDiscoveredService,
  isZendureService: () => isZendureService
});
module.exports = __toCommonJS(mdnsHelper_exports);
var import_helpers = require("./helpers");
var import_sentryHelper = require("./sentryHelper");
const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";
const reportedToSentry = /* @__PURE__ */ new Set();
function reportToSentry(adapter, serviceName, message) {
  if (reportedToSentry.has(serviceName)) {
    return;
  }
  reportedToSentry.add(serviceName);
  (0, import_sentryHelper.reportErrorToSentry)(adapter, message);
}
function isZendureService(service) {
  var _a;
  return !!((_a = service.name) == null ? void 0 : _a.startsWith(ZENDURE_DEVICE_NAME_PREFIX));
}
function normalizeModelName(modelName) {
  return modelName.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]/g, "");
}
function extractModelAndSerial(serviceName) {
  const withoutPrefix = serviceName.slice(ZENDURE_DEVICE_NAME_PREFIX.length);
  const lastDashIndex = withoutPrefix.lastIndexOf("-");
  if (lastDashIndex <= 0 || lastDashIndex >= withoutPrefix.length - 1) {
    return void 0;
  }
  return {
    modelName: withoutPrefix.slice(0, lastDashIndex),
    snNumber: withoutPrefix.slice(lastDashIndex + 1)
  };
}
function createDeviceFromMdns(adapter, serviceName, ipAddress) {
  const parsed = extractModelAndSerial(serviceName);
  if (!parsed) {
    return;
  }
  if (adapter.zenIobDeviceList.some((x) => {
    var _a;
    return ((_a = x.snNumber) == null ? void 0 : _a.toUpperCase()) === parsed.snNumber.toUpperCase();
  })) {
    return;
  }
  const product = (0, import_helpers.findProductByMdnsModelName)(normalizeModelName(parsed.modelName));
  if (!product) {
    adapter.log.warn(
      `[mdnsHelper] Discovered Zendure device '${serviceName}' via mDNS, but its model '${parsed.modelName}' is not known and can't be created automatically. Please connect it via the Zendure Cloud instead!`
    );
    reportToSentry(adapter, serviceName, `[mdnsHelper] Unknown mDNS model '${parsed.modelName}' ('${serviceName}')`);
    return;
  }
  adapter.log.info(
    `[mdnsHelper] Creating new device for mDNS-discovered device '${serviceName}' (model: ${product.productModel}, serial: ${parsed.snNumber}) at IP ${ipAddress}!`
  );
  const zenHaDeviceDetails = {
    deviceKey: parsed.snNumber,
    deviceName: product.productModel,
    enable: true,
    ip: ipAddress,
    lcnSupport: 0,
    online: true,
    password: "",
    port: 0,
    productKey: product.productKey,
    productModel: product.productModel,
    protocol: "",
    server: "",
    snNumber: parsed.snNumber,
    username: ""
  };
  const deviceModel = (0, import_helpers.createDeviceModel)(adapter, product.productKey, parsed.snNumber, zenHaDeviceDetails);
  if (deviceModel) {
    adapter.zenIobDeviceList.push(deviceModel);
  } else {
    const message = `[mdnsHelper] Error creating device model for mDNS-discovered device '${serviceName}' (productKey '${product.productKey}')`;
    adapter.log.error(`${message}!`);
    reportToSentry(adapter, serviceName, message);
  }
}
function handleDiscoveredService(adapter, service) {
  var _a, _b, _c, _d, _e, _f, _g;
  if (!isZendureService(service)) {
    return;
  }
  adapter.log.debug(
    `[mdnsHelper] Found Zendure device via mDNS: ${service.name} (host: ${service.host}, addresses: ${(_a = service.addresses) == null ? void 0 : _a.join(", ")}, sender: ${(_b = service.referer) == null ? void 0 : _b.address})`
  );
  const ipAddress = (_g = (_e = (_c = service.addresses) == null ? void 0 : _c.find((address) => address.includes("."))) != null ? _e : (_d = service.referer) == null ? void 0 : _d.address) != null ? _g : (_f = service.addresses) == null ? void 0 : _f[0];
  if (!ipAddress) {
    return;
  }
  const parsed = extractModelAndSerial(service.name);
  if (!parsed) {
    return;
  }
  const device = adapter.zenIobDeviceList.find((x) => {
    var _a2;
    return ((_a2 = x.snNumber) == null ? void 0 : _a2.toUpperCase()) === parsed.snNumber.toUpperCase();
  });
  if (device) {
    device.connectViaMdns(ipAddress, service.name, service.host);
    return;
  }
  createDeviceFromMdns(adapter, service.name, ipAddress);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleDiscoveredService,
  isZendureService
});
//# sourceMappingURL=mdnsHelper.js.map
