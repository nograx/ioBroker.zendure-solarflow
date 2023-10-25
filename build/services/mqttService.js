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
var mqttService_exports = {};
__export(mqttService_exports, {
  connectMqttClient: () => connectMqttClient,
  setOutputLimit: () => setOutputLimit
});
module.exports = __toCommonJS(mqttService_exports);
var mqtt = __toESM(require("mqtt"));
var import_adapterService = require("./adapterService");
let client = void 0;
let adapter = void 0;
const onConnected = () => {
  adapter == null ? void 0 : adapter.log.info("Connected with MQTT!");
};
const onError = (error) => {
  adapter == null ? void 0 : adapter.log.error("Connection to MQTT failed! Error: " + error);
};
const onSubscribe = (err) => {
  if (err) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + err);
  } else {
    adapter == null ? void 0 : adapter.log.info("Subscription successful!");
  }
};
const onMessage = async (topic, message) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
  if (adapter) {
    const splitted = topic.split("/");
    const productKey = splitted[1];
    const deviceKey = splitted[2];
    const obj = JSON.parse(message.toString());
    if (((_a = obj.properties) == null ? void 0 : _a.electricLevel) != null && ((_b = obj.properties) == null ? void 0 : _b.electricLevel) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.properties.electricLevel
      );
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
    if (((_m = obj.properties) == null ? void 0 : _m.remainInputTime) != null && ((_n = obj.properties) == null ? void 0 : _n.remainInputTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }
    if (((_o = obj.properties) == null ? void 0 : _o.remainOutTime) != null && ((_p = obj.properties) == null ? void 0 : _p.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }
    if (((_q = obj.properties) == null ? void 0 : _q.socSet) != null && ((_r = obj.properties) == null ? void 0 : _r.socSet) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.properties.socSet) / 10
      );
    }
    if (((_s = obj.properties) == null ? void 0 : _s.minSoc) != null && ((_t = obj.properties) == null ? void 0 : _t.minSoc) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.properties.minSoc) / 10
      );
    }
    if (obj.packData) {
      console.log(obj.packData);
    }
  }
  if (client) {
  }
};
const setOutputLimit = (adapter2, productKey, deviceKey, limit) => {
  if (client && productKey && deviceKey) {
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
    adapter2.log.info(
      `Setting Output Limit for device key ${deviceKey} to ${limit}!`
    );
    client == null ? void 0 : client.publish(topic, JSON.stringify(outputlimit));
  }
};
const connectMqttClient = (_adapter) => {
  adapter = _adapter;
  const options = {
    clientId: adapter.accessToken,
    username: "zenApp",
    password: "oK#PCgy6OZxd",
    clean: true,
    protocolVersion: 5
  };
  if (mqtt && adapter && adapter.paths) {
    client = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options
    );
    if (client && adapter) {
      client.on("connect", onConnected);
      client.on("error", onError);
      adapter.deviceList.forEach((device) => {
        if (adapter) {
          (0, import_adapterService.createSolarFlowStates)(adapter, device.productKey, device.deviceKey);
          console.log(
            "Subscribing to: " + device.productKey + "/" + device.deviceKey
          );
          const report_topic = `/${device.productKey}/${device.deviceKey}/properties/report`;
          const iot_topic = `iot/${device.productKey}/${device.deviceKey}/#`;
          client == null ? void 0 : client.subscribe(report_topic, onSubscribe);
          client == null ? void 0 : client.subscribe(iot_topic, onSubscribe);
        }
      });
      client.on("message", onMessage);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  connectMqttClient,
  setOutputLimit
});
//# sourceMappingURL=mqttService.js.map
