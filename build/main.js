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
var import_createSolarFlowStates = require("./helpers/createSolarFlowStates");
var import_fallbackWebService = require("./services/fallbackWebService");
var import_fallbackMqttService = require("./services/fallbackMqttService");
var import_jobSchedule = require("./services/jobSchedule");
class ZendureSolarflow extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "zendure-solarflow"
    });
    this.userId = void 0;
    // User ID, needed for connection with Smart Plug
    this.accessToken = void 0;
    // Access Token for Zendure Rest API
    this.deviceList = [];
    this.paths = void 0;
    this.pack2Devices = [];
    this.lastLogin = void 0;
    this.mqttClient = void 0;
    this.resetValuesJob = void 0;
    this.checkStatesJob = void 0;
    this.calculationJob = void 0;
    this.refreshAccessTokenInterval = void 0;
    this.retryTimeout = void 0;
    this.createdSnNumberSolarflowStates = [];
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    await this.extendObject("info", {
      type: "channel",
      common: {
        name: "Information"
      },
      native: {}
    });
    await this.extendObject(`info.connection`, {
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
    await this.extendObject(`info.errorMessage`, {
      type: "state",
      common: {
        name: {
          de: "Fehlermeldung der Verbindung zur Zendure Cloud",
          en: "Error message from Zendure Cloud"
        },
        type: "string",
        desc: "errorMessage",
        role: "value",
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
    this.setState("info.errorMessage", "", true);
    if (this.config.server == "local") {
      this.log.debug("[onReady] Using local MQTT server");
      (0, import_mqttService.connectLocalMqttClient)(this);
      if (this.config.useRestart) {
        (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(this);
      }
    } else if (this.config.useFallbackService && this.config.snNumber) {
      this.log.debug("[onReady] Using Fallback Mode (Dev-Server)");
      (0, import_fallbackWebService.createDeveloperAccount)(this).then((data) => {
        if (data.appKey && data.mqttUrl && data.port && data.secret) {
          (0, import_fallbackMqttService.connectFallbackMqttClient)(
            this,
            data.appKey,
            data.secret,
            data.mqttUrl,
            data.port
          );
        }
      });
    } else if (!this.config.useFallbackService && this.config.userName && this.config.password) {
      let _accessToken = void 0;
      let retryCounter = 0;
      if (this.config.useRestart) {
        (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(this);
      }
      while (retryCounter <= 10) {
        try {
          _accessToken = await (0, import_webService.login)(this);
        } catch (ex) {
          this.setState("info.message", ex.message, true);
          if (ex.message.includes("Request failed with status code 400")) {
            this.log.warn(
              `[onReady] Error 400, maybe your credentials are invalid!`
            );
            break;
          } else {
            this.log.error(
              `[onReady] Error connecting to Zendure Cloud. Error: ${ex.message}`
            );
          }
        }
        if (_accessToken != void 0) {
          this.accessToken = _accessToken;
          break;
        }
        retryCounter++;
        const milliseconds = 4e3 * retryCounter;
        this.log.warn(
          `[onReady] Retrying to connect to Zendure Cloud in ${milliseconds / 1e3} seconds (Retry #${retryCounter} of 10).`
        );
        await new Promise(
          (r) => this.retryTimeout = this.setTimeout(r, milliseconds, void 0)
        );
      }
      if (_accessToken != void 0) {
        this.setState("info.connection", true, true);
        this.lastLogin = /* @__PURE__ */ new Date();
        (0, import_webService.getDeviceList)(this).then(async (result) => {
          if (result) {
            this.deviceList = result.filter(
              (device) => device.productName.toLowerCase().includes("solarflow") || device.productName.toLowerCase().includes("hyper") || device.productName.toLowerCase() == "ace 1500" || device.productName.toLowerCase().includes("smart plug")
            );
            await (0, import_adapterService.checkDevicesServer)(this);
            this.log.info(
              `[onReady] Found ${this.deviceList.length} SolarFlow device(s).`
            );
            await this.deviceList.forEach(
              async (device) => {
                var _a;
                let type = "solarflow";
                if (device.productName.toLocaleLowerCase().includes("hyper")) {
                  type = "hyper";
                } else if (device.productName.toLocaleLowerCase().includes("ace")) {
                  type = "ace";
                } else if (device.productName.toLocaleLowerCase().includes("aio")) {
                  type = "aio";
                } else if (device.productName.toLocaleLowerCase().includes("smart plug")) {
                  type = "smartPlug";
                }
                if (device.packList && device.packList.length > 0) {
                  device.packList.forEach(async (subDevice) => {
                    if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
                      device._connectedWithAce = true;
                      await (0, import_createSolarFlowStates.createSolarFlowStates)(this, subDevice, "ace");
                      await (0, import_adapterService.updateSolarFlowState)(
                        this,
                        subDevice.productKey,
                        subDevice.deviceKey,
                        "registeredServer",
                        this.config.server
                      );
                    }
                  });
                }
                await (0, import_createSolarFlowStates.createSolarFlowStates)(this, device, type);
                if (!device.productName.toLowerCase().includes("smart plug")) {
                  await (0, import_adapterService.updateSolarFlowState)(
                    this,
                    device.productKey,
                    device.deviceKey,
                    "registeredServer",
                    this.config.server
                  );
                } else if ((this == null ? void 0 : this.userId) && device.id) {
                  await (0, import_adapterService.updateSolarFlowState)(
                    this,
                    this.userId,
                    (_a = device.id) == null ? void 0 : _a.toString(),
                    "registeredServer",
                    this.config.server
                  );
                }
              }
            );
            (0, import_mqttService.connectCloudMqttClient)(this);
          }
        }).catch(() => {
          var _a;
          this.setState("info.connection", false, true);
          (_a = this.log) == null ? void 0 : _a.error("[onReady] Retrieving device failed!");
        });
      }
    } else {
      this.setState("info.connection", false, true);
      this.log.error("[onReady] No Login Information provided!");
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  async onUnload(callback) {
    var _a, _b;
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }
      try {
        await ((_a = this.mqttClient) == null ? void 0 : _a.endAsync());
        this.log.info("[onUnload] MQTT client stopped!");
        this.mqttClient = void 0;
      } catch (ex) {
        this.log.error("[onUnload] Error stopping MQTT client: !" + ex.message);
      }
      this.setState("info.connection", false, true);
      if (this.resetValuesJob) {
        this.resetValuesJob.cancel();
        this.resetValuesJob = void 0;
      }
      if (this.checkStatesJob) {
        (_b = this.checkStatesJob) == null ? void 0 : _b.cancel();
        this.checkStatesJob = void 0;
      }
      if (this.calculationJob) {
        this.calculationJob.cancel();
        this.calculationJob = void 0;
      }
      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
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
      if (this.config.useFallbackService && stateName1 == "control") {
        this.log.warn(
          `[onStateChange] Using Fallback server, control of Solarflow device is not possible!`
        );
      } else if (state.val != void 0 && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            if (stateName2 == "setOutputLimit") {
              (0, import_mqttService.setOutputLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "setInputLimit") {
              (0, import_mqttService.setInputLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dischargeLimit") {
              (0, import_mqttService.setDischargeLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "chargeLimit") {
              (0, import_mqttService.setChargeLimit)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "passMode") {
              (0, import_mqttService.setPassMode)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dcSwitch") {
              (0, import_mqttService.setDcSwitch)(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "acSwitch") {
              (0, import_mqttService.setAcSwitch)(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "acMode") {
              (0, import_mqttService.setAcMode)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "hubState") {
              (0, import_mqttService.setHubState)(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "autoModel") {
              (0, import_mqttService.setAutoModel)(this, productKey, deviceKey, Number(state.val));
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
