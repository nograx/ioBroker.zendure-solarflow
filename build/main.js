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
var import_mdnsDiscoveryService = require("./services/mdnsDiscoveryService");
var import_helpers = require("./helpers/helpers");
var import_fileHelper = require("./helpers/fileHelper");
const CONTROL_STATE_HANDLERS = {
  setOutputLimit: (device, value) => device.setOutputLimit(Number(value)),
  setInputLimit: (device, value) => device.setInputLimit(Number(value)),
  chargeLimit: (device, value) => device.setChargeLimit(Number(value)),
  dischargeLimit: (device, value) => device.setDischargeLimit(Number(value)),
  passMode: (device, value) => device.setPassMode(Number(value)),
  dcSwitch: (device, value) => device.setDcSwitch(Boolean(value)),
  acSwitch: (device, value) => device.setAcSwitch(Boolean(value)),
  acMode: (device, value) => device.setAcMode(Number(value)),
  hubState: (device, value) => device.setHubState(Number(value)),
  gridReverse: (device, value) => device.setGridReverse(Number(value)),
  gridOffMode: (device, value) => device.setGridOffMode(Number(value)),
  autoModel: (device, value) => device.setAutoModel(Number(value)),
  autoRecover: (device, value) => device.setAutoRecover(Boolean(value)),
  inverseMaxPower: (device, value) => device.setInverseMaxPower(Number(value)),
  buzzerSwitch: (device, value) => device.setBuzzerSwitch(Boolean(value)),
  smartMode: (device, value) => device.setSmartMode(Boolean(value)),
  setDeviceAutomationInOutLimit: (device, value) => device.setDeviceAutomationInOutLimit(Number(value)),
  hemsState: (device, value) => device.setHemsState(Boolean(value))
};
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
  mdnsDiscoveryService = void 0;
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
    var _a;
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
            de: "Vom Adapter empfohlene maximale Ausgangsleistung ignorieren",
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
      await this.extendObject("adapterAutomation.acOnlyPenalty", {
        type: "state",
        common: {
          name: {
            de: "Bewertungsabschlag f\xFCr reine AC-Ger\xE4te",
            en: "Score penalty for AC-only devices"
          },
          type: "number",
          desc: "acOnlyPenalty",
          role: "level",
          read: true,
          write: true,
          unit: "%",
          min: 0,
          def: 50
        },
        native: {}
      });
      await this.extendObject("adapterAutomation.deviceOrder", {
        type: "state",
        common: {
          name: {
            de: "Ger\xE4tereihenfolge",
            en: "Device order"
          },
          type: "string",
          desc: "deviceOrder",
          role: "text",
          read: true,
          write: false
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
      await ensureDefaultValue("adapterAutomation.acOnlyPenalty", 50);
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
        if (typeof data === "string" || data == void 0) {
          this.setState("info.connection", false, true);
          try {
            const fileDeviceList = await fileHelper.readDeviceListFromFile();
            if (fileDeviceList) {
              deviceList = fileDeviceList;
              this.log.info(
                "[onReady] No connection to Zendure Cloud possible, but device list found in file. Using device list from file."
              );
            } else {
              this.log.error("[onReady] No connection to Zendure Cloud possible and no device list found in file!");
            }
          } catch (err) {
            this.log.error(
              `[onReady] No connection to Zendure Cloud possible and error reading device list from file: ${err == null ? void 0 : err.message}!`
            );
          }
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
          const existingDeviceTreeIds = await this.getExistingDeviceTreeIds();
          for (const device of deviceList) {
            const treeKeys = this.getStateTreeKeys(device, existingDeviceTreeIds);
            let deviceModel = (0, import_helpers.createDeviceModel)(this, treeKeys.productKey, treeKeys.deviceKey, device);
            if (!deviceModel && treeKeys.productKey != device.productKey) {
              deviceModel = (0, import_helpers.createDeviceModel)(this, device.productKey, device.deviceKey, device);
            }
            if (deviceModel) {
              this.zenIobDeviceList.push(deviceModel);
            } else {
              const message = `[onReady] Unknown device with productKey '${device.productKey}' / deviceKey '${device.deviceKey}' / productModel '${device.productModel}'`;
              this.log.info(
                `${message}, can't create it from the cloud device list. If it supports zenSDK, it is added via mDNS discovery instead.`
              );
              if (this.supportsFeature && this.supportsFeature("PLUGINS")) {
                const sentryInstance = this.getPluginInstance("sentry");
                (_a = sentryInstance == null ? void 0 : sentryInstance.getSentryObject()) == null ? void 0 : _a.captureMessage(message, "error");
              }
            }
          }
        }
        this.startMdnsDiscovery();
        if (this.config.useZenSDK) {
          (0, import_jobSchedule.startZenSdkDataRefreshJob)(this);
        }
        break;
      }
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");
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
        this.startMdnsDiscovery();
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
   * Returns the ids ('<productKey>.<deviceKey>') of all existing device state trees of this instance.
   */
  async getExistingDeviceTreeIds() {
    const channels = await this.getObjectViewAsync("system", "channel", {
      startkey: `${this.namespace}.`,
      endkey: `${this.namespace}.\u9999`
    });
    return channels.rows.map((row) => row.id.substring(this.namespace.length + 1)).filter((id) => id.split(".").length === 2);
  }
  /**
   * Returns the keys of the state tree for a device from the cloud device list. A device that was created via mDNS
   * before (placeholder productKey and/or serial number as deviceKey) keeps its existing state tree, so scripts,
   * visualizations and history keep working. MQTT still uses the cloud keys (see ZenIobDevice.mqttProductKey).
   * An existing state tree with the cloud keys always has priority.
   *
   * @param device the device from the cloud device list
   * @param existingDeviceTreeIds the existing device state trees (see getExistingDeviceTreeIds)
   */
  getStateTreeKeys(device, existingDeviceTreeIds) {
    const cloudKeys = { productKey: device.productKey, deviceKey: device.deviceKey };
    const cloudTreeId = `${device.productKey.replace(this.FORBIDDEN_CHARS, "")}.${device.deviceKey.replace(this.FORBIDDEN_CHARS, "")}`;
    if (!device.snNumber || existingDeviceTreeIds.includes(cloudTreeId)) {
      return cloudKeys;
    }
    const snNumber = device.snNumber.toUpperCase();
    const existingTreeId = existingDeviceTreeIds.find((id) => id.split(".")[1].toUpperCase() === snNumber);
    if (!existingTreeId) {
      return cloudKeys;
    }
    const [productKey, deviceKey] = existingTreeId.split(".");
    this.log.info(
      `[onReady] Device '${device.productModel}' (${device.productKey}/${device.deviceKey}) was created via mDNS before, keeping its existing states at '${existingTreeId}'!`
    );
    return { productKey, deviceKey };
  }
  /**
   * Starts the continuous mDNS discovery of Zendure devices, if enabled.
   */
  startMdnsDiscovery() {
    if (!this.config.useMdnsDiscovery) {
      this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
      return;
    }
    this.mdnsDiscoveryService = new import_mdnsDiscoveryService.MdnsDiscoveryService(this);
    this.mdnsDiscoveryService.start();
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
    var _a, _b, _c, _d;
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }
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
      (_b = this.mdnsDiscoveryService) == null ? void 0 : _b.stop();
      this.mdnsDiscoveryService = void 0;
      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
      }
      if (this.deviceStatisticsTimeout) {
        this.clearTimeout(this.deviceStatisticsTimeout);
      }
      if (this.deviceStatisticsInterval) {
        this.clearInterval(this.deviceStatisticsInterval);
      }
      const cloudMqttService = this.cloudMqttService;
      const localMqttService = this.localMqttService;
      this.cloudMqttService = void 0;
      this.localMqttService = void 0;
      const [cloudResult, localResult] = await Promise.allSettled([
        cloudMqttService == null ? void 0 : cloudMqttService.disconnect(),
        localMqttService == null ? void 0 : localMqttService.disconnect()
      ]);
      if (cloudMqttService) {
        if (cloudResult.status === "rejected") {
          this.log.error(`[onUnload] Error stopping MQTT cloud client: ${(_c = cloudResult.reason) == null ? void 0 : _c.message}`);
        } else {
          this.log.info("[onUnload] MQTT cloud client stopped!");
        }
      }
      if (localMqttService) {
        if (localResult.status === "rejected") {
          this.log.error(`[onUnload] Error stopping MQTT local client: ${(_d = localResult.reason) == null ? void 0 : _d.message}`);
        } else {
          this.log.info("[onUnload] MQTT local client stopped!");
        }
      }
      await this.setState("info.connection", false, true);
    } catch {
    } finally {
      callback();
    }
  }
  /**
   * Is called if a subscribed state changes
   *
   * @param id full state id, e.g. 'zendure-solarflow.0.<productKey>.<deviceKey>.control.setOutputLimit'
   * @param state the new state, or null/undefined if it was deleted
   */
  onStateChange(id, state) {
    if (!state) {
      return;
    }
    if (this.config.automationTriggerStateId && id === this.config.automationTriggerStateId) {
      this.onAutomationTriggerStateChange(state);
      return;
    }
    if (id === `${this.namespace}.adapterAutomation.automationEnabled`) {
      this.onAdapterAutomationEnabledChange(state);
      return;
    }
    const [, , productKey, deviceKey, folder, stateName] = id.split(".");
    const device = this.zenIobDeviceList.find((x) => x.productKey == productKey && x.deviceKey == deviceKey);
    if (!device) {
      this.log.error(`[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`);
      return;
    }
    if (state.val == null || state.ack) {
      return;
    }
    if (folder === "control") {
      this.onControlStateChange(device, stateName, state.val);
    } else if (folder === "adapterAutomation" && stateName === "automationEnabled") {
      this.onDeviceAutomationEnabledChange(device, state);
    }
  }
  /**
   * Is called when a device's control state was written (ack == false): forwards the value to the device.
   *
   * @param device the device the control state belongs to
   * @param stateName name of the control state, like 'setOutputLimit'
   * @param value the new value
   */
  onControlStateChange(device, stateName, value) {
    this.log.debug(`[onStateChange] Control state '${stateName}' changed, new value is ${value}!`);
    const handler = CONTROL_STATE_HANDLERS[stateName];
    if (handler) {
      void handler(device, value);
    }
  }
  /**
   * Is called when a device's 'adapterAutomation.automationEnabled' was written (ack == false): releases the
   * device's automation limit to 0 when automation was switched off for it.
   *
   * @param device the device the state belongs to
   * @param state the new state
   */
  onDeviceAutomationEnabledChange(device, state) {
    if (state.val === true || state.lc !== state.ts) {
      return;
    }
    this.log.info(`[onDeviceAutomationEnabledChange] Adapter automation disabled for device '${device.deviceKey}'!`);
    void (0, import_adapterAutomation.stopDeviceAutomation)(this, device);
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
   * Is called when 'adapterAutomation.automationEnabled' changes value. Logs the new state, sets all automation
   * device limits to 0 when automation is switched off, and warns if automation was enabled without an
   * automation trigger state configured, since it would then never run.
   *
   * @param state the new state of 'adapterAutomation.automationEnabled'
   */
  onAdapterAutomationEnabledChange(state) {
    const enabled = state.val === true;
    this.log.info(`[onAdapterAutomationEnabledChange] Adapter automation ${enabled ? "enabled" : "disabled"}!`);
    (0, import_adapterAutomation.resetAdapterAutomationController)(this);
    if (!enabled && state.lc === state.ts) {
      void (0, import_adapterAutomation.stopAdapterAutomation)(this);
    }
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
