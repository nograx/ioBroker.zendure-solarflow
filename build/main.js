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
var import_node_schedule = require("node-schedule");
class ZendureSolarflow extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "zendure-solarflow"
    });
    this.accessToken = void 0;
    // Access Token for Zendure Rest API
    this.deviceList = [];
    this.paths = void 0;
    this.interval = void 0;
    this.lastLogin = void 0;
    this.resetValuesJob = void 0;
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    var _a;
    this.paths = import_paths.pathsGlobal;
    if (this.config.userName && this.config.password) {
      (_a = (0, import_webService.login)(this)) == null ? void 0 : _a.then((_accessToken) => {
        this.accessToken = _accessToken;
        this.connected = true;
        this.lastLogin = /* @__PURE__ */ new Date();
        this.resetValuesJob = (0, import_node_schedule.scheduleJob)("0 0 * * *", () => {
          var _a2;
          this.log.debug(`Refreshing accessToken!`);
          if (this.config.userName && this.config.password) {
            (_a2 = (0, import_webService.login)(this)) == null ? void 0 : _a2.then((_accessToken2) => {
              this.accessToken = _accessToken2;
              this.lastLogin = /* @__PURE__ */ new Date();
              this.connected = true;
            });
          }
          (0, import_adapterService.resetTodaysValues)(this);
        });
        (0, import_webService.getDeviceList)(this).then((result) => {
          if (result) {
            this.deviceList = result;
            (0, import_mqttService.connectMqttClient)(this);
            (0, import_adapterService.startCheckStatesTimer)(this);
          }
        }).catch(() => {
          var _a2;
          this.connected = false;
          (_a2 = this.log) == null ? void 0 : _a2.error("Retrieving device failed!");
        });
      }).catch((error) => {
        this.connected = false;
        this.log.error(
          "Logon error at Zendure cloud service! Error: " + error.toString()
        );
      });
    } else {
      this.connected = false;
      this.log.error("No Login Information provided!");
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  onUnload(callback) {
    try {
      if (this.interval) {
        this.clearInterval(this.interval);
      }
      if (this.resetValuesJob) {
        this.resetValuesJob.cancel();
      }
      callback();
    } catch (e) {
      callback();
    }
  }
  /**
   * Is called if a subscribed state changes
   */
  onStateChange(id, state) {
    if (state) {
      this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
      const splitted = id.split(".");
      const productKey = splitted[2];
      const deviceKey = splitted[3];
      if (id.includes("setOutputLimit") && state.val != void 0 && state.val != null) {
        (0, import_mqttService.setOutputLimit)(this, productKey, deviceKey, Number(state.val));
      } else if (id.includes("dischargeLimit") && state.val != void 0 && state.val != null) {
        (0, import_mqttService.setDischargeLimit)(this, productKey, deviceKey, Number(state.val));
      } else if (id.includes("chargeLimit") && state.val != void 0 && state.val != null) {
        (0, import_mqttService.setChargeLimit)(this, productKey, deviceKey, Number(state.val));
      } else if (id.includes("solarInput") && state.val != void 0 && state.val != null) {
        (0, import_adapterService.calculateEnergy)(this, productKey, deviceKey, "solarInput", state);
      } else if (id.includes("outputPackPower") && state.val != void 0 && state.val != null) {
        (0, import_adapterService.calculateEnergy)(this, productKey, deviceKey, "outputPack", state);
      } else if (id.includes("packInputPower") && state.val != void 0 && state.val != null) {
        (0, import_adapterService.calculateEnergy)(this, productKey, deviceKey, "packInput", state);
      } else if (id.includes("outputHomePower") && state.val != void 0 && state.val != null) {
        (0, import_adapterService.calculateEnergy)(this, productKey, deviceKey, "outputHome", state);
      }
    } else {
      this.log.debug(`state ${id} deleted`);
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
