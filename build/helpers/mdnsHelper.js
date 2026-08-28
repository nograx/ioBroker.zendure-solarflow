"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mdnsHelper_exports = {};
__export(mdnsHelper_exports, {
  discoverZendureDevicesViaMdns: () => discoverZendureDevicesViaMdns
});
module.exports = __toCommonJS(mdnsHelper_exports);
var import_bonjour_service = __toESM(require("bonjour-service"));
var import_helpers = require("./helpers");
const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";
const DISCOVERY_DURATION_MS = 1e4;
const MAC_SUFFIX_LENGTH = 12;
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
    adapter.log.error(`[mdnsHelper] Error creating device model for mDNS-discovered device '${serviceName}'!`);
  }
}
function discoverZendureDevicesViaMdns(adapter) {
  const bonjour = new import_bonjour_service.default(void 0, (err) => {
    adapter.log.warn(`[mdnsHelper] mDNS error: ${err.message}`);
  });
  const browser = bonjour.find(null, (service) => {
    var _a, _b, _c, _d, _e;
    if (!((_a = service.name) == null ? void 0 : _a.startsWith(ZENDURE_DEVICE_NAME_PREFIX))) {
      return;
    }
    adapter.log.info(
      `[mdnsHelper] Found Zendure device via mDNS: ${service.name} (host: ${service.host}, addresses: ${(_b = service.addresses) == null ? void 0 : _b.join(", ")})`
    );
    const macSuffix = service.name.slice(-MAC_SUFFIX_LENGTH).toUpperCase();
    const ipAddress = (_e = (_c = service.addresses) == null ? void 0 : _c.find((address) => address.includes("."))) != null ? _e : (_d = service.addresses) == null ? void 0 : _d[0];
    if (!ipAddress) {
      return;
    }
    const device = adapter.zenIobDeviceList.find((x) => {
      var _a2;
      return (_a2 = x.snNumber) == null ? void 0 : _a2.toUpperCase().endsWith(macSuffix);
    });
    if (device) {
      adapter.log.debug(
        `[mdnsHelper] Matched mDNS device ${service.name} to known device with snNumber ${device.snNumber} via IP ${ipAddress}!`
      );
      device.connectViaMdns(ipAddress, service.name, service.host);
      return;
    }
    createDeviceFromMdns(adapter, service.name, ipAddress);
  });
  adapter.setTimeout(() => {
    browser.stop();
    bonjour.destroy();
  }, DISCOVERY_DURATION_MS);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  discoverZendureDevicesViaMdns
});
//# sourceMappingURL=mdnsHelper.js.map
