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
var fallbackMqttService_exports = {};
__export(fallbackMqttService_exports, {
  addOrUpdatePackData: () => addOrUpdatePackData,
  connectFallbackMqttClient: () => connectFallbackMqttClient
});
module.exports = __toCommonJS(fallbackMqttService_exports);
var import_mqtt = __toESM(require("mqtt"));
var import_uuidHelper = require("../helpers/uuidHelper");
var import_adapterService = require("./adapterService");
var import_calculationService = require("./calculationService");
var import_createSolarFlowStates = require("../helpers/createSolarFlowStates");
var import_jobSchedule = require("./jobSchedule");
let adapter = void 0;
const addOrUpdatePackData = async (productKey, deviceKey, packData) => {
  if (adapter && productKey && deviceKey) {
    await packData.forEach(async (x) => {
      if (x.sn && adapter) {
        const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(adapter.FORBIDDEN_CHARS, "");
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".sn", {
          type: "state",
          common: {
            name: {
              de: "Seriennummer",
              en: "Serial id"
            },
            type: "string",
            desc: "Serial ID",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(key + ".sn", x.sn, true));
        if (x.socLevel) {
          await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".socLevel", {
            type: "state",
            common: {
              name: {
                de: "SOC der Batterie",
                en: "soc of battery"
              },
              type: "number",
              desc: "SOC Level",
              role: "value",
              read: true,
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setStateAsync(key + ".socLevel", x.socLevel, true));
        }
        if (x.maxTemp) {
          await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".maxTemp", {
            type: "state",
            common: {
              name: {
                de: "Max. Temperatur der Batterie",
                en: "max temp. of battery"
              },
              type: "number",
              desc: "Max. Temp",
              role: "value",
              read: true,
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setStateAsync(
            key + ".maxTemp",
            x.maxTemp / 10 - 273.15,
            true
          ));
        }
        if (x.minVol) {
          await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".minVol", {
            type: "state",
            common: {
              name: "minVol",
              type: "number",
              desc: "minVol",
              role: "value",
              read: true,
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setStateAsync(key + ".minVol", x.minVol / 100, true));
        }
        if (x.maxVol) {
          await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".maxVol", {
            type: "state",
            common: {
              name: "maxVol",
              type: "number",
              desc: "maxVol",
              role: "value",
              read: true,
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setStateAsync(key + ".maxVol", x.maxVol / 100, true));
        }
        if (x.totalVol) {
          await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".totalVol", {
            type: "state",
            common: {
              name: "totalVol",
              type: "number",
              desc: "totalVol",
              role: "value",
              read: true,
              write: false
            },
            native: {}
          }));
          const totalVol = x.totalVol / 100;
          await (adapter == null ? void 0 : adapter.setStateAsync(key + ".totalVol", totalVol, true));
        }
      }
    });
  }
};
const onMessage = async (topic, message) => {
  if (adapter) {
    let obj = {};
    try {
      console.log("Message: " + message.toString());
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[JSON PARSE ERROR] ${txt}`);
      return;
    }
    const topicSplitted = topic.split("/");
    let productKey = topicSplitted[0];
    const deviceKey = topicSplitted[1];
    if (deviceKey == "sensor" || deviceKey == "switch") {
      return;
    }
    if (productKey == "E8OdVAA4") {
      productKey = "73bkTV";
    }
    if (!adapter.deviceList.some(
      (x) => x.deviceKey == deviceKey && x.productKey == productKey
    )) {
      adapter.deviceList.push({
        productName: "Solarflow",
        deviceKey,
        productKey
      });
      await (0, import_createSolarFlowStates.createSolarFlowStates)(adapter, productKey, deviceKey);
      await (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "registeredServer",
        adapter.config.server
      );
      (0, import_jobSchedule.startResetValuesJob)(adapter);
      (0, import_jobSchedule.startCheckStatesJob)(adapter);
      if (adapter.config.useCalculation) {
        (0, import_jobSchedule.startCalculationJob)(adapter);
      }
    }
    (0, import_adapterService.updateSolarFlowState)(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      (/* @__PURE__ */ new Date()).getTime()
    );
    if ((obj == null ? void 0 : obj.electricLevel) != null && (obj == null ? void 0 : obj.electricLevel) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.electricLevel
      );
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && obj.electricLevel == 100) {
        (0, import_calculationService.setEnergyWhMax)(adapter, productKey, deviceKey);
      }
    }
    if ((obj == null ? void 0 : obj.packState) != null && (obj == null ? void 0 : obj.packState) != void 0) {
      const value = (obj == null ? void 0 : obj.packState) == 0 ? "Idle" : (obj == null ? void 0 : obj.packState) == 1 ? "Charging" : (obj == null ? void 0 : obj.packState) == 2 ? "Discharging" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packState", value);
    }
    if ((obj == null ? void 0 : obj.passMode) != null && (obj == null ? void 0 : obj.passMode) != void 0) {
      const value = (obj == null ? void 0 : obj.passMode) == 0 ? "Automatic" : (obj == null ? void 0 : obj.passMode) == 1 ? "Always off" : (obj == null ? void 0 : obj.passMode) == 2 ? "Always on" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "passMode", value);
    }
    if ((obj == null ? void 0 : obj.pass) != null && (obj == null ? void 0 : obj.pass) != void 0) {
      const value = (obj == null ? void 0 : obj.pass) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pass", value);
    }
    if ((obj == null ? void 0 : obj.autoRecover) != null && (obj == null ? void 0 : obj.autoRecover) != void 0) {
      const value = (obj == null ? void 0 : obj.autoRecover) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );
    }
    if ((obj == null ? void 0 : obj.outputHomePower) != null && (obj == null ? void 0 : obj.outputHomePower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.outputHomePower
      );
    }
    if ((obj == null ? void 0 : obj.outputLimit) != null && (obj == null ? void 0 : obj.outputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputLimit",
        obj.outputLimit
      );
    }
    if ((obj == null ? void 0 : obj.buzzerSwitch) != null && (obj == null ? void 0 : obj.buzzerSwitch) != void 0) {
      const value = (obj == null ? void 0 : obj.buzzerSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );
    }
    if ((obj == null ? void 0 : obj.outputPackPower) != null && (obj == null ? void 0 : obj.outputPackPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.outputPackPower
      );
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packInputPower", 0);
    }
    if ((obj == null ? void 0 : obj.packInputPower) != null && (obj == null ? void 0 : obj.packInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.packInputPower
      );
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0
      );
    }
    if ((obj == null ? void 0 : obj.solarInputPower) != null && (obj == null ? void 0 : obj.solarInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.solarInputPower
      );
    }
    if ((obj == null ? void 0 : obj.pvPower1) != null && (obj == null ? void 0 : obj.pvPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        // Reversed to adjust like offical app
        obj.pvPower1
      );
    }
    if ((obj == null ? void 0 : obj.pvPower2) != null && (obj == null ? void 0 : obj.pvPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        // Reversed to adjust like offical app
        obj.pvPower2
      );
    }
    if ((obj == null ? void 0 : obj.solarPower1) != null && (obj == null ? void 0 : obj.solarPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.solarPower1
      );
    }
    if ((obj == null ? void 0 : obj.solarPower2) != null && (obj == null ? void 0 : obj.solarPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.solarPower2
      );
    }
    if ((obj == null ? void 0 : obj.remainOutTime) != null && (obj == null ? void 0 : obj.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.remainOutTime
      );
    }
    if ((obj == null ? void 0 : obj.remainInputTime) != null && (obj == null ? void 0 : obj.remainInputTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.remainInputTime
      );
    }
    if ((obj == null ? void 0 : obj.socSet) != null && (obj == null ? void 0 : obj.socSet) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.socSet) / 10
      );
    }
    if ((obj == null ? void 0 : obj.minSoc) != null && (obj == null ? void 0 : obj.minSoc) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.minSoc) / 10
      );
    }
    if ((obj == null ? void 0 : obj.pvBrand) != null && (obj == null ? void 0 : obj.pvBrand) != void 0) {
      const value = (obj == null ? void 0 : obj.pvBrand) == 0 ? "Others" : (obj == null ? void 0 : obj.pvBrand) == 1 ? "Hoymiles" : (obj == null ? void 0 : obj.pvBrand) == 2 ? "Enphase" : (obj == null ? void 0 : obj.pvBrand) == 3 ? "APSystems" : (obj == null ? void 0 : obj.pvBrand) == 4 ? "Anker" : (obj == null ? void 0 : obj.pvBrand) == 5 ? "Deye" : (obj == null ? void 0 : obj.pvBrand) == 6 ? "Bosswerk" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pvBrand", value);
    }
    if ((obj == null ? void 0 : obj.inverseMaxPower) != null && (obj == null ? void 0 : obj.inverseMaxPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.inverseMaxPower
      );
    }
    if ((obj == null ? void 0 : obj.wifiState) != null && (obj == null ? void 0 : obj.wifiState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }
    if ((obj == null ? void 0 : obj.hubState) != null && (obj == null ? void 0 : obj.hubState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.hubState == 0 ? "Stop output and standby" : "Stop output and shut down"
      );
    }
    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData);
    }
  }
};
const onConnected = () => {
  adapter == null ? void 0 : adapter.log.info("[onConnected] Connected with MQTT!");
};
const onError = (error) => {
  adapter == null ? void 0 : adapter.log.error("Connection to MQTT failed! Error: " + error);
};
const onSubscribeReportTopic = (error) => {
  if (error) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter == null ? void 0 : adapter.log.debug("Subscription of Report Topic successful!");
  }
};
const connectFallbackMqttClient = (_adapter, appKey, secret, mqttServer, mqttPort) => {
  var _a;
  adapter = _adapter;
  const options = {
    clientId: (0, import_uuidHelper.generateUniqSerial)(),
    username: appKey,
    password: secret,
    clean: true,
    protocolVersion: 5
  };
  if (import_mqtt.default && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug(
      `[connectMqttClient] Connecting to DEV MQTT broker ${mqttServer + ":" + mqttPort}...`
    );
    adapter.mqttClient = import_mqtt.default.connect(
      "mqtt://" + mqttServer + ":" + mqttPort,
      options
    );
    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);
      if (adapter) {
        const reportTopic = `${appKey}/#`;
        adapter.log.debug(
          `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
        );
        (_a = adapter.mqttClient) == null ? void 0 : _a.subscribe(reportTopic, onSubscribeReportTopic);
      }
      adapter.mqttClient.on("message", onMessage);
      return true;
    }
  }
  return false;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  connectFallbackMqttClient
});
//# sourceMappingURL=fallbackMqttService.js.map
