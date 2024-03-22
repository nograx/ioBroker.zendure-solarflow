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
var import_jobSchedule = require("./services/jobSchedule");
var import_adapterService = require("./services/adapterService");
var import_createSolarFlowStates = require("./helpers/createSolarFlowStates");
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
    this.lastLogin = void 0;
    this.mqttClient = void 0;
    this.resetValuesJob = void 0;
    this.checkStatesJob = void 0;
    this.calculationJob = void 0;
    this.refreshAccessTokenInterval = void 0;
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    var _a;
    await this.extendObjectAsync("info", {
      type: "channel",
      common: {
        name: "Information"
      },
      native: {}
    });
    await this.extendObjectAsync(`info.connection`, {
      type: "state",
      common: {
        name: {
          de: "Mit Zendure Cloud verbunden",
          en: "Connected to Zendure cloud"
        },
        type: "boolean",
        desc: "connection",
        role: "indicator.connected",
        read: true,
        write: false
      },
      native: {}
    });
    if (this.config.server && this.config.server == "eu") {
      this.paths = import_paths.pathsEu;
    } else {
      this.paths = import_paths.pathsGlobal;
    }
    this.log.debug("[onReady] Using server " + this.config.server);
    if (this.config.userName && this.config.password) {
      (_a = (0, import_webService.login)(this)) == null ? void 0 : _a.then((_accessToken) => {
        this.accessToken = _accessToken;
        this.setState("info.connection", true, true);
        this.lastLogin = /* @__PURE__ */ new Date();
        (0, import_webService.getDeviceList)(this).then(async (result) => {
          if (result) {
            this.deviceList = result.filter(
              (device) => device.productName.toLowerCase().includes("solarflow")
            );
            await (0, import_adapterService.checkDevicesServer)(this);
            this.log.info(
              `[onReady] Found ${this.deviceList.length} SolarFlow device(s).`
            );
            await this.deviceList.forEach(
              async (device) => {
                await (0, import_createSolarFlowStates.createSolarFlowStates)(
                  this,
                  device.productKey,
                  device.deviceKey
                );
                await (0, import_adapterService.updateSolarFlowState)(
                  this,
                  device.productKey,
                  device.deviceKey,
                  "electricLevel",
                  device.electricity
                );
                await (0, import_adapterService.updateSolarFlowState)(
                  this,
                  device.productKey,
                  device.deviceKey,
                  "name",
                  device.name
                );
                await (0, import_adapterService.updateSolarFlowState)(
                  this,
                  device.productKey,
                  device.deviceKey,
                  "productName",
                  device.productName
                );
                await (0, import_adapterService.updateSolarFlowState)(
                  this,
                  device.productKey,
                  device.deviceKey,
                  "snNumber",
                  device.snNumber
                );
                await (0, import_adapterService.updateSolarFlowState)(
                  this,
                  device.productKey,
                  device.deviceKey,
                  "registeredServer",
                  this.config.server
                );
              }
            );
            (0, import_mqttService.connectMqttClient)(this);
            (0, import_jobSchedule.startResetValuesJob)(this);
            (0, import_jobSchedule.startCheckStatesJob)(this);
            (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(this);
            if (this.config.useCalculation) {
              (0, import_jobSchedule.startCalculationJob)(this);
            }
          }
        }).catch(() => {
          var _a2;
          this.setState("info.connection", false, true);
          (_a2 = this.log) == null ? void 0 : _a2.error("[onReady] Retrieving device failed!");
        });
      }).catch((error) => {
        this.setState("info.connection", false, true);
        this.log.error(
          "[onReady] Logon error at Zendure cloud service! Error: " + error.toString()
        );
      });
    } else {
      this.setState("info.connection", false, true);
      this.log.error("[onReady] No Login Information provided!");
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  onUnload(callback) {
    var _a;
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }
      this.setState("info.connection", false, true);
      if (this.resetValuesJob) {
        this.resetValuesJob.cancel();
        this.resetValuesJob = void 0;
      }
      if (this.checkStatesJob) {
        (_a = this.checkStatesJob) == null ? void 0 : _a.cancel();
        this.checkStatesJob = void 0;
      }
      if (this.calculationJob) {
        this.calculationJob.cancel();
        this.calculationJob = void 0;
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
      const splitted = id.split(".");
      const productKey = splitted[2];
      const deviceKey = splitted[3];
      const stateName1 = splitted[4];
      const stateName2 = splitted[5];
      if (state.val != void 0 && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            if (stateName2 == "setOutputLimit") {
              (0, import_mqttService.setOutputLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dischargeLimit") {
              (0, import_mqttService.setDischargeLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "chargeLimit") {
              (0, import_mqttService.setChargeLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "passMode") {
              (0, import_mqttService.setPassMode)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "autoRecover") {
              (0, import_mqttService.setAutoRecover)(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "buzzerSwitch") {
              (0, import_mqttService.setBuzzerSwitch)(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            }
            break;
          default:
            break;
        }
      } else {
        this.log.debug(`state ${id} deleted`);
      }
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
