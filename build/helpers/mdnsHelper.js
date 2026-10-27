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
  createZenSdkDevice: () => createZenSdkDevice,
  handleDiscoveredService: () => handleDiscoveredService,
  isZendureService: () => isZendureService,
  normalizeModelName: () => normalizeModelName
});
module.exports = __toCommonJS(mdnsHelper_exports);
var import_helpers = require("./helpers");
var import_sentryHelper = require("./sentryHelper");
const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";
const reportedToSentry = /* @__PURE__ */ new Set();
const devicesInCreation = /* @__PURE__ */ new Set();
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
async function findExistingStateTreeKeys(adapter, snNumber) {
  const states = await adapter.getStatesAsync("*.snNumber");
  const normalizedSnNumber = snNumber.toUpperCase();
  for (const [id, state] of Object.entries(states != null ? states : {})) {
    const parts = id.substring(adapter.namespace.length + 1).split(".");
    if (parts.length === 3 && typeof (state == null ? void 0 : state.val) === "string" && state.val.toUpperCase() === normalizedSnNumber) {
      return { productKey: parts[0], deviceKey: parts[1] };
    }
  }
  return void 0;
}
async function createZenSdkDevice(adapter, modelName, snNumber, ipAddress, source) {
  const normalizedSnNumber = snNumber.toUpperCase();
  if (devicesInCreation.has(normalizedSnNumber) || adapter.zenIobDeviceList.some((x) => {
    var _a;
    return ((_a = x.snNumber) == null ? void 0 : _a.toUpperCase()) === normalizedSnNumber;
  })) {
    return true;
  }
  const product = (0, import_helpers.findProductByMdnsModelName)(normalizeModelName(modelName));
  if (!product) {
    adapter.log.warn(
      `[mdnsHelper] Found Zendure device '${source}', but its model '${modelName}' is not known and can't be created automatically. Please connect it via the Zendure Cloud instead!`
    );
    reportToSentry(adapter, source, `[mdnsHelper] Unknown zenSDK model '${modelName}' ('${source}')`);
    return false;
  }
  devicesInCreation.add(normalizedSnNumber);
  try {
    return await createZenSdkDeviceModel(adapter, product, snNumber, ipAddress, source);
  } finally {
    devicesInCreation.delete(normalizedSnNumber);
  }
}
async function createZenSdkDeviceModel(adapter, product, snNumber, ipAddress, source) {
  var _a;
  let treeKeys = { productKey: product.productKey, deviceKey: snNumber };
  try {
    const existingTreeKeys = await findExistingStateTreeKeys(adapter, snNumber);
    if (existingTreeKeys) {
      adapter.log.info(
        `[mdnsHelper] Device '${source}' (serial: ${snNumber}) was created before, keeping its existing states at '${existingTreeKeys.productKey}.${existingTreeKeys.deviceKey}'!`
      );
      treeKeys = existingTreeKeys;
    }
  } catch (error) {
    adapter.log.warn(
      `[mdnsHelper] Could not check for existing states of device '${source}': ${(_a = error == null ? void 0 : error.message) != null ? _a : error}`
    );
  }
  adapter.log.info(
    `[mdnsHelper] Creating new device for '${source}' (model: ${product.productModel}, serial: ${snNumber}) at IP ${ipAddress}!`
  );
  const zenHaDeviceDetails = {
    deviceKey: snNumber,
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
    snNumber,
    username: ""
  };
  let deviceModel = (0, import_helpers.createDeviceModel)(adapter, treeKeys.productKey, treeKeys.deviceKey, zenHaDeviceDetails);
  if (!deviceModel && treeKeys.productKey !== product.productKey) {
    deviceModel = (0, import_helpers.createDeviceModel)(adapter, product.productKey, snNumber, zenHaDeviceDetails);
  }
  if (deviceModel) {
    adapter.zenIobDeviceList.push(deviceModel);
    return true;
  }
  const message = `[mdnsHelper] Error creating device model for '${source}' (productKey '${product.productKey}')`;
  adapter.log.error(`${message}!`);
  reportToSentry(adapter, source, message);
  return false;
}
async function createDeviceFromMdns(adapter, serviceName, ipAddress) {
  const parsed = extractModelAndSerial(serviceName);
  if (!parsed) {
    return;
  }
  await createZenSdkDevice(adapter, parsed.modelName, parsed.snNumber, ipAddress, `mDNS: ${serviceName}`);
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
  createDeviceFromMdns(adapter, service.name, ipAddress).catch((error) => {
    var _a2;
    adapter.log.error(`[mdnsHelper] Error creating device for '${service.name}': ${(_a2 = error == null ? void 0 : error.message) != null ? _a2 : error}`);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createZenSdkDevice,
  handleDiscoveredService,
  isZendureService,
  normalizeModelName
});
//# sourceMappingURL=mdnsHelper.js.map
