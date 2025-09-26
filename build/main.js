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
var import_zenWebService = require("./services/zenWebService");
var import_jobSchedule = require("./services/jobSchedule");
var import_mqttLocalService = require("./services/mqttLocalService");
var import_mqttCloudZenService = require("./services/mqttCloudZenService");
var import_helpers = require("./helpers/helpers");
class ZendureSolarflow extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "zendure-solarflow"
    });
    this.zenHaDeviceList = [];
    // All found devices for this instance will be in this array
    this.mqttSettings = void 0;
    this.msgCounter = 7e5;
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
    this.setState("info.errorMessage", "", true);
    this.setState("info.connection", false, true);
    switch (this.config.connectionMode) {
      case "authKey":
        this.log.debug("[onReady] Using Authorization Cloud Key");
        if (!this.config.authorizationCloudKey) {
          this.log.error(
            "[zenWebService.login] authorization cloud key is missing!"
          );
          break;
        }
        const data = await (0, import_zenWebService.zenLogin)(this);
        if (typeof data === "string" || data == void 0) {
          this.setState("info.connection", false, true);
        } else {
          this.mqttSettings = data.mqtt;
          if (!(0, import_mqttCloudZenService.connectCloudZenMqttClient)(this)) {
            return;
          }
          this.log.debug(
            `[onReady] Creating ${data.deviceList.length} devices...`
          );
          await data.deviceList.forEach(async (device) => {
            const deviceModel = (0, import_helpers.createDeviceModel)(
              this,
              device.productKey,
              device.deviceKey,
              device
            );
            if (deviceModel) {
              this.zenHaDeviceList.push(deviceModel);
            }
          });
        }
        break;
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");
        (0, import_mqttLocalService.connectLocalMqttClient)(this);
        if (this.config.localDevice1ProductKey && this.config.localDevice1DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice1ProductKey,
            this.config.localDevice1DeviceKey
          );
          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice2ProductKey && this.config.localDevice2DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice2ProductKey,
            this.config.localDevice2DeviceKey
          );
          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice3ProductKey && this.config.localDevice3DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice3ProductKey,
            this.config.localDevice3DeviceKey
          );
          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice4ProductKey && this.config.localDevice4DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice4ProductKey,
            this.config.localDevice4DeviceKey
          );
          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }
        if (this.config.useRestart) {
          (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(this);
        }
        break;
      }
      default:
        this.setState("info.connection", false, true);
        this.log.error("[onReady] No connection mode found or mode invalid!");
        break;
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
      const _device = this.zenHaDeviceList.find(
        (x) => x.productKey == productKey && x.deviceKey == deviceKey
      );
      if (!_device) {
        this.log.error(
          `[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`
        );
        return;
      }
      if (state.val != void 0 && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            this.log.debug(
              `[onStateChange] Control state '${stateName2}' changed, new value is ${state.val}, ack = ${state.ack}!`
            );
            switch (stateName2) {
              case "setOutputLimit":
                _device.setOutputLimit(Number(state.val));
                break;
              case "setInputLimit":
                _device.setInputLimit(Number(state.val));
                break;
              case "chargeLimit":
                _device.setChargeLimit(Number(state.val));
                break;
              case "dischargeLimit":
                _device.setDischargeLimit(Number(state.val));
                break;
              case "passMode":
                _device.setPassMode(Number(state.val));
                break;
              case "dcSwitch":
                _device.setDcSwitch(state.val ? true : false);
                break;
              case "acSwitch":
                _device.setAcSwitch(state.val ? true : false);
                break;
              case "acMode":
                _device.setAcMode(Number(state.val));
                break;
              case "hubState":
                _device.setHubState(Number(state.val));
                break;
              case "autoModel":
                _device.setAutoModel(Number(state.val));
                break;
              case "autoRecover":
                _device.setAutoRecover(state.val ? true : false);
                break;
              case "buzzerSwitch":
                _device.setBuzzerSwitch(state.val ? true : false);
                break;
              case "smartMode":
                _device.setSmartMode(state.val ? true : false);
                break;
              case "setDeviceAutomationInOutLimit":
                _device.setDeviceAutomationInOutLimit(Number(state.val));
                break;
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
