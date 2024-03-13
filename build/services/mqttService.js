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
var mqttService_exports = {};
__export(mqttService_exports, {
  addOrUpdatePackData: () => addOrUpdatePackData,
  connectMqttClient: () => connectMqttClient,
  setChargeLimit: () => setChargeLimit,
  setDischargeLimit: () => setDischargeLimit,
  setOutputLimit: () => setOutputLimit
});
module.exports = __toCommonJS(mqttService_exports);
var mqtt = __toESM(require("mqtt"));
var import_adapterService = require("./adapterService");
var import_timeHelper = require("../helpers/timeHelper");
var import_createSolarFlowStates = require("../helpers/createSolarFlowStates");
var import_calculationService = require("./calculationService");
let adapter = void 0;
const onConnected = () => {
  adapter == null ? void 0 : adapter.log.info("[onConnected] Connected with MQTT!");
};
const onError = (error) => {
  adapter == null ? void 0 : adapter.log.error("Connection to MQTT failed! Error: " + error);
};
const onSubscribe = (error) => {
  if (error) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter == null ? void 0 : adapter.log.debug("Subscription successful!");
  }
};
const addOrUpdatePackData = async (adapter2, productKey, deviceKey, packData) => {
  await packData.forEach(async (x) => {
    if (x.sn) {
      const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(
        adapter2.FORBIDDEN_CHARS,
        ""
      );
      await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".sn", {
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
      await (adapter2 == null ? void 0 : adapter2.setStateAsync(key + ".sn", x.sn, true));
      if (x.socLevel) {
        await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".socLevel", {
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
        await (adapter2 == null ? void 0 : adapter2.setStateAsync(key + ".socLevel", x.socLevel, true));
      }
      if (x.maxTemp) {
        await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".maxTemp", {
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
        await (adapter2 == null ? void 0 : adapter2.setStateAsync(
          key + ".maxTemp",
          x.maxTemp / 10 - 273.15,
          true
        ));
      }
      if (x.minVol) {
        await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".minVol", {
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
        await (adapter2 == null ? void 0 : adapter2.setStateAsync(key + ".minVol", x.minVol / 100, true));
      }
      if (x.maxVol) {
        await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".maxVol", {
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
        await (adapter2 == null ? void 0 : adapter2.setStateAsync(key + ".maxVol", x.maxVol / 100, true));
      }
      if (x.totalVol) {
        await (adapter2 == null ? void 0 : adapter2.extendObjectAsync(key + ".totalVol", {
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
        await (adapter2 == null ? void 0 : adapter2.setStateAsync(key + ".totalVol", totalVol, true));
        (0, import_adapterService.checkVoltage)(adapter2, productKey, deviceKey, totalVol);
      }
    }
  });
};
const onMessage = async (topic, message) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B;
  if (adapter) {
    const splitted = topic.split("/");
    const productKey = splitted[1];
    const deviceKey = splitted[2];
    const obj = JSON.parse(message.toString());
    (0, import_adapterService.updateSolarFlowState)(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      (/* @__PURE__ */ new Date()).getTime()
    );
    if (((_a = obj.properties) == null ? void 0 : _a.electricLevel) != null && ((_b = obj.properties) == null ? void 0 : _b.electricLevel) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.properties.electricLevel
      );
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && obj.properties.electricLevel == 100) {
        (0, import_calculationService.setEnergyWhMax)(adapter, productKey, deviceKey);
      }
    }
    if (((_c = obj.properties) == null ? void 0 : _c.outputHomePower) != null && ((_d = obj.properties) == null ? void 0 : _d.outputHomePower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.properties.outputHomePower
      );
    }
    if (((_e = obj.properties) == null ? void 0 : _e.outputLimit) != null && ((_f = obj.properties) == null ? void 0 : _f.outputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputLimit",
        obj.properties.outputLimit
      );
    }
    if (((_g = obj.properties) == null ? void 0 : _g.outputPackPower) != null && ((_h = obj.properties) == null ? void 0 : _h.outputPackPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.properties.outputPackPower
      );
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packInputPower", 0);
    }
    if (((_i = obj.properties) == null ? void 0 : _i.packInputPower) != null && ((_j = obj.properties) == null ? void 0 : _j.packInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.properties.packInputPower
      );
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0
      );
    }
    if (((_k = obj.properties) == null ? void 0 : _k.solarInputPower) != null && ((_l = obj.properties) == null ? void 0 : _l.solarInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }
    if (((_m = obj.properties) == null ? void 0 : _m.pvPower1) != null && ((_n = obj.properties) == null ? void 0 : _n.pvPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }
    if (((_o = obj.properties) == null ? void 0 : _o.pvPower2) != null && ((_p = obj.properties) == null ? void 0 : _p.pvPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }
    if (((_q = obj.properties) == null ? void 0 : _q.solarPower1) != null && ((_r = obj.properties) == null ? void 0 : _r.solarPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.properties.solarPower1
      );
    }
    if (((_s = obj.properties) == null ? void 0 : _s.solarPower2) != null && ((_t = obj.properties) == null ? void 0 : _t.solarPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.properties.solarPower2
      );
    }
    if (((_u = obj.properties) == null ? void 0 : _u.remainOutTime) != null && ((_v = obj.properties) == null ? void 0 : _v.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
      if (adapter.config.useCalculation) {
        const packInputPower = Number(
          (_w = await adapter.getStateAsync(
            productKey + "." + deviceKey + ".packInputPower"
          )) == null ? void 0 : _w.val
        );
        const outputPackPower = Number(
          (_x = await adapter.getStateAsync(
            productKey + "." + deviceKey + ".outputPackPower"
          )) == null ? void 0 : _x.val
        );
        if (packInputPower && packInputPower > 0) {
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainOutTime",
            obj.properties.remainOutTime < 59940 ? (0, import_timeHelper.toHoursAndMinutes)(obj.properties.remainOutTime) : ""
          );
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainInputTime",
            ""
          );
        } else if (outputPackPower && outputPackPower > 0) {
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainInputTime",
            obj.properties.remainInputTime < 59940 ? (0, import_timeHelper.toHoursAndMinutes)(obj.properties.remainInputTime) : ""
          );
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainOutTime",
            ""
          );
        }
      }
    }
    if (((_y = obj.properties) == null ? void 0 : _y.socSet) != null && ((_z = obj.properties) == null ? void 0 : _z.socSet) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.properties.socSet) / 10
      );
    }
    if (((_A = obj.properties) == null ? void 0 : _A.minSoc) != null && ((_B = obj.properties) == null ? void 0 : _B.minSoc) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.properties.minSoc) / 10
      );
    }
    if (obj.packData) {
      addOrUpdatePackData(adapter, productKey, deviceKey, obj.packData);
    }
  }
  if (adapter == null ? void 0 : adapter.mqttClient) {
  }
};
const setChargeLimit = async (adapter2, productKey, deviceKey, socSet) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (socSet > 40 && socSet <= 100) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;
      const socSetLimit = { properties: { socSet: socSet * 10 } };
      adapter2.log.debug(
        `[setChargeLimit] Setting ChargeLimit for device key ${deviceKey} to ${socSet}!`
      );
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter2.log.debug(
        `[setChargeLimit] Charge limit is not in range 40<>100!`
      );
    }
  }
};
const setDischargeLimit = async (adapter2, productKey, deviceKey, minSoc) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (minSoc > 0 && minSoc < 90) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;
      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter2.log.debug(
        `[setDischargeLimit] Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`
      );
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter2.log.debug(
        `[setDischargeLimit] Discharge limit is not in range 0<>90!`
      );
    }
  }
};
const setOutputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (adapter2.config.useLowVoltageBlock) {
      const lowVoltageBlockState = await adapter2.getStateAsync(
        productKey + "." + deviceKey + ".control.lowVoltageBlock"
      );
      if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true) {
        limit = 0;
      }
    }
    const currentLimit = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".outputLimit")) == null ? void 0 : _a.val;
    if (currentLimit != null && currentLimit != void 0) {
      if (currentLimit != limit) {
        if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0) {
          if (limit < 100 && limit > 90) {
            limit = 90;
          } else if (limit < 90 && limit > 60) {
            limit = 60;
          } else if (limit < 60 && limit > 30) {
            limit = 30;
          } else if (limit < 30) {
            limit = 30;
          }
        }
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;
        const outputlimit = { properties: { outputLimit: limit } };
        adapter2.log.debug(
          `[setOutputLimit] Setting Output Limit for device key ${deviceKey} to ${limit}!`
        );
        (_b = adapter2.mqttClient) == null ? void 0 : _b.publish(topic, JSON.stringify(outputlimit));
      } else {
        adapter2.log.debug(
          `[setOutputLimit] Output Limit for device key ${deviceKey} is already at ${limit}!`
        );
      }
    }
  }
};
const connectMqttClient = (_adapter) => {
  adapter = _adapter;
  const options = {
    clientId: adapter.accessToken,
    username: "zenApp",
    password: adapter.config.server && adapter.config.server == "eu" ? "H6s$j9CtNa0N" : "oK#PCgy6OZxd",
    clean: true,
    protocolVersion: 5
  };
  if (mqtt && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug("[connectMqttClient] Connecting to MQTT client...");
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options
    );
    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);
      adapter.log.debug(
        `[connectMqttClient] Found ${adapter.deviceList.length} SolarFlow devices.`
      );
      adapter.deviceList.forEach((device) => {
        var _a, _b;
        if (adapter) {
          (0, import_createSolarFlowStates.createSolarFlowStates)(adapter, device.productKey, device.deviceKey);
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            device.productKey,
            device.deviceKey,
            "electricLevel",
            device.electricity
          );
          const reportTopic = `/${device.productKey}/${device.deviceKey}/properties/report`;
          const iotTopic = `iot/${device.productKey}/${device.deviceKey}/#`;
          adapter.log.debug(
            `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
          );
          (_a = adapter.mqttClient) == null ? void 0 : _a.subscribe(reportTopic, onSubscribe);
          adapter.log.debug(
            `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic}`
          );
          (_b = adapter.mqttClient) == null ? void 0 : _b.subscribe(iotTopic, onSubscribe);
        }
      });
      adapter.mqttClient.on("message", onMessage);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  connectMqttClient,
  setChargeLimit,
  setDischargeLimit,
  setOutputLimit
});
//# sourceMappingURL=mqttService.js.map
