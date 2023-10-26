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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var main_exports = {};
__export(main_exports, {
  ZendureSolarflow: () => ZendureSolarflow
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var import_mqttService = require("./services/mqttService");
var import_webService = require("./services/webService");
var import_paths = require("./constants/paths");
var import_adapterService = require("./services/adapterService");
class ZendureSolarflow extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "zendure-solarflow"
    });
    this.accessToken = void 0;
    this.deviceList = [];
    this.paths = void 0;
    this.timer = null;
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    var _a, _b;
    this.paths = import_paths.pathsGlobal;
    if (this.config.userName && this.config.password) {
      (_a = (0, import_webService.login)(this)) == null ? void 0 : _a.then((_accessToken) => {
        this.accessToken = _accessToken;
        (0, import_webService.getDeviceList)(this).then((result) => {
          if (result) {
            this.deviceList = result;
            (0, import_mqttService.connectMqttClient)(this);
            (0, import_adapterService.startCheckStatesTimer)(this);
          }
        }).catch(() => {
          var _a2;
          (_a2 = this.log) == null ? void 0 : _a2.error("Retrieving device failed!");
        });
      }).catch((err) => {
        this.log.error("Logon error at Zendure cloud service!");
      });
    } else {
      this.log.error("No Login Information provided!");
      (_b = this.stop) == null ? void 0 : _b.call(this);
    }
  }
  onUnload(callback) {
    try {
      if (this.timer) {
        this.timer = null;
      }
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
      if (id.includes("setOutputLimit") && state.val != void 0 && state.val != null) {
        const splitted = id.split(".");
        const productKey = splitted[2];
        const deviceKey = splitted[3];
        (0, import_mqttService.setOutputLimit)(this, productKey, deviceKey, Number(state.val));
      }
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new ZendureSolarflow(options);
} else {
  (() => new ZendureSolarflow())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZendureSolarflow
});
//# sourceMappingURL=main.js.map
