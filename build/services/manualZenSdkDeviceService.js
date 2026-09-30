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
var manualZenSdkDeviceService_exports = {};
__export(manualZenSdkDeviceService_exports, {
  ManualZenSdkDeviceService: () => ManualZenSdkDeviceService,
  getConfiguredDeviceAddresses: () => getConfiguredDeviceAddresses,
  normalizeDeviceAddress: () => normalizeDeviceAddress
});
module.exports = __toCommonJS(manualZenSdkDeviceService_exports);
var import_axios = __toESM(require("axios"));
var import_mdnsHelper = require("../helpers/mdnsHelper");
const CHECK_INTERVAL_MS = 5 * 60 * 1e3;
const REQUEST_TIMEOUT_MS = 4e3;
function normalizeDeviceAddress(entry) {
  if (typeof entry !== "string") {
    return "";
  }
  return entry.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}
function getConfiguredDeviceAddresses(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const addresses = entries.map(normalizeDeviceAddress).filter((address) => address.length > 0);
  return [...new Set(addresses)];
}
class ManualZenSdkDeviceService {
  adapter;
  addresses;
  checkInterval;
  checksInProgress = /* @__PURE__ */ new Set();
  /** Addresses whose last check failed, so an error is only logged once until the device answers again. */
  failedAddresses = /* @__PURE__ */ new Set();
  constructor(adapter, addresses) {
    this.adapter = adapter;
    this.addresses = addresses;
  }
  /**
   * Checks all configured addresses now and then periodically, until stop() is called.
   */
  start() {
    if (this.checkInterval || this.addresses.length === 0) {
      return;
    }
    this.adapter.log.info(
      `[ManualZenSdkDeviceService] Connecting ${this.addresses.length} zenSDK device(s) by configured IP address: ${this.addresses.join(", ")}`
    );
    this.checkAll();
    this.checkInterval = this.adapter.setInterval(() => this.checkAll(), CHECK_INTERVAL_MS);
  }
  /**
   * Stops the periodic checks.
   */
  stop() {
    if (this.checkInterval) {
      this.adapter.clearInterval(this.checkInterval);
      this.checkInterval = void 0;
    }
  }
  checkAll() {
    for (const address of this.addresses) {
      void this.checkAddress(address);
    }
  }
  async checkAddress(address) {
    var _a;
    if (this.checksInProgress.has(address)) {
      return;
    }
    this.checksInProgress.add(address);
    try {
      const response = await import_axios.default.get(`http://${address}/properties/report`, {
        headers: { "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT_MS
      });
      const data = response.data;
      const snNumber = typeof (data == null ? void 0 : data.sn) === "string" ? data.sn.trim() : "";
      const product = typeof (data == null ? void 0 : data.product) === "string" ? data.product.trim() : "";
      if (!snNumber) {
        this.logFailure(
          address,
          `Device at ${address} answered, but reported no serial number ('sn') on /properties/report - is this a zenSDK-compatible Zendure device?`
        );
        return;
      }
      if (this.failedAddresses.delete(address)) {
        this.adapter.log.info(`[ManualZenSdkDeviceService] Device at ${address} (${snNumber}) is reachable again!`);
      }
      const source = `configured IP ${address}`;
      const device = this.adapter.zenIobDeviceList.find((x) => {
        var _a2;
        return ((_a2 = x.snNumber) == null ? void 0 : _a2.toUpperCase()) === snNumber.toUpperCase();
      });
      if (device) {
        device.connectViaMdns(address, source);
        return;
      }
      if (!product) {
        this.logFailure(
          address,
          `Device ${snNumber} at ${address} reported no model ('product') on /properties/report, so it can't be created automatically!`
        );
        return;
      }
      (0, import_mdnsHelper.createZenSdkDevice)(this.adapter, product, snNumber, address, source);
    } catch (error) {
      this.logFailure(address, `Device at ${address} is not reachable via zenSDK: ${(_a = error == null ? void 0 : error.message) != null ? _a : error}`);
    } finally {
      this.checksInProgress.delete(address);
    }
  }
  logFailure(address, message) {
    if (this.failedAddresses.has(address)) {
      this.adapter.log.debug(`[ManualZenSdkDeviceService] ${message}`);
      return;
    }
    this.failedAddresses.add(address);
    this.adapter.log.warn(
      `[ManualZenSdkDeviceService] ${message} Retrying every ${CHECK_INTERVAL_MS / 6e4} minutes.`
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ManualZenSdkDeviceService,
  getConfiguredDeviceAddresses,
  normalizeDeviceAddress
});
//# sourceMappingURL=manualZenSdkDeviceService.js.map
