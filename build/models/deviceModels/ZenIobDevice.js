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
var ZenIobDevice_exports = {};
__export(ZenIobDevice_exports, {
  ZenIobDevice: () => ZenIobDevice
});
module.exports = __toCommonJS(ZenIobDevice_exports);
var import_node_crypto = require("node:crypto");
var import_constants = require("../../constants/sensorStates/constants");
var import_createCalculationStates = require("../../helpers/createCalculationStates");
var import_timeHelper = require("../../helpers/timeHelper");
var import_mqttSharedService = require("../../services/mqtt/mqttSharedService");
var import_enums = require("../../helpers/enums");
var import_axios = __toESM(require("axios"));
var import_processDeviceProperties = require("../../helpers/processDeviceProperties");
var import_allStates = require("../../constants/sensorStates/allStates");
var import_node_schedule = require("node-schedule");
const zenSdkPollingSettingsStates = [
  {
    title: "zenSDKPollingEnabled",
    nameDe: "zenSDK Abfrage aktiviert",
    nameEn: "zenSDK polling enabled",
    type: "boolean",
    role: "switch.enable",
    read: true,
    write: true,
    def: true
  },
  {
    title: "zenSDKPollingInverval",
    nameDe: "zenSDK Abfrageintervall",
    nameEn: "zenSDK polling interval",
    type: "number",
    role: "level.interval",
    read: true,
    write: true,
    min: 1,
    max: 30,
    unit: "s",
    def: 5
  }
];
class ZenIobDevice {
  zenIobDeviceDetails;
  adapter;
  deviceConnectionMode = void 0;
  productKey;
  deviceKey;
  snNumber = void 0;
  productName;
  deviceName;
  ipAddress = void 0;
  messageId = 0;
  batteries = [];
  iotTopic = void 0;
  functionTopic = void 0;
  password = "";
  isZenSdkSupported;
  // No initializer - let derived classes set this
  maxInputLimit = 0;
  maxOutputLimit = 0;
  controlStates = [];
  /** Whether this device reports battery packData (false for read-only devices like the Smart Meter 3CT/D0). */
  hasPackData = true;
  zenSdkErrorCount = 0;
  zenSdkPausedUntil = 0;
  static ZEN_SDK_MAX_ERROR_LOGS = 5;
  static ZEN_SDK_PAUSE_DURATION_MS = 10 * 60 * 1e3;
  /** Per-device zenSDK polling job, scheduled with the interval configured in 'settings.ZenSDKPollingInverval'. */
  zenSdkPollingJob;
  zenSdkPollingIntervalSeconds;
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, isZenSdkSupported, _zenIobDeviceDetails) {
    this.zenIobDeviceDetails = _zenIobDeviceDetails;
    this.adapter = _adapter;
    this.productKey = _productKey;
    this.deviceKey = _deviceKey;
    this.deviceName = _deviceName;
    this.productName = _productName;
    this.isZenSdkSupported = isZenSdkSupported;
    this.iotTopic = `iot/${_productKey}/${_deviceKey}/properties/write`;
    this.functionTopic = `iot/${_productKey}/${_deviceKey}/function/invoke`;
    this.createSolarFlowStates();
    if (_zenIobDeviceDetails) {
      this.updateSolarFlowStatesFromDeviceDetails(_zenIobDeviceDetails);
    }
    this.password = (0, import_node_crypto.createHash)("md5").update(_deviceKey, "utf8").digest("hex").toUpperCase().substring(8, 24);
    this.adapter.log.debug(
      `[ZenIobDevice] useZenSDK for device ${this.deviceKey}: Supported=${this.isZenSdkSupported} Config=${this.adapter.config.useZenSDK}`
    );
    if (this.adapter.config.useZenSDK && this.isZenSdkSupported) {
      this.getZenSdkProperties().then((success) => {
        if (success) {
          this.deviceConnectionMode = import_enums.DeviceConnectionMode.zenSDK;
          this.updateSolarFlowState("connectionMode", "zenSDK");
          this.updateSolarFlowState("wifiState", 1);
        } else {
          this.updateSolarFlowState("wifiState", 0);
        }
      }).catch(() => {
        this.updateSolarFlowState("wifiState", 0);
        this.setupMqttConnection();
      });
    } else {
      this.setupMqttConnection();
    }
  }
  setupMqttConnection() {
    this.subscribeReportTopic();
    this.subscribeIotTopic();
    this.adapter.setTimeout(() => {
      this.triggerFullTelemetryUpdate();
    }, 5e3);
  }
  async updateSolarFlowStatesFromDeviceDetails(zenIobDeviceDetails) {
    var _a;
    if (zenIobDeviceDetails == null ? void 0 : zenIobDeviceDetails.online) {
      this.updateSolarFlowState("wifiState", 1);
    } else if ((zenIobDeviceDetails == null ? void 0 : zenIobDeviceDetails.online) == false) {
      this.updateSolarFlowState("wifiState", 0);
    }
    if (zenIobDeviceDetails.productModel) {
      this.updateSolarFlowState("productName", zenIobDeviceDetails.productModel);
    }
    if (zenIobDeviceDetails.ip) {
      this.ipAddress = zenIobDeviceDetails.ip;
      this.updateSolarFlowState("ip", zenIobDeviceDetails.ip);
    }
    if (zenIobDeviceDetails.snNumber) {
      this.snNumber = zenIobDeviceDetails.snNumber;
      this.updateSolarFlowState("snNumber", zenIobDeviceDetails.snNumber);
    }
    if (zenIobDeviceDetails.deviceName) {
      this.updateSolarFlowState("name", zenIobDeviceDetails.deviceName);
    }
    if (zenIobDeviceDetails.protocol == "mqtt" && zenIobDeviceDetails.server && zenIobDeviceDetails.port) {
      await ((_a = this.adapter) == null ? void 0 : _a.extendObject(`${this.productKey}.${this.deviceKey}.mqttServer`, {
        type: "state",
        common: {
          name: {
            de: "MQTT Server",
            en: "MQTT Server"
          },
          type: "string",
          desc: "MQTT Server",
          role: "value",
          read: true,
          write: false,
          unit: "",
          states: {}
        },
        native: {}
      }));
      this.updateSolarFlowState("mqttServer", `${zenIobDeviceDetails.server}:${zenIobDeviceDetails.port}`);
    }
  }
  async createSolarFlowStates() {
    var _a, _b, _c, _d, _e, _f, _g;
    const productKey = this.productKey.replace(this.adapter.FORBIDDEN_CHARS, "");
    const deviceKey = this.deviceKey.replace(this.adapter.FORBIDDEN_CHARS, "");
    this.adapter.log.debug(
      `[createSolarFlowStates] Creating or updating SolarFlow states for ${this.productName} (${productKey}/${deviceKey}) and name '${this.deviceName}'.`
    );
    await ((_a = this.adapter) == null ? void 0 : _a.extendObject(productKey, {
      type: "device",
      common: {
        name: {
          de: `${this.productName} (${productKey})`,
          en: `${this.productName} (${productKey})`
        }
      },
      native: {}
    }));
    await ((_b = this.adapter) == null ? void 0 : _b.extendObject(`${productKey}.${deviceKey}`, {
      type: "channel",
      common: {
        name: {
          de: `${this.deviceName} (${deviceKey})`,
          en: `${this.deviceName} (${deviceKey})`
        }
      },
      native: {}
    }));
    const lastUpdateState = import_allStates.allStates.lastUpdate;
    await ((_c = this.adapter) == null ? void 0 : _c.extendObject(`${productKey}.${deviceKey}.lastUpdate`, {
      type: "state",
      common: {
        name: {
          de: lastUpdateState.nameDe,
          en: lastUpdateState.nameEn
        },
        type: lastUpdateState.type,
        desc: lastUpdateState.title,
        role: lastUpdateState.role,
        read: true,
        write: false,
        unit: lastUpdateState.unit
      },
      native: {}
    }));
    if (this.hasPackData) {
      await ((_d = this.adapter) == null ? void 0 : _d.extendObject(`${productKey}.${deviceKey}.packData`, {
        type: "channel",
        common: {
          name: {
            de: "Batterie Packs",
            en: "Battery packs"
          }
        },
        native: {}
      }));
    }
    if (this.controlStates.length > 0) {
      await ((_e = this.adapter) == null ? void 0 : _e.extendObject(`${productKey}.${deviceKey}.control`, {
        type: "channel",
        common: {
          name: {
            de: `Steuerung f\xFCr Ger\xE4t ${deviceKey}`,
            en: `Control for device ${deviceKey}`
          }
        },
        native: {}
      }));
      this.controlStates.forEach(async (state) => {
        var _a2, _b2, _c2, _d2;
        const stateId = `${productKey}.${deviceKey}.control.${state.title}`;
        await ((_a2 = this.adapter) == null ? void 0 : _a2.extendObject(stateId, {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: true,
            unit: state.unit,
            states: state.states,
            def: state.def
          },
          native: {}
        }));
        if (state.def !== void 0) {
          const current = await ((_b2 = this.adapter) == null ? void 0 : _b2.getStateAsync(stateId));
          if (!current || current.val === null || current.val === void 0) {
            await ((_c2 = this.adapter) == null ? void 0 : _c2.setState(stateId, state.def, true));
          }
        }
        (_d2 = this.adapter) == null ? void 0 : _d2.subscribeStates(`${productKey}.${deviceKey}.control.${state.title}`);
      });
    }
    if (this.isZenSdkSupported) {
      await ((_f = this.adapter) == null ? void 0 : _f.extendObject(`${productKey}.${deviceKey}.settings`, {
        type: "channel",
        common: {
          name: {
            de: `ioBroker Einstellungen f\xFCr Ger\xE4t ${deviceKey}`,
            en: `ioBroker settings for device ${deviceKey}`
          }
        },
        native: {}
      }));
      zenSdkPollingSettingsStates.forEach(async (state) => {
        var _a2, _b2, _c2, _d2;
        const stateId = `${productKey}.${deviceKey}.settings.${state.title}`;
        await ((_a2 = this.adapter) == null ? void 0 : _a2.extendObject(stateId, {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: true,
            unit: state.unit,
            min: state.min,
            max: state.max,
            def: state.def
          },
          native: {}
        }));
        if (state.def !== void 0) {
          const current = await ((_b2 = this.adapter) == null ? void 0 : _b2.getStateAsync(stateId));
          if (!current || current.val === null || current.val === void 0) {
            await ((_c2 = this.adapter) == null ? void 0 : _c2.setState(stateId, state.def, true));
          }
        }
        (_d2 = this.adapter) == null ? void 0 : _d2.subscribeStates(stateId);
      });
      await this.syncZenSdkPollingSchedule();
    }
    if (this.adapter.config.useCalculation) {
      await ((_g = this.adapter) == null ? void 0 : _g.extendObject(`${productKey}.${deviceKey}.calculations`, {
        type: "channel",
        common: {
          name: {
            de: `Berechnungen f\xFCr Ger\xE4t ${deviceKey}`,
            en: `Calculations for Device ${deviceKey}`
          }
        },
        native: {}
      }));
      await (0, import_createCalculationStates.createCalculationStates)(this.adapter, productKey, deviceKey);
    }
  }
  getZenSdkProperties() {
    if (Date.now() < this.zenSdkPausedUntil) {
      this.adapter.log.debug(
        `[getZenSdkProperties] Skipping poll for device ${this.deviceKey}, paused until ${new Date(
          this.zenSdkPausedUntil
        ).toString()} after repeated errors!`
      );
      return Promise.resolve(false);
    }
    this.adapter.log.debug(`[getZenSdkProperties] Getting properties with zenSDK for device ${this.deviceKey}!`);
    if (this.ipAddress) {
      const headers = {
        "Content-Type": "application/json"
      };
      const config = {
        headers,
        timeout: 4e3
      };
      return import_axios.default.get(`http://${this.ipAddress}/properties/report`, config).then(async (response) => {
        var _a;
        const data = await response.data;
        this.zenSdkErrorCount = 0;
        this.adapter.log.debug(
          `[getZenSdkProperties] Successfully got properties for device ${this.deviceKey} with zenSDK!}`
        );
        const {
          properties,
          packData,
          timestamp,
          messageId,
          deviceId,
          sn,
          success,
          output,
          isHA,
          ...directProperties
        } = data;
        const propertiesToProcess = { ...properties != null ? properties : {}, ...directProperties };
        if (Object.keys(propertiesToProcess).length > 0) {
          (0, import_processDeviceProperties.processDeviceProperties)(this, propertiesToProcess, true);
          await ((_a = this.adapter) == null ? void 0 : _a.setState(`${this.productKey}.${this.deviceKey}.lastUpdate`, (/* @__PURE__ */ new Date()).getTime(), true));
          this.updateSolarFlowState("wifiState", 1);
        }
        if (packData) {
          this.addOrUpdatePackData(packData, true);
        }
        return true;
      }).catch((error) => {
        this.zenSdkErrorCount++;
        if (this.zenSdkErrorCount <= ZenIobDevice.ZEN_SDK_MAX_ERROR_LOGS) {
          this.adapter.log.warn(
            `[getZenSdkProperties] Error getting properties for device ${this.deviceKey} with zenSDK: ${error}`
          );
        }
        if (this.zenSdkErrorCount >= ZenIobDevice.ZEN_SDK_MAX_ERROR_LOGS) {
          this.adapter.log.warn(
            `[getZenSdkProperties] Reached ${ZenIobDevice.ZEN_SDK_MAX_ERROR_LOGS} consecutive errors for device ${this.deviceKey}, pausing zenSDK polling for ${ZenIobDevice.ZEN_SDK_PAUSE_DURATION_MS / 6e4} minutes!`
          );
          this.zenSdkPausedUntil = Date.now() + ZenIobDevice.ZEN_SDK_PAUSE_DURATION_MS;
          this.zenSdkErrorCount = 0;
        }
        this.updateSolarFlowState("wifiState", 0);
        return false;
      });
    }
    this.adapter.log.warn(`[getZenSdkProperties] IP address is not defined for device ${this.deviceKey}!`);
    return Promise.resolve(false);
  }
  /**
   * Starts, stops or reschedules the per-device zenSDK polling job based on the current
   * 'settings.ZenSDKPollingEnabled' / 'settings.ZenSDKPollingInverval' state values.
   * Called periodically by the zenSDK data refresh job so that changes to those states take effect.
   */
  async syncZenSdkPollingSchedule() {
    var _a;
    if (!this.isZenSdkSupported || !this.adapter.config.useZenSDK) {
      return;
    }
    const productKey = this.productKey.replace(this.adapter.FORBIDDEN_CHARS, "");
    const deviceKey = this.deviceKey.replace(this.adapter.FORBIDDEN_CHARS, "");
    const enabledState = await this.adapter.getStateAsync(`${productKey}.${deviceKey}.settings.ZenSDKPollingEnabled`);
    const pollingEnabled = (enabledState == null ? void 0 : enabledState.val) !== false;
    if (!pollingEnabled) {
      if (this.zenSdkPollingJob) {
        this.adapter.log.info(
          `[syncZenSdkPollingSchedule] zenSDK polling disabled for device ${this.deviceKey}, stopping polling job!`
        );
        this.zenSdkPollingJob.cancel();
        this.zenSdkPollingJob = void 0;
        this.zenSdkPollingIntervalSeconds = void 0;
      }
      return;
    }
    const intervalState = await this.adapter.getStateAsync(`${productKey}.${deviceKey}.settings.ZenSDKPollingInverval`);
    let intervalSeconds = Number((_a = intervalState == null ? void 0 : intervalState.val) != null ? _a : 5);
    if (!Number.isFinite(intervalSeconds)) {
      intervalSeconds = 5;
    }
    intervalSeconds = Math.min(30, Math.max(1, Math.round(intervalSeconds)));
    if (this.zenSdkPollingJob && this.zenSdkPollingIntervalSeconds === intervalSeconds) {
      return;
    }
    if (this.zenSdkPollingJob) {
      this.adapter.log.info(
        `[syncZenSdkPollingSchedule] zenSDK polling interval changed for device ${this.deviceKey}, restarting polling job with an interval of ${intervalSeconds}s!`
      );
      this.zenSdkPollingJob.cancel();
      this.zenSdkPollingJob = void 0;
    } else {
      this.adapter.log.info(
        `[syncZenSdkPollingSchedule] Starting zenSDK polling job for device ${this.deviceKey} with an interval of ${intervalSeconds}s!`
      );
    }
    this.zenSdkPollingIntervalSeconds = intervalSeconds;
    this.zenSdkPollingJob = (0, import_node_schedule.scheduleJob)(`*/${intervalSeconds} * * * * *`, () => {
      void this.getZenSdkProperties();
    });
  }
  /** Cancels the per-device zenSDK polling job, if one is running. Called on adapter unload. */
  stopZenSdkPollingSchedule() {
    if (this.zenSdkPollingJob) {
      this.zenSdkPollingJob.cancel();
      this.zenSdkPollingJob = void 0;
      this.zenSdkPollingIntervalSeconds = void 0;
    }
  }
  /**
   * Called by mdnsHelper when this device was discovered locally via mDNS. Fills in the
   * ipAddress if it is not yet known, or corrects it if it no longer matches the
   * mDNS-discovered address (e.g. a stale/wrong IP from the cloud device list), then
   * switches the device to a zenSDK connection (instead of Cloud/MQTT) if zenSDK is
   * supported and enabled.
   *
   * @param ipAddress the IP address the device was discovered at
   * @param serviceName the mDNS service name the device was discovered with (for logging)
   * @param serviceHost the mDNS service host the device was discovered with (for logging)
   */
  connectViaMdns(ipAddress, serviceName, serviceHost) {
    if (this.ipAddress !== ipAddress) {
      if (this.ipAddress) {
        this.adapter.log.info(
          `[connectViaMdns] Correcting stale IP for device ${this.deviceKey}: ${this.ipAddress} -> ${ipAddress} (mDNS service: ${serviceName})!`
        );
      }
      this.ipAddress = ipAddress;
      this.updateSolarFlowState("ip", ipAddress);
    }
    if (!this.adapter.config.useZenSDK || !this.isZenSdkSupported || this.deviceConnectionMode == import_enums.DeviceConnectionMode.zenSDK) {
      this.adapter.log.warn(
        `[connectViaMdns] Skipping zenSDK connect for device ${this.deviceKey} (useZenSDK=${this.adapter.config.useZenSDK}, isZenSdkSupported=${this.isZenSdkSupported}, deviceConnectionMode=${this.deviceConnectionMode})!`
      );
      return;
    }
    this.getZenSdkProperties().then((success) => {
      if (success) {
        this.deviceConnectionMode = import_enums.DeviceConnectionMode.zenSDK;
        this.updateSolarFlowState("connectionMode", "zenSDK");
        this.updateSolarFlowState("wifiState", 1);
        this.unsubscribeMqttTopics();
        this.adapter.log.info(
          `[connectViaMdns] Switched device ${this.deviceKey} to zenSDK connection via mDNS-discovered IP ${ipAddress} (service: ${serviceName}, host: ${serviceHost})!`
        );
      }
    }).catch(() => {
    });
  }
  unsubscribeMqttTopics() {
    var _a, _b, _c, _d;
    const reportTopic = `/${this.productKey}/${this.deviceKey}/#`;
    const iotSubscribeTopic = `iot/${this.productKey}/${this.deviceKey}/#`;
    if ((_b = (_a = this.adapter) == null ? void 0 : _a.cloudMqttService) == null ? void 0 : _b.mqttClient) {
      this.adapter.log.debug(
        `[unsubscribeMqttTopics] Unsubscribing from MQTT Topics for device ${this.deviceKey} (Cloud)`
      );
      this.adapter.cloudMqttService.mqttClient.unsubscribe(reportTopic);
      this.adapter.cloudMqttService.mqttClient.unsubscribe(iotSubscribeTopic);
    }
    if ((_d = (_c = this.adapter) == null ? void 0 : _c.localMqttService) == null ? void 0 : _d.mqttClient) {
      this.adapter.log.debug(
        `[unsubscribeMqttTopics] Unsubscribing from MQTT Topics for device ${this.deviceKey} (Local)`
      );
      this.adapter.localMqttService.mqttClient.unsubscribe(reportTopic);
      this.adapter.localMqttService.mqttClient.unsubscribe(iotSubscribeTopic);
    }
  }
  async axiosPostWithRetry(url, data, config, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await import_axios.default.post(url, data, config);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          this.adapter.log.warn(
            `[retryAxiosPost] Request failed (attempt ${attempt}/${maxRetries}), retrying... Error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
    throw lastError;
  }
  writeZenSdkProperties(properties) {
    this.adapter.log.debug(
      `[writeZenSdkProperties] Writing properties with zenSDK for device ${this.deviceKey}: ${properties}`
    );
    if (this.ipAddress) {
      const headers = {
        "Content-Type": "application/json"
      };
      const config = {
        headers,
        timeout: 4e3
      };
      return this.axiosPostWithRetry(
        `http://${this.ipAddress}/properties/write`,
        {
          sn: this.snNumber,
          // Required
          properties: JSON.parse(properties)
        },
        config
      ).then((response) => {
        this.adapter.log.debug(
          `[writeZenSdkProperties] Successfully wrote properties for device ${this.deviceKey} with zenSDK: ${properties} / status: ${response.status}`
        );
        return true;
      }).catch((error) => {
        this.adapter.log.error(
          `[writeZenSdkProperties] Error writing properties with zenSDK for device ${this.deviceKey}: ${error}`
        );
        return false;
      });
    }
    this.adapter.log.warn(`[writeZenSdkProperties] IP address is not defined for device ${this.deviceKey}!`);
    return Promise.resolve(false);
  }
  writeMqttProperties(properties) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!this.iotTopic) {
      this.adapter.log.warn(`[writeMqttProperties] IoT topic is not defined for device ${this.deviceKey}!`);
      return false;
    }
    if (this.productKey && this.deviceKey) {
      this.messageId += 1;
      if (((_b = (_a = this.adapter) == null ? void 0 : _a.localMqttService) == null ? void 0 : _b.mqttClient) && (this.deviceConnectionMode == import_enums.DeviceConnectionMode.LocalMqtt || this.deviceConnectionMode == import_enums.DeviceConnectionMode.LocalMqttWithCloudRelay)) {
        (_e = (_d = (_c = this.adapter) == null ? void 0 : _c.localMqttService) == null ? void 0 : _d.mqttClient) == null ? void 0 : _e.publish(this.iotTopic, properties, { qos: 1 });
      } else if ((_g = (_f = this.adapter) == null ? void 0 : _f.cloudMqttService) == null ? void 0 : _g.mqttClient) {
        (_j = (_i = (_h = this.adapter) == null ? void 0 : _h.cloudMqttService) == null ? void 0 : _i.mqttClient) == null ? void 0 : _j.publish(this.iotTopic, properties, { qos: 1 });
      }
    }
    return true;
  }
  invokeMqttFunction(properties) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!this.functionTopic) {
      this.adapter.log.error(`[invokeMqttFunction] Function topic is not defined for device ${this.deviceKey}!`);
      return;
    }
    if (this.productKey && this.deviceKey) {
      if (((_b = (_a = this.adapter) == null ? void 0 : _a.localMqttService) == null ? void 0 : _b.mqttClient) && (this.deviceConnectionMode == import_enums.DeviceConnectionMode.LocalMqtt || this.deviceConnectionMode == import_enums.DeviceConnectionMode.LocalMqttWithCloudRelay)) {
        (_e = (_d = (_c = this.adapter) == null ? void 0 : _c.localMqttService) == null ? void 0 : _d.mqttClient) == null ? void 0 : _e.publish(this.functionTopic, properties, { qos: 1 });
      } else if ((_g = (_f = this.adapter) == null ? void 0 : _f.cloudMqttService) == null ? void 0 : _g.mqttClient) {
        (_j = (_i = (_h = this.adapter) == null ? void 0 : _h.cloudMqttService) == null ? void 0 : _i.mqttClient) == null ? void 0 : _j.publish(this.functionTopic, properties, { qos: 1 });
      }
    }
  }
  subscribeReportTopic() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
    const reportTopic = `/${this.productKey}/${this.deviceKey}/#`;
    if (this.adapter) {
      if ((_b = (_a = this.adapter) == null ? void 0 : _a.cloudMqttService) == null ? void 0 : _b.mqttClient) {
        this.adapter.log.debug(`[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic} (Cloud)`);
        (_e = (_d = (_c = this.adapter) == null ? void 0 : _c.cloudMqttService) == null ? void 0 : _d.mqttClient) == null ? void 0 : _e.subscribe(reportTopic, import_mqttSharedService.onSubscribeReportTopic);
      }
      if ((_g = (_f = this.adapter) == null ? void 0 : _f.localMqttService) == null ? void 0 : _g.mqttClient) {
        this.adapter.log.debug(`[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic} (Local)`);
        (_j = (_i = (_h = this.adapter) == null ? void 0 : _h.localMqttService) == null ? void 0 : _i.mqttClient) == null ? void 0 : _j.subscribe(reportTopic, import_mqttSharedService.onSubscribeReportTopic);
      }
      this.adapter.log.debug(
        `[subscribeReportTopic] Setting connectionMode for device ${this.deviceKey}, relayMqttToCloud=${this.adapter.config.relayMqttToCloud}!`
      );
      if (this && ((_l = (_k = this.adapter) == null ? void 0 : _k.localMqttService) == null ? void 0 : _l.mqttClient) && this.adapter.config.relayMqttToCloud) {
        this.deviceConnectionMode = import_enums.DeviceConnectionMode.LocalMqttWithCloudRelay;
        this.updateSolarFlowState("connectionMode", "Local MQTT with Cloud Relay");
        (_m = this.adapter) == null ? void 0 : _m.log.debug(
          `[subscribeReportTopic] Set connectionMode to 'Local MQTT with Cloud Relay' for device ${this.deviceKey}`
        );
      } else if (this && ((_o = (_n = this.adapter) == null ? void 0 : _n.localMqttService) == null ? void 0 : _o.mqttClient)) {
        if (this && this.deviceConnectionMode == void 0) {
          this.deviceConnectionMode = import_enums.DeviceConnectionMode.LocalMqtt;
          this.updateSolarFlowState("connectionMode", "Local MQTT");
          (_p = this.adapter) == null ? void 0 : _p.log.debug(
            `[subscribeReportTopic] Set connectionMode to 'Local MQTT' for device ${this.deviceKey}`
          );
        }
      } else if (this && ((_r = (_q = this.adapter) == null ? void 0 : _q.cloudMqttService) == null ? void 0 : _r.mqttClient)) {
        this.deviceConnectionMode = import_enums.DeviceConnectionMode.CloudMqtt;
        this.updateSolarFlowState("connectionMode", "Cloud MQTT");
        (_s = this.adapter) == null ? void 0 : _s.log.debug(
          `[subscribeReportTopic] Set connectionMode to 'Cloud MQTT' for device ${this.deviceKey}`
        );
      }
    }
  }
  subscribeIotTopic() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const iotTopic = `iot/${this.productKey}/${this.deviceKey}/#`;
    if (this.adapter) {
      if ((_b = (_a = this.adapter) == null ? void 0 : _a.cloudMqttService) == null ? void 0 : _b.mqttClient) {
        (_c = this.adapter) == null ? void 0 : _c.log.debug(`[subscribeIotTopic] Subscribing to MQTT Topic: '${iotTopic}' (Cloud)`);
        (_e = (_d = this.adapter) == null ? void 0 : _d.cloudMqttService) == null ? void 0 : _e.mqttClient.subscribe(iotTopic, (error) => {
          (0, import_mqttSharedService.onSubscribeIotTopic)(error, this.productKey, this.deviceKey);
        });
      }
      if ((_g = (_f = this.adapter) == null ? void 0 : _f.localMqttService) == null ? void 0 : _g.mqttClient) {
        (_h = this.adapter) == null ? void 0 : _h.log.debug(`[subscribeIotTopic] Subscribing to MQTT Topic: '${iotTopic}' (Local)`);
        (_j = (_i = this.adapter) == null ? void 0 : _i.localMqttService) == null ? void 0 : _j.mqttClient.subscribe(iotTopic, (error) => {
          (0, import_mqttSharedService.onSubscribeIotTopic)(error, this.productKey, this.deviceKey);
        });
      }
    }
  }
  async updateProperty(property, value) {
    if (this.isZenSdkSupported && this.adapter.config.useZenSDK) {
      const setPropertyContent2 = { [property]: value };
      this.adapter.log.debug(
        `[updateProperty] Updating property ${property} with value ${value} for device ${this.deviceKey} using zenSDK!`
      );
      return await this.writeZenSdkProperties(JSON.stringify(setPropertyContent2));
    }
    const setPropertyContent = { properties: { [property]: value } };
    this.adapter.log.debug(
      `[updateProperty] Updating property ${property} with value ${value} for device ${this.deviceKey} using MQTT!`
    );
    return this.writeMqttProperties(JSON.stringify(setPropertyContent));
  }
  setDeviceAutomationInOutLimit(limit) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(
      `[setDeviceAutomationInOutLimit] Method setDeviceAutomationInOutLimit (set to ${limit}) not defined in base class!`
    );
    return;
  }
  /**
   * Hands control of the device to the HEMS via `hemsState` (properties/write).
   *
   * @param hemsState true to hand control to the HEMS, false to release it
   */
  setHemsState(hemsState) {
    if (this.productKey && this.deviceKey) {
      this.adapter.log.debug(`[setHemsState] Setting hemsState to ${hemsState ? 1 : 0} for device ${this.deviceKey}!`);
      this.writeMqttProperties(JSON.stringify({ properties: { hemsState: hemsState ? 1 : 0 } }));
    }
  }
  /**
   * Sending a device limit trought HEMS imitation. This function acts like the HEMS from Zendure cloud.
   *
   * @param limit desired power in W; negative charges, positive (including 0) discharges/idles
   */
  releaseHemsControlTimeout;
  async sendHemsEpSetpoint(limit) {
    var _a, _b;
    if (this.releaseHemsControlTimeout) {
      this.adapter.clearTimeout(this.releaseHemsControlTimeout);
      this.releaseHemsControlTimeout = void 0;
    }
    const hemsStateActive = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.hemsState`);
    const isFirstPayload = !hemsStateActive || !hemsStateActive.val;
    if (isFirstPayload) {
      const autoModel = (_a = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.autoModel`)) == null ? void 0 : _a.val;
      if (autoModel != 0) {
        this.adapter.log.warn(
          `[sendHemsEpSetpoint] autoModel is not set to '0' (current value: ${autoModel}), setting it to '0' before sending the HEMS setpoint!`
        );
        this.setAutoModel(0);
      }
      const acMode = (_b = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.acMode`)) == null ? void 0 : _b.val;
      if (acMode != 0) {
        this.adapter.log.warn(
          `[sendHemsEpSetpoint] acMode is not set to '0' (current value: ${acMode}), setting it to '0' before sending the HEMS setpoint!`
        );
        this.setAcMode(0);
      }
      this.setHemsState(true);
      await new Promise((resolve) => this.adapter.setTimeout(resolve, 3e3));
    }
    this.messageId += 1;
    const timestamp = /* @__PURE__ */ new Date();
    timestamp.setMilliseconds(0);
    const inverseMaxPowerState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.inverseMaxPower`
    );
    const inverseMaxPower = (inverseMaxPowerState == null ? void 0 : inverseMaxPowerState.val) ? Number(inverseMaxPowerState.val) : 0;
    if (limit > inverseMaxPower) {
      this.adapter.log.error(
        `[sendHemsEpSetpoint] Requested output limit (${limit}W) exceeds inverseMaxPower (${inverseMaxPower}W) - actual output will be ignored by the device!`
      );
    }
    let minSoc;
    if (isFirstPayload) {
      const minSocState = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.minSoc`);
      minSoc = ((minSocState == null ? void 0 : minSocState.val) ? Number(minSocState.val) : 1) * 10;
    }
    const _arguments = limit < 0 ? { outputPower: 0, chargePower: -limit, freq: 0, mode: 9, chargeMode: 3 } : {
      outputPower: limit,
      chargePower: 0,
      freq: 0,
      mode: 9,
      ...isFirstPayload ? { minSoc, inverseMaxPower } : {}
    };
    const hemsEP = {
      arguments: _arguments,
      function: "hemsEP",
      messageId: this.messageId,
      deviceKey: this.deviceKey,
      timestamp: timestamp.getTime() / 1e3
    };
    this.invokeMqttFunction(JSON.stringify(hemsEP));
    if (limit === 0) {
      this.releaseHemsControlTimeout = this.adapter.setTimeout(() => {
        this.releaseHemsControlTimeout = void 0;
        this.setHemsState(false);
      }, 3e3);
    }
  }
  setAcMode(acMode) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(`[setAcMode] Method setAcMode (set to ${acMode}) not defined in base class!`);
    return;
  }
  setDcSwitch(dcSwitch) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(`[setDcSwitch] Method setDcSwitch (set to ${dcSwitch}) not defined in base class!`);
    return;
  }
  setAcSwitch(acSwitch) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(`[setAcSwitch] Method setAcSwitch (set to ${acSwitch}) not defined in base class!`);
    return;
  }
  setHubState(hubState) {
    if (this.productKey && this.deviceKey) {
      if (hubState == 0 || hubState == 1) {
        this.updateProperty("hubState", hubState);
      } else {
        this.adapter.log.debug(`[setHubState] Hub state is not 0 or 1!`);
      }
    }
  }
  setGridReverse(gridReverse) {
    if (this.productKey && this.deviceKey) {
      if (gridReverse >= 0 && gridReverse <= 2) {
        this.updateProperty("gridReverse", gridReverse);
      } else {
        this.adapter.log.debug(`[setGridReverse] Grid reverse value ${gridReverse} is not 0, 1 or 2!`);
      }
    }
  }
  setGridOffMode(gridOffMode) {
    if (this.productKey && this.deviceKey) {
      if (gridOffMode >= 0 && gridOffMode <= 2) {
        this.updateProperty("gridOffMode", gridOffMode);
      } else {
        this.adapter.log.debug(`[setGridOffMode] Grid off mode value ${gridOffMode} is not 0, 1 or 2!`);
      }
    }
  }
  setPassMode(passMode) {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("passMode", passMode);
    }
  }
  setAutoRecover(autoRecover) {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("autoRecover", autoRecover ? 1 : 0);
    }
  }
  setInverseMaxPower(inverseMaxPower) {
    if (this.productKey && this.deviceKey) {
      if (inverseMaxPower < 0) {
        this.adapter.log.debug(
          `[setInverseMaxPower] inverseMaxPower ${inverseMaxPower} is negative, converting to positive!`
        );
        inverseMaxPower = Math.abs(inverseMaxPower);
      }
      this.updateProperty("inverseMaxPower", Math.round(inverseMaxPower));
    }
  }
  /**
   * Will set the discharge limit (minSoc)
   *
   * @param socSet the desired minimum soc
   * @param minSoc
   * @returns void
   */
  setDischargeLimit(minSoc) {
    if (this.productKey && this.deviceKey) {
      if (minSoc >= 0 && minSoc <= 50) {
        this.updateProperty("minSoc", minSoc * 10);
      } else {
        this.adapter.log.debug(`[setDischargeLimit] Discharge limit is not in range 0<>50!`);
      }
    }
  }
  /**
   * Will set the maximum charge limit
   *
   * @param socSet the desired max SOC
   * @returns void
   */
  setChargeLimit(socSet) {
    if (this.productKey && this.deviceKey) {
      if (socSet >= 40 && socSet <= 100) {
        this.updateProperty("socSet", socSet * 10);
      } else {
        this.adapter.log.debug(`[setChargeLimit] Charge limit is not in range 40<>100!`);
      }
    }
  }
  /**
   * Will set the 'energy plan'
   *
   * @param autoModel autoModel value, like 8 for smart matching
   * @returns void
   */
  setAutoModel(autoModel) {
    if (this.isZenSdkSupported && this.adapter.config.useZenSDK) {
      if (autoModel != 0) {
        this.adapter.log.warn(`[setAutoModel] Can't set autoModel to a value other than 0 when using zenSDK!`);
      }
      this.updateProperty("autoModel", 0);
      return;
    }
    if (this.productKey && this.deviceKey) {
      let setAutoModelContent = { properties: { autoModel } };
      switch (autoModel) {
        case 8: {
          setAutoModelContent = {
            properties: {
              autoModelProgram: 1,
              autoModelValue: {
                chargingType: 0,
                chargingPower: 0,
                outPower: 0
              },
              msgType: 1,
              autoModel: 8
            }
          };
          break;
        }
        case 9:
          setAutoModelContent = {
            properties: {
              autoModelProgram: 2,
              autoModelValue: {
                chargingType: 3,
                chargingPower: 0,
                outPower: 0
              },
              msgType: 1,
              autoModel: 9
            }
          };
          break;
      }
      this.adapter.log.debug(`[setAutoModel] Setting autoModel for device key ${this.deviceKey} to ${autoModel}!`);
      this.writeMqttProperties(JSON.stringify(setAutoModelContent));
    }
  }
  async setOutputLimit(limit) {
    var _a, _b;
    if (this.productKey && this.deviceKey) {
      const autoModel = (_a = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.autoModel`)) == null ? void 0 : _a.val;
      if (autoModel != 0) {
        this.adapter.log.warn(
          `[setOutputLimit] Operation mode (autoModel) for device ${this.deviceName} (${this.deviceKey}) is not set to '0', we can't set the output limit!`
        );
        return;
      }
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (limit > this.maxOutputLimit) {
        limit = this.maxOutputLimit;
      }
      if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0 && (this.productKey.toLowerCase() == "73bktv" || this.productKey.toLowerCase() == "a8yh63")) {
        if (limit < 100 && limit > 90) {
          limit = 90;
        } else if (limit > 60 && limit < 90) {
          limit = 60;
        } else if (limit > 30 && limit < 60) {
          limit = 30;
        } else if (limit < 30) {
          limit = 30;
        }
      }
      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true) {
          limit = 0;
        }
        const fullChargeNeeded = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`
        );
        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
          limit = 0;
        }
      }
      const currentLimit = (_b = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.outputLimit`)) == null ? void 0 : _b.val;
      if (currentLimit != null && currentLimit != void 0) {
        if (currentLimit != limit) {
          const timestamp = /* @__PURE__ */ new Date();
          timestamp.setMilliseconds(0);
          this.updateProperty("outputLimit", limit);
        }
      }
    }
  }
  setInputLimit(limit) {
    if (this.productKey && this.deviceKey) {
      if (limit < 0) {
        this.adapter.log.debug(`[setInputLimit] limit ${limit} is negative, converting to positive!`);
        limit = Math.abs(limit);
      }
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (limit < 0) {
        limit = 0;
      } else if (limit > 0 && limit <= 30) {
        limit = 30;
      } else if (limit > this.maxInputLimit) {
        limit = this.maxInputLimit;
      }
      if (this.productKey.toLowerCase().includes("8bm93h")) {
        limit = Math.ceil(limit / 100) * 100;
      }
      this.updateProperty("inputLimit", limit);
    }
  }
  setSmartMode(smartModeOn) {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("smartMode", smartModeOn ? 1 : 0);
    }
  }
  setBuzzerSwitch(buzzerOn) {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("buzzerSwitch", buzzerOn ? 1 : 0);
    }
  }
  triggerFullTelemetryUpdate() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (this.isZenSdkSupported && this.adapter.config.useZenSDK) {
      this.getZenSdkProperties();
      return;
    }
    if (this.productKey && this.deviceKey) {
      const getAllContent = { properties: ["getAll"] };
      this.adapter.log.debug(
        `[triggerFullTelemetryUpdate] Triggering full telemetry update for device key ${this.deviceKey}!`
      );
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/read`;
      this.messageId += 1;
      if ((_b = (_a = this.adapter) == null ? void 0 : _a.localMqttService) == null ? void 0 : _b.mqttClient) {
        (_e = (_d = (_c = this.adapter) == null ? void 0 : _c.localMqttService) == null ? void 0 : _d.mqttClient) == null ? void 0 : _e.publish(topic, JSON.stringify(getAllContent), { qos: 1 });
      } else if ((_g = (_f = this.adapter) == null ? void 0 : _f.cloudMqttService) == null ? void 0 : _g.mqttClient) {
        (_j = (_i = (_h = this.adapter) == null ? void 0 : _h.cloudMqttService) == null ? void 0 : _i.mqttClient) == null ? void 0 : _j.publish(topic, JSON.stringify(getAllContent), { qos: 1 });
      }
    }
  }
  async updateSolarFlowState(state, val) {
    var _a, _b;
    const stateId = `${this.productKey}.${this.deviceKey}.${state}`;
    await (0, import_processDeviceProperties.ensureState)(this, state, val);
    const currentValue = await this.adapter.getStateAsync(stateId);
    await ((_a = this.adapter) == null ? void 0 : _a.setState(stateId, val, true));
    if ((currentValue == null ? void 0 : currentValue.val) != val && state != "wifiState") {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(`${this.productKey}.${this.deviceKey}.lastUpdate`, (/* @__PURE__ */ new Date()).getTime(), true));
      const currentWifiState = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.wifiState`);
      if (currentWifiState && currentWifiState.val == 0) {
        this.updateSolarFlowState("wifiState", 1);
      }
    }
  }
  async updateSolarFlowControlState(state, val) {
    var _a, _b;
    const stateExist = await ((_a = this.adapter) == null ? void 0 : _a.objectExists(`${this.productKey}.${this.deviceKey}.control.${state}`));
    if (stateExist) {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(`${this.productKey}.${this.deviceKey}.control.${state}`, val, true));
    }
  }
  // eslint-disable-next-line @typescript-eslint/require-await -- kept async, caller in processDeviceProperties.ts awaits this method
  addOrUpdatePackData = async (packData, isSolarFlow) => {
    if (this.adapter && this.productKey && this.deviceKey) {
      packData.forEach(async (x) => {
        var _a, _b, _c;
        if (x.sn && this.adapter) {
          let batType = "";
          if (this.productKey.toLowerCase() == "ywf7hv") {
            batType = "AIO2400";
          } else if (x.sn.startsWith("A")) {
            batType = "AB1000";
          } else if (x.sn.startsWith("B")) {
            batType = "AB1000S";
          } else if (x.sn.startsWith("C")) {
            if (x.sn[1] === "O" && x.sn[2] === "4") {
              batType = "I1920";
            }
            if (x.sn[3] == "F") {
              batType = "AB2000S";
            } else if (x.sn[3] == "E") {
              batType = "AB2000X";
            } else {
              batType = "AB2000";
            }
          } else if (x.sn.startsWith("F")) {
            batType = "AB3000X";
          } else if (x.sn.startsWith("G")) {
            batType = "AB3000L";
          } else if (x.sn.startsWith("J")) {
            batType = "I2400";
          }
          if (!this.batteries.some((y) => y.packSn == x.sn)) {
            this.batteries.push({ packSn: x.sn, type: batType });
            this.adapter.log.debug(
              `[addOrUpdatePackData] Added battery ${batType} with SN ${x.sn} on deviceKey ${this.deviceKey} to batteries array!`
            );
          }
          const key = `${this.productKey}.${this.deviceKey}.packData.${x.sn}`.replace(this.adapter.FORBIDDEN_CHARS, "");
          await ((_a = this.adapter) == null ? void 0 : _a.extendObject(key, {
            type: "channel",
            common: { name: { de: batType, en: batType } },
            native: {}
          }));
          const createPackState = async (fieldName) => {
            var _a2;
            const def = import_allStates.allStates[fieldName];
            if (!def) {
              return;
            }
            await ((_a2 = this.adapter) == null ? void 0 : _a2.extendObject(`${key}.${fieldName}`, {
              type: "state",
              common: {
                name: { de: def.nameDe, en: def.nameEn },
                type: def.type,
                desc: def.title,
                role: def.role,
                read: true,
                write: false,
                unit: def.unit
              },
              native: {}
            }));
          };
          const touchLastUpdate = async (fieldName, newValue) => {
            var _a2, _b2, _c2;
            const current = await ((_a2 = this.adapter) == null ? void 0 : _a2.getStateAsync(`${key}.${fieldName}`));
            if ((current == null ? void 0 : current.val) && newValue != current.val) {
              await ((_b2 = this.adapter) == null ? void 0 : _b2.setState(
                `${this.productKey}.${this.deviceKey}.lastUpdate`,
                (/* @__PURE__ */ new Date()).getTime(),
                true
              ));
              const wifiState = await ((_c2 = this.adapter) == null ? void 0 : _c2.getStateAsync(`${this.productKey}.${this.deviceKey}.wifiState`));
              if ((wifiState == null ? void 0 : wifiState.val) == 0) {
                this.updateSolarFlowState("wifiState", 1);
              }
            }
          };
          const packStatesToSet = /* @__PURE__ */ new Map();
          packStatesToSet.set("model", batType);
          packStatesToSet.set("sn", x.sn);
          if (x.socLevel != null) {
            packStatesToSet.set("socLevel", x.socLevel);
          }
          if (x.maxTemp != null) {
            const maxTempCelsius = x.maxTemp / 10 - 273.15;
            await touchLastUpdate("maxTemp", maxTempCelsius);
            packStatesToSet.set("maxTemp", maxTempCelsius);
          }
          if (x.minVol != null) {
            const minVol = x.minVol / 100;
            await touchLastUpdate("minVol", minVol);
            packStatesToSet.set("minVol", minVol);
          }
          if (x.batcur != null) {
            await ((_b = this.adapter) == null ? void 0 : _b.extendObject(`${key}.batcur`, {
              type: "state",
              common: {
                name: "batcur",
                type: "number",
                desc: "batcur",
                role: "value",
                read: true,
                write: false,
                unit: "A"
              },
              native: {}
            }));
            let batcur = x.batcur;
            if (batcur > 32767) {
              batcur -= 65536;
            }
            packStatesToSet.set("batcur", batcur / 10);
          }
          if (x.maxVol != null) {
            const maxVol = x.maxVol / 100;
            await touchLastUpdate("maxVol", maxVol);
            packStatesToSet.set("maxVol", maxVol);
          }
          if (x.totalVol != null) {
            const totalVol = x.totalVol / 100;
            await touchLastUpdate("totalVol", totalVol);
            packStatesToSet.set("totalVol", totalVol);
            if (isSolarFlow) {
              this.checkVoltage(totalVol);
            }
          }
          if (x.soh != null) {
            packStatesToSet.set("soh", x.soh / 10);
          }
          if (x.power != null) {
            packStatesToSet.set("power", x.power);
          }
          for (const [fieldName, value] of packStatesToSet) {
            await createPackState(fieldName);
            await ((_c = this.adapter) == null ? void 0 : _c.setState(`${key}.${fieldName}`, value, true));
          }
          let found = false;
          Object.entries(x).forEach(([k, value]) => {
            var _a2;
            import_mqttSharedService.knownPackDataProperties.forEach((property) => {
              if (property == k) {
                found = true;
              }
            });
            if (!found) {
              (_a2 = this.adapter) == null ? void 0 : _a2.log.debug(
                `[addOrUpdatePackData] ${k} with value ${value} is a UNKNOWN PackData Mqtt Property!`
              );
            }
          });
        }
      });
    }
  };
  async checkVoltage(voltage) {
    var _a, _b, _c, _d, _e;
    if (voltage < 46.1) {
      if (this.adapter.config.useCalculation) {
        this.setSocToZero();
      }
      if (this.adapter.config.useLowVoltageBlock) {
        await ((_a = this.adapter) == null ? void 0 : _a.setState(`${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`, true, true));
        const outputLimit = (_b = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.outputLimit`)) == null ? void 0 : _b.val;
        const deviceAutomationInOutLimit = (_c = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.control.setDeviceAutomationInOutLimit`)) == null ? void 0 : _c.val;
        if (deviceAutomationInOutLimit != 0) {
          this.setDeviceAutomationInOutLimit(0);
        } else if (outputLimit != 0) {
          this.setOutputLimit(0);
        }
        if (this.adapter.config.forceShutdownOnLowVoltage) {
          const currentSoc = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.electricLevel`);
          if (currentSoc && Number(currentSoc.val) > 50) {
            if (this.adapter.config.fullChargeIfNeeded) {
              await ((_d = this.adapter) == null ? void 0 : _d.setState(`${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`, true, true));
            }
          } else {
            if (currentSoc && currentSoc.val) {
              this.setDischargeLimit(Number(currentSoc.val));
            }
            const hubState = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.hubState`);
            if (!hubState || Number(hubState.val) != 1) {
              this.adapter.log.warn(
                `[checkVoltage] hubState is not set to 'Stop output and shut down', device will NOT go offline!`
              );
            }
          }
        }
      }
    } else if (voltage >= 47.5) {
      const lowVoltageBlock = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`
      );
      if (lowVoltageBlock && lowVoltageBlock.val == true) {
        await ((_e = this.adapter) == null ? void 0 : _e.setState(`${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`, false, true));
        if (this.adapter.config.useLowVoltageBlock && this.adapter.config.forceShutdownOnLowVoltage) {
          this.setDischargeLimit(this.adapter.config.dischargeLimit ? this.adapter.config.dischargeLimit : 5);
        }
      }
    }
  }
  /**
   * Calculates the energy for all items in 'calculationStateKeys'.
   *
   * @returns Promise<void>
   * @beta
   */
  calculateEnergy() {
    import_constants.calculationStateKeys.forEach(async (stateKey) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";
      let stateNamePower = "";
      switch (stateKey) {
        case "pvPower1":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower1`;
          break;
        case "pvPower2":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower2`;
          break;
        case "pvPower3":
          if (await this.adapter.getObjectAsync(`${this.productKey}.${this.deviceKey}.pvPower3`)) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodaykWh`;
            stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower3`;
          }
          break;
        case "pvPower4":
          if (await this.adapter.getObjectAsync(`${this.productKey}.${this.deviceKey}.pvPower4`)) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodaykWh`;
            stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower4`;
          }
          break;
        default:
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.${stateKey}Power`;
          break;
      }
      if (stateNamePower != "") {
        this.adapter.log.debug(`[calculateEnergy] No stateNamePower found for ${stateKey}!`);
        const currentPowerState = await ((_a = this.adapter) == null ? void 0 : _a.getStateAsync(stateNamePower));
        const currentEnergyState = await ((_b = this.adapter) == null ? void 0 : _b.getStateAsync(stateNameEnergyWh));
        if (!(currentEnergyState == null ? void 0 : currentEnergyState.val) || (currentEnergyState == null ? void 0 : currentEnergyState.val) == 0) {
          await ((_c = this.adapter) == null ? void 0 : _c.setState(stateNameEnergyWh, 1e-6, true));
        } else if (currentEnergyState && currentEnergyState.lc && currentPowerState && currentPowerState.val != void 0 && currentPowerState.val != null) {
          const timeFrame = 3e4;
          const addEnergyValue = Number(currentPowerState.val) * timeFrame / 36e5;
          let newEnergyValue = Number(currentEnergyState.val) + addEnergyValue;
          if (newEnergyValue < 0) {
            newEnergyValue = 0;
          }
          await ((_d = this.adapter) == null ? void 0 : _d.setState(stateNameEnergyWh, newEnergyValue, true));
          await ((_e = this.adapter) == null ? void 0 : _e.setState(stateNameEnergykWh, Number((newEnergyValue / 1e3).toFixed(2)), true));
          if ((stateKey == "outputPack" || stateKey == "packInput") && addEnergyValue > 0) {
            await this.calculateSocAndEnergy(stateKey, addEnergyValue);
          } else {
            if (stateKey == "outputPack") {
              await ((_f = this.adapter) == null ? void 0 : _f.setState(
                `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
                "",
                true
              ));
            } else if (stateKey == "packInput") {
              await ((_g = this.adapter) == null ? void 0 : _g.setState(`${this.productKey}.${this.deviceKey}.calculations.remainOutTime`, "", true));
            }
          }
        } else if (currentPowerState && currentEnergyState) {
          await ((_h = this.adapter) == null ? void 0 : _h.setState(stateNameEnergyWh, 0, true));
          await ((_i = this.adapter) == null ? void 0 : _i.setState(stateNameEnergykWh, 0, true));
        }
      }
    });
  }
  calculateSocAndEnergy = async (stateKey, value) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    this.adapter.log.debug(
      `[calculateSocAndEnergy] Calculating for: ${this.productKey}.${this.deviceKey} and stateKey ${stateKey}!`
    );
    let energyWhMax = void 0;
    const minSoc = (_a = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.minSoc`)) == null ? void 0 : _a.val;
    const currentSoc = (_b = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.electricLevel`)) == null ? void 0 : _b.val;
    if (currentSoc && minSoc && Number(currentSoc) < Number(minSoc)) {
      this.adapter.log.debug(
        `[calculateSocAndEnergy] Don't calculate, currentSoc (${Number(currentSoc)}) is lower than minSoc (${Number(minSoc)})!`
      );
      return;
    }
    const currentEnergyState = await ((_c = this.adapter) == null ? void 0 : _c.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`
    ));
    const currentEnergyMaxState = await ((_d = this.adapter) == null ? void 0 : _d.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`
    ));
    const lowVoltageBlock = await ((_e = this.adapter) == null ? void 0 : _e.getStateAsync(
      `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`
    ));
    const currentMaxValue = Number(currentEnergyMaxState ? currentEnergyMaxState.val : 0);
    let currentEnergyWh = (currentEnergyState == null ? void 0 : currentEnergyState.val) ? Number(currentEnergyState == null ? void 0 : currentEnergyState.val) : 0;
    if (currentEnergyWh == null || currentEnergyWh == void 0 || currentEnergyWh <= 0) {
      currentEnergyWh = 0;
    }
    if (this.productKey.toLowerCase() == "ywf7hv") {
      energyWhMax = 2400;
    } else {
      for (let i = 0; i < this.batteries.length; i++) {
        if (this.batteries[i].type.includes("AB1000")) {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 960;
        } else if (this.batteries[i].type.includes("AB2000")) {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 1920;
        } else if (this.batteries[i].type.includes("AB3000")) {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 2880;
        } else if (this.batteries[i].type.includes("I2400")) {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 2400;
        } else if (this.batteries[i].type.includes("I1920")) {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 1920;
        }
      }
    }
    let newEnergyWh = stateKey == "outputPack" ? currentEnergyWh + value : currentEnergyWh - value;
    if (stateKey == "outputPack" && energyWhMax != void 0 && newEnergyWh > energyWhMax) {
      newEnergyWh = energyWhMax;
      this.adapter.log.debug(
        `[calculateSocAndEnergy] newEnergyWh (${newEnergyWh}) is greater than energyWhMax (${energyWhMax}), don't extend value!`
      );
    }
    if (newEnergyWh > 0) {
      (_f = this.adapter) == null ? void 0 : _f.setState(`${this.productKey}.${this.deviceKey}.calculations.energyWh`, newEnergyWh, true);
      this.adapter.log.debug(
        `[calculateSocAndEnergy] set '${this.productKey}.${this.deviceKey}.calculations.energyWh' to ${newEnergyWh}!`
      );
      if (currentEnergyMaxState) {
        const soc = Number((newEnergyWh / currentMaxValue * 100).toFixed(1));
        await ((_g = this.adapter) == null ? void 0 : _g.setState(
          `${this.productKey}.${this.deviceKey}.calculations.soc`,
          soc > 100 ? 100 : soc,
          true
        ));
        if (newEnergyWh > currentMaxValue && !(lowVoltageBlock == null ? void 0 : lowVoltageBlock.val)) {
          await ((_h = this.adapter) == null ? void 0 : _h.setState(
            `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
            newEnergyWh,
            true
          ));
        }
        const currentOutputPackPower = await ((_i = this.adapter) == null ? void 0 : _i.getStateAsync(
          `${this.productKey}.${this.deviceKey}.outputPackPower`
        ));
        const currentPackInputPower = await ((_j = this.adapter) == null ? void 0 : _j.getStateAsync(
          `${this.productKey}.${this.deviceKey}.packInputPower`
        ));
        if (stateKey == "outputPack" && (currentOutputPackPower == null ? void 0 : currentOutputPackPower.val) != null && currentOutputPackPower != void 0) {
          const toCharge = currentMaxValue - newEnergyWh;
          const remainHoursAsDecimal = toCharge / Number(currentOutputPackPower.val);
          if (remainHoursAsDecimal < 48) {
            const remainFormatted = (0, import_timeHelper.toHoursAndMinutes)(Math.round(remainHoursAsDecimal * 60));
            await ((_k = this.adapter) == null ? void 0 : _k.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
              remainFormatted,
              true
            ));
          } else {
            await ((_l = this.adapter) == null ? void 0 : _l.setState(`${this.productKey}.${this.deviceKey}.calculations.remainInputTime`, "", true));
          }
        } else if (stateKey == "packInput" && currentPackInputPower != null && currentPackInputPower != void 0) {
          const remainHoursAsDecimal = newEnergyWh / Number(currentPackInputPower.val);
          const remainFormatted = (0, import_timeHelper.toHoursAndMinutes)(Math.round(remainHoursAsDecimal * 60));
          if (remainHoursAsDecimal < 48) {
            await ((_m = this.adapter) == null ? void 0 : _m.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
              remainFormatted,
              true
            ));
          } else {
            await ((_n = this.adapter) == null ? void 0 : _n.setState(`${this.productKey}.${this.deviceKey}.calculations.remainOutTime`, "", true));
          }
        }
      }
    } else if (newEnergyWh <= 0 && stateKey == "outputPack") {
      await ((_o = this.adapter) == null ? void 0 : _o.setState(`${this.productKey}.${this.deviceKey}.calculations.remainInputTime`, "", true));
    } else if (newEnergyWh <= 0 && stateKey == "packInput") {
      await ((_p = this.adapter) == null ? void 0 : _p.setState(`${this.productKey}.${this.deviceKey}.calculations.remainOutTime`, "", true));
      const newEnergyWhPositive = Math.abs(newEnergyWh);
      if (energyWhMax && currentMaxValue + newEnergyWhPositive <= energyWhMax) {
        await ((_q = this.adapter) == null ? void 0 : _q.setState(
          `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
          currentMaxValue + newEnergyWhPositive,
          true
        ));
      }
    }
  };
  async setSocToZero() {
    var _a, _b, _c;
    await ((_a = this.adapter) == null ? void 0 : _a.setState(`${this.productKey}.${this.deviceKey}.calculations.soc`, 0, true));
    const energyWhState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`
    );
    const energyWhMaxState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`
    );
    const newMax = Number(energyWhMaxState == null ? void 0 : energyWhMaxState.val) - Number(energyWhState == null ? void 0 : energyWhState.val);
    await ((_b = this.adapter) == null ? void 0 : _b.setState(`${this.productKey}.${this.deviceKey}.calculations.energyWhMax`, newMax, true));
    await ((_c = this.adapter) == null ? void 0 : _c.setState(`${this.productKey}.${this.deviceKey}.calculations.energyWh`, 0, true));
  }
  async setEnergyWhMax() {
    var _a, _b;
    const currentEnergyState = await ((_a = this.adapter) == null ? void 0 : _a.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`
    ));
    if (currentEnergyState) {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(
        `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
        currentEnergyState == null ? void 0 : currentEnergyState.val,
        true
      ));
    }
  }
  resetValuesForDevice() {
    import_constants.calculationStateKeys.forEach(async (stateKey) => {
      var _a, _b;
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";
      switch (stateKey) {
        case "pvPower1":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
          break;
        case "pvPower2":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
          break;
        case "pvPower3":
          if (await this.adapter.getObjectAsync(`${this.productKey}.${this.deviceKey}.pvPower3`)) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodaykWh`;
          } else {
            return;
          }
          break;
        case "pvPower4":
          if (await this.adapter.getObjectAsync(`${this.productKey}.${this.deviceKey}.pvPower4`)) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodaykWh`;
          } else {
            return;
          }
          break;
        default:
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
          break;
      }
      if (stateNameEnergyWh != "" && stateNameEnergykWh != "") {
        await ((_a = this.adapter) == null ? void 0 : _a.setState(stateNameEnergyWh, 0, true));
        await ((_b = this.adapter) == null ? void 0 : _b.setState(stateNameEnergykWh, 0, true));
      }
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZenIobDevice
});
//# sourceMappingURL=ZenIobDevice.js.map
