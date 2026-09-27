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
var import_adapterAutomation = require("./services/adapterAutomation/adapterAutomation");
var import_localMqttService = require("./services/mqtt/localMqttService");
var import_cloudMqttService = require("./services/mqtt/cloudMqttService");
var import_helpers = require("./helpers/helpers");
var import_fileHelper = require("./helpers/fileHelper");
var import_mdnsHelper = require("./helpers/mdnsHelper");
class ZendureSolarflow extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "zendure-solarflow"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  zenIobDeviceList = [];
  // All found devices for this instance will be in this array
  mqttSettings = void 0;
  lastLogin = void 0;
  localMqttService = void 0;
  cloudMqttService = void 0;
  resetValuesJob = void 0;
  checkStatesJob = void 0;
  calculationJob = void 0;
  zenSdkDataRefreshJob = void 0;
  adapterAutomationMetricsJob = void 0;
  adapterAutomationSortJob = void 0;
  refreshAccessTokenInterval = void 0;
  retryTimeout = void 0;
  deviceStatisticsTimeout = void 0;
  deviceStatisticsInterval = void 0;
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    if (this.config.useMdnsDiscovery === void 0) {
      this.config.useMdnsDiscovery = true;
      await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, { native: { useMdnsDiscovery: true } });
      this.log.info("[onReady] Enabled mDNS discovery by default (was not previously configured)!");
    }
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
    if (this.config.enableAutomation) {
      await this.extendObject("adapterAutomation", {
        type: "channel",
        common: {
          name: {
            de: "Adapter-Automatisierung",
            en: "Adapter automation"
          }
        },
        native: {}
      });
      await this.extendObject("adapterAutomation.automationEnabled", {
        type: "state",
        common: {
          name: {
            de: "Automatisierung aktiv",
            en: "Automation enabled"
          },
          type: "boolean",
          desc: "automationEnabled",
          role: "switch.enable",
          read: true,
          write: true,
          def: false
        },
        native: {}
      });
      await this.extendObject("adapterAutomation.ignoreSuggestedInverseMaxPower", {
        type: "state",
        common: {
          name: {
            de: "Empfohlene maximale Ausgangsleistung ignorieren",
            en: "Ignore suggested maximum inverter output power"
          },
          type: "boolean",
          desc: "ignoreSuggestedInverseMaxPower",
          role: "switch.enable",
          read: true,
          write: true,
          def: false
        },
        native: {}
      });
      await this.extendObject("adapterAutomation.setPoint", {
        type: "state",
        common: {
          name: {
            de: "Sollwert Netzeinspeisung",
            en: "Grid feed-in setpoint"
          },
          type: "number",
          desc: "setPoint",
          role: "level.power",
          read: true,
          write: true,
          unit: "W",
          def: 10
        },
        native: {}
      });
      await this.extendObject("adapterAutomation.setPointNearlyFull", {
        type: "state",
        common: {
          name: {
            de: "Sollwert Netzeinspeisung bei nahezu vollen Batterien",
            en: "Grid feed-in setpoint when batteries are nearly full"
          },
          type: "number",
          desc: "setPointNearlyFull",
          role: "level.power",
          read: true,
          write: true,
          unit: "W",
          def: -100
        },
        native: {}
      });
      const ensureDefaultValue = async (id, def) => {
        const current = await this.getStateAsync(id);
        if ((current == null ? void 0 : current.val) == null) {
          await this.setState(id, def, true);
        }
      };
      await ensureDefaultValue("adapterAutomation.automationEnabled", false);
      await ensureDefaultValue("adapterAutomation.ignoreSuggestedInverseMaxPower", false);
      await ensureDefaultValue("adapterAutomation.setPoint", 10);
      await ensureDefaultValue("adapterAutomation.setPointNearlyFull", -100);
    }
    switch (this.config.connectionMode) {
      case "authKey": {
        this.log.debug("[onReady] Using Authorization Cloud Key");
        if (!this.config.authorizationCloudKey) {
          this.log.error("[zenWebService.login] authorization cloud key is missing!");
          break;
        }
        const fileHelper = new import_fileHelper.FileHelper(this);
        let deviceList;
        const data = await (0, import_zenWebService.zenLogin)(this);
        if (this.config.useMdnsDiscovery) {
          (0, import_mdnsHelper.discoverZendureDevicesViaMdns)(this);
        } else {
          this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
        }
        if (typeof data === "string" || data == void 0) {
          this.setState("info.connection", false, true);
          fileHelper.readDeviceListFromFile().then((data2) => {
            if (data2) {
              deviceList = data2;
              this.log.debug(
                "[onReady] No connection to Zendure Cloud possible, but device list found in file. Using device list from file."
              );
            } else {
              this.log.error(
                "[onReady] No connection to Zendure Cloud possible and no device list found in file. Cannot continue."
              );
              return;
            }
          }).catch((err) => {
            this.log.error(
              `[onReady] No connection to Zendure Cloud possible and error reading device list from file: ${err.message}. Cannot continue.`
            );
            return;
          });
        } else {
          this.mqttSettings = data.mqtt;
          this.cloudMqttService = new import_cloudMqttService.CloudMqttService(this);
          if (!this.cloudMqttService.connect()) {
            this.log.error("[onReady] Could not connect to MQTT cloud server!");
          } else {
            deviceList = data.deviceList;
            if (deviceList.length == 0) {
              this.log.warn("[onReady] device list is empty!");
            }
            void fileHelper.writeDeviceListToFile(deviceList);
          }
          if (this.config.useAddionalLocalMqtt) {
            this.localMqttService = new import_localMqttService.LocalMqttService(this);
            if (!this.localMqttService.connect()) {
              this.log.error("[onReady] Could not connect to MQTT local server!");
            }
          }
        }
        if (deviceList) {
          this.log.debug(`[onReady] Creating ${deviceList.length} devices...`);
          deviceList.forEach((device) => {
            var _a;
            const deviceModel = (0, import_helpers.createDeviceModel)(this, device.productKey, device.deviceKey, device);
            if (deviceModel) {
              this.zenIobDeviceList.push(deviceModel);
            } else {
              const message = `[onReady] Error creating device with productKey '${device.productKey}' / deviceKey '${device.deviceKey}' / productModel '${device.productModel}'`;
              this.log.error(message);
              if (this.supportsFeature && this.supportsFeature("PLUGINS")) {
                const sentryInstance = this.getPluginInstance("sentry");
                (_a = sentryInstance == null ? void 0 : sentryInstance.getSentryObject()) == null ? void 0 : _a.captureMessage(message, "error");
              }
            }
          });
        }
        if (this.config.useZenSDK) {
          (0, import_jobSchedule.startZenSdkDataRefreshJob)(this);
        }
        break;
      }
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");
        if (this.config.useMdnsDiscovery) {
          (0, import_mdnsHelper.discoverZendureDevicesViaMdns)(this);
        } else {
          this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
        }
        if (this.config.localMqttUrl) {
          this.localMqttService = new import_localMqttService.LocalMqttService(this);
          if (!this.localMqttService.connect()) {
            this.log.error("[onReady] Could not connect to MQTT local server!");
          }
        } else {
          (0, import_jobSchedule.startResetValuesJob)(this);
          (0, import_jobSchedule.startCheckStatesAndConnectionJob)(this);
          if (this.config.useCalculation) {
            (0, import_jobSchedule.startCalculationJob)(this);
          }
        }
        if (this.config.localDevice1ProductKey && this.config.localDevice1DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice1ProductKey,
            this.config.localDevice1DeviceKey
          );
          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice2ProductKey && this.config.localDevice2DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice2ProductKey,
            this.config.localDevice2DeviceKey
          );
          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice3ProductKey && this.config.localDevice3DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice3ProductKey,
            this.config.localDevice3DeviceKey
          );
          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }
        if (this.config.localDevice4ProductKey && this.config.localDevice4DeviceKey) {
          const deviceModel = (0, import_helpers.createDeviceModel)(
            this,
            this.config.localDevice4ProductKey,
            this.config.localDevice4DeviceKey
          );
          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }
        if (this.config.useRestart) {
          (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(this);
        }
        if (this.config.useZenSDK) {
          (0, import_jobSchedule.startZenSdkDataRefreshJob)(this);
        }
        break;
      }
      default:
        this.setState("info.connection", false, true);
        this.log.error("[onReady] No connection mode found or mode invalid!");
        break;
    }
    if (this.config.enableAutomation) {
      if (this.config.automationTriggerStateId) {
        this.subscribeForeignStates(this.config.automationTriggerStateId);
        this.log.debug(`[onReady] Subscribed to automation trigger state '${this.config.automationTriggerStateId}'!`);
      }
      this.subscribeStates("adapterAutomation.automationEnabled");
      (0, import_jobSchedule.startAdapterAutomationJob)(this);
    }
    this.deviceStatisticsTimeout = this.setTimeout(
      () => {
        this.reportDeviceStatistics();
        this.deviceStatisticsInterval = this.setInterval(() => this.reportDeviceStatistics(), 24 * 60 * 60 * 1e3);
      },
      5 * 60 * 1e3
    );
  }
  /**
   * Reports each used device class (once per instance) to Sentry, to get statistics about the used devices.
   */
  reportDeviceStatistics() {
    var _a;
    if (!this.supportsFeature || !this.supportsFeature("PLUGINS")) {
      return;
    }
    const sentry = (_a = this.getPluginInstance("sentry")) == null ? void 0 : _a.getSentryObject();
    if (!sentry) {
      return;
    }
    const reported = /* @__PURE__ */ new Set();
    this.zenIobDeviceList.forEach((device) => {
      const deviceClass = device.constructor.name;
      if (reported.has(deviceClass)) {
        return;
      }
      reported.add(deviceClass);
      sentry.withScope((scope) => {
        scope.setLevel("info");
        scope.setTag("deviceClass", deviceClass);
        scope.setTag("productKey", device.productKey);
        scope.setTag("productName", device.productName);
        scope.setTag("connectionMode", this.config.connectionMode);
        scope.setFingerprint(["device-statistics", deviceClass]);
        sentry.captureMessage(`Device statistics: ${deviceClass}`);
      });
    });
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback
   */
  async onUnload(callback) {
    var _a, _b, _c, _d, _e;
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }
      try {
        await ((_b = (_a = this.cloudMqttService) == null ? void 0 : _a.mqttClient) == null ? void 0 : _b.endAsync());
        this.log.info("[onUnload] MQTT cloud client stopped!");
        this.cloudMqttService = void 0;
      } catch (ex) {
        this.log.error(`[onUnload] Error stopping MQTT cloud client: !${ex.message}`);
      }
      try {
        await ((_d = (_c = this.localMqttService) == null ? void 0 : _c.mqttClient) == null ? void 0 : _d.endAsync());
        this.log.info("[onUnload] MQTT local client stopped!");
        this.localMqttService = void 0;
      } catch (ex) {
        this.log.error(`[onUnload] Error stopping MQTT local client: !${ex.message}`);
      }
      this.setState("info.connection", false, true);
      if (this.resetValuesJob) {
        this.resetValuesJob.cancel();
        this.resetValuesJob = void 0;
      }
      if (this.checkStatesJob) {
        (_e = this.checkStatesJob) == null ? void 0 : _e.cancel();
        this.checkStatesJob = void 0;
      }
      if (this.calculationJob) {
        this.calculationJob.cancel();
        this.calculationJob = void 0;
      }
      if (this.zenSdkDataRefreshJob) {
        this.zenSdkDataRefreshJob.cancel();
        this.zenSdkDataRefreshJob = void 0;
      }
      if (this.adapterAutomationMetricsJob) {
        this.adapterAutomationMetricsJob.cancel();
        this.adapterAutomationMetricsJob = void 0;
      }
      if (this.adapterAutomationSortJob) {
        this.adapterAutomationSortJob.cancel();
        this.adapterAutomationSortJob = void 0;
      }
      this.zenIobDeviceList.forEach((device) => device.stopZenSdkPollingSchedule());
      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
      }
      if (this.deviceStatisticsTimeout) {
        this.clearTimeout(this.deviceStatisticsTimeout);
      }
      if (this.deviceStatisticsInterval) {
        this.clearInterval(this.deviceStatisticsInterval);
      }
      callback();
    } catch {
      callback();
    }
  }
  /**
   * Is called if a subscribed state changes
   *
   * @param id
   * @param state
   */
  onStateChange(id, state) {
    if (state) {
      if (this.config.automationTriggerStateId && id === this.config.automationTriggerStateId) {
        this.onAutomationTriggerStateChange(state);
        return;
      }
      if (id === `${this.namespace}.adapterAutomation.automationEnabled`) {
        this.onAdapterAutomationEnabledChange(state);
        return;
      }
      const splitted = id.split(".");
      const productKey = splitted[2];
      const deviceKey = splitted[3];
      const stateName1 = splitted[4];
      const stateName2 = splitted[5];
      const _device = this.zenIobDeviceList.find((x) => x.productKey == productKey && x.deviceKey == deviceKey);
      if (!_device) {
        this.log.error(`[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`);
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
              case "gridReverse":
                _device.setGridReverse(Number(state.val));
                break;
              case "gridOffMode":
                _device.setGridOffMode(Number(state.val));
                break;
              case "autoModel":
                _device.setAutoModel(Number(state.val));
                break;
              case "autoRecover":
                _device.setAutoRecover(state.val ? true : false);
                break;
              case "inverseMaxPower":
                _device.setInverseMaxPower(Number(state.val));
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
              case "hemsState":
                _device.setHemsState(state.val ? true : false);
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
  /**
   * Is called when the user-configured automation trigger state (an external state outside this adapter,
   * typically a grid meter's current power) changes value. Drives the adapterAutomation zero feed-in
   * control loop (see services/adapterAutomation/adapterAutomation.ts).
   *
   * @param state the new state of the automation trigger state
   */
  onAutomationTriggerStateChange(state) {
    if (state.val == null || Number.isNaN(Number(state.val))) {
      this.log.warn(
        `[onAutomationTriggerStateChange] Automation trigger state has a non-numeric value (${state.val}), ignoring!`
      );
      return;
    }
    void (0, import_adapterAutomation.runZeroFeedInAutomation)(this, Number(state.val));
  }
  /**
   * Is called when 'adapterAutomation.automationEnabled' changes value. Logs the new state, and warns if
   * automation was enabled without an automation trigger state configured, since it would then never run.
   *
   * @param state the new state of 'adapterAutomation.automationEnabled'
   */
  onAdapterAutomationEnabledChange(state) {
    const enabled = state.val === true;
    this.log.info(`[onAdapterAutomationEnabledChange] Adapter automation ${enabled ? "enabled" : "disabled"}!`);
    (0, import_adapterAutomation.resetAdapterAutomationController)(this);
    if (enabled && !this.config.automationTriggerStateId) {
      this.log.error(
        "[onAdapterAutomationEnabledChange] Adapter automation was enabled, but no automation trigger state is configured in the adapter settings - automation will never run!"
      );
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
