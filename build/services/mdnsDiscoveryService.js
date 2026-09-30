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
var mdnsDiscoveryService_exports = {};
__export(mdnsDiscoveryService_exports, {
  MdnsDiscoveryService: () => MdnsDiscoveryService
});
module.exports = __toCommonJS(mdnsDiscoveryService_exports);
var import_bonjour_service = __toESM(require("bonjour-service"));
var import_mdnsHelper = require("../helpers/mdnsHelper");
const INITIAL_QUERY_INTERVALS_MS = [5e3, 1e4, 15e3, 3e4];
const QUERY_INTERVAL_MS = 5 * 60 * 1e3;
class MdnsDiscoveryService {
  adapter;
  bonjour;
  browser;
  queryTimeout;
  queryCount = 0;
  constructor(adapter) {
    this.adapter = adapter;
  }
  /**
   * Starts the discovery. Found devices are handled by handleDiscoveredService.
   */
  start() {
    if (this.bonjour) {
      return;
    }
    this.adapter.log.info("[MdnsDiscoveryService] Starting continuous mDNS discovery of Zendure devices!");
    this.bonjour = new import_bonjour_service.default(void 0, (err) => {
      this.adapter.log.warn(`[MdnsDiscoveryService] mDNS error: ${err.message}`);
    });
    this.query();
  }
  /**
   * Sends a new mDNS query by replacing the browser. A browser only reports a service once and doesn't notice
   * address changes, so a fresh browser reports every responding device again, with its current IP address.
   * Announcements of devices joining the network in between are received by the running browser.
   */
  query() {
    var _a, _b;
    if (!this.bonjour) {
      return;
    }
    (_a = this.browser) == null ? void 0 : _a.stop();
    this.browser = this.bonjour.find(null, (service) => (0, import_mdnsHelper.handleDiscoveredService)(this.adapter, service));
    this.browser.on("down", (service) => {
      if ((0, import_mdnsHelper.isZendureService)(service)) {
        this.adapter.log.debug(`[MdnsDiscoveryService] Zendure device ${service.name} left the network (mDNS)!`);
      }
    });
    const delayMs = (_b = INITIAL_QUERY_INTERVALS_MS[this.queryCount]) != null ? _b : QUERY_INTERVAL_MS;
    this.queryCount++;
    this.queryTimeout = this.adapter.setTimeout(() => this.query(), delayMs);
  }
  /**
   * Stops the discovery and releases the mDNS socket.
   */
  stop() {
    var _a, _b;
    if (this.queryTimeout) {
      this.adapter.clearTimeout(this.queryTimeout);
      this.queryTimeout = void 0;
    }
    (_a = this.browser) == null ? void 0 : _a.stop();
    this.browser = void 0;
    (_b = this.bonjour) == null ? void 0 : _b.destroy();
    this.bonjour = void 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MdnsDiscoveryService
});
//# sourceMappingURL=mdnsDiscoveryService.js.map
