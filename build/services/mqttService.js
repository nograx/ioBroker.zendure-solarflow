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
  connectCloudMqttClient: () => connectCloudMqttClient,
  connectLocalMqttClient: () => connectLocalMqttClient,
  setAcMode: () => setAcMode,
  setAcSwitch: () => setAcSwitch,
  setAutoModel: () => setAutoModel,
  setAutoRecover: () => setAutoRecover,
  setBuzzerSwitch: () => setBuzzerSwitch,
  setChargeLimit: () => setChargeLimit,
  setDcSwitch: () => setDcSwitch,
  setDeviceAutomationLimit: () => setDeviceAutomationLimit,
  setDischargeLimit: () => setDischargeLimit,
  setHubState: () => setHubState,
  setInputLimit: () => setInputLimit,
  setOutputLimit: () => setOutputLimit,
  setPassMode: () => setPassMode,
  setSmartMode: () => setSmartMode,
  subscribeIotTopic: () => subscribeIotTopic,
  subscribeReportTopic: () => subscribeReportTopic,
  triggerFullTelemetryUpdate: () => triggerFullTelemetryUpdate
});
module.exports = __toCommonJS(mqttService_exports);
var mqtt = __toESM(require("mqtt"));
var import_adapterService = require("./adapterService");
var import_calculationService = require("./calculationService");
var import_jobSchedule = require("./jobSchedule");
var import_createSolarFlowLocalStates = require("../helpers/createSolarFlowLocalStates");
var import_createSolarFlowStates = require("../helpers/createSolarFlowStates");
var import_helpers = require("../helpers/helpers");
let adapter = void 0;
const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh"
];
const addOrUpdatePackData = async (productKey, deviceKey, packData, isSolarFlow) => {
  if (adapter && productKey && deviceKey) {
    await packData.forEach(async (x) => {
      if (x.sn && adapter) {
        let batType = "";
        if (productKey == "yWF7hV") {
          batType = "AIO2400";
        } else if (x.sn.startsWith("A")) {
          batType = "AB1000";
        } else if (x.sn.startsWith("B")) {
          batType = "AB1000S";
        } else if (x.sn.startsWith("C")) {
          if (x.sn[3] == "F") {
            batType = "AB2000S";
          } else {
            batType = "AB2000";
          }
        } else if (x.sn.startsWith("F")) {
          batType = "AB3000X";
        }
        if (!adapter.pack2Devices.some(
          (y) => y.packSn == x.sn && y.deviceKey == deviceKey
        )) {
          adapter.pack2Devices.push({
            packSn: x.sn,
            deviceKey,
            type: batType
          });
          adapter.log.debug(
            `[addOrUpdatePackData] Added battery ${batType} with SN ${x.sn} on deviceKey ${deviceKey} to pack2Devices!`
          );
        }
        const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(adapter.FORBIDDEN_CHARS, "");
        await (adapter == null ? void 0 : adapter.extendObject(key, {
          type: "channel",
          common: {
            name: {
              de: batType,
              en: batType
            }
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.extendObject(key + ".model", {
          type: "state",
          common: {
            name: {
              de: "Batterietyp",
              en: "Battery type"
            },
            type: "string",
            desc: "model",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setState(key + ".model", batType, true));
        await (adapter == null ? void 0 : adapter.extendObject(key + ".sn", {
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
        await (adapter == null ? void 0 : adapter.setState(key + ".sn", x.sn, true));
        if (x.socLevel) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".socLevel", {
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
              write: false,
              unit: "%"
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(key + ".socLevel", x.socLevel, true));
        }
        if (x.maxTemp) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".maxTemp", {
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
              write: false,
              unit: "\xB0C"
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(
            key + ".maxTemp",
            x.maxTemp / 10 - 273.15,
            true
          ));
        }
        if (x.minVol) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".minVol", {
            type: "state",
            common: {
              name: "minVol",
              type: "number",
              desc: "minVol",
              role: "value",
              read: true,
              write: false,
              unit: "V"
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(key + ".minVol", x.minVol / 100, true));
        }
        if (x.batcur) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".batcur", {
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
          await (adapter == null ? void 0 : adapter.setState(key + ".batcur", x.batcur / 10, true));
        }
        if (x.maxVol) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".maxVol", {
            type: "state",
            common: {
              name: "maxVol",
              type: "number",
              desc: "maxVol",
              role: "value",
              read: true,
              write: false,
              unit: "V"
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(key + ".maxVol", x.maxVol / 100, true));
        }
        if (x.totalVol) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".totalVol", {
            type: "state",
            common: {
              name: "totalVol",
              type: "number",
              desc: "totalVol",
              role: "value",
              read: true,
              write: false,
              unit: "V"
            },
            native: {}
          }));
          const totalVol = x.totalVol / 100;
          await (adapter == null ? void 0 : adapter.setState(key + ".totalVol", totalVol, true));
          if (isSolarFlow) {
            (0, import_adapterService.checkVoltage)(adapter, productKey, deviceKey, totalVol);
          }
        }
        if (x.soh) {
          await (adapter == null ? void 0 : adapter.extendObject(key + ".soh", {
            type: "state",
            common: {
              name: {
                de: "Gesundheitszustand",
                en: "State of Health"
              },
              type: "number",
              desc: "State of Health",
              role: "value",
              read: true,
              write: false,
              unit: "%"
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(key + ".soh", x.soh / 10, true));
        }
        let found = false;
        Object.entries(x).forEach(([key2, value]) => {
          knownPackDataProperties.forEach((property) => {
            if (property == key2) {
              found = true;
            }
          });
          if (found) {
          } else {
            adapter == null ? void 0 : adapter.log.debug(
              `[addOrUpdatePackData] ${key2} with value ${value} is a UNKNOWN PackData Mqtt Property!`
            );
          }
        });
      }
    });
  }
};
const onMessage = async (topic, message) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga, _Ha, _Ia, _Ja, _Ka, _La, _Ma, _Na, _Oa, _Pa, _Qa, _Ra, _Sa, _Ta, _Ua, _Va, _Wa, _Xa, _Ya, _Za, __a, _$a;
  if (adapter) {
    if (topic.toLowerCase().includes("loginOut/force")) {
    }
    const topicSplitted = topic.replace("/server/app", "").split("/");
    const productKey = topicSplitted[1];
    const deviceKey = topicSplitted[2];
    let obj = {};
    try {
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[onMessage] JSON Parse error!`);
      adapter.log.debug(`[onMessage] JSON Parse error: ${txt}!`);
    }
    let isSolarFlow = false;
    const productName = await adapter.getStateAsync(
      `${productKey}.${deviceKey}.productName`
    );
    if (adapter.log.level == "debug") {
      adapter.log.debug(
        `[onMessage] MQTT message on topic '${topic}': ${message.toString()}`
      );
    }
    if (obj.timestamp) {
      const currentTimeStamp = (/* @__PURE__ */ new Date()).getTime() / 1e3;
      const diff = currentTimeStamp - obj.timestamp;
      if (diff > 600) {
        (0, import_adapterService.updateSolarFlowState)(
          adapter,
          productKey,
          deviceKey,
          "wifiState",
          "Disconnected"
        );
      } else {
        (0, import_adapterService.updateSolarFlowState)(
          adapter,
          productKey,
          deviceKey,
          "wifiState",
          "Connected"
        );
      }
    }
    if (productKey != "8bM93H") {
      isSolarFlow = true;
    }
    (0, import_adapterService.updateSolarFlowState)(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      (/* @__PURE__ */ new Date()).getTime()
    );
    if (((_a = obj.properties) == null ? void 0 : _a.autoModel) != null && ((_b = obj.properties) == null ? void 0 : _b.autoModel) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "autoModel",
        obj.properties.autoModel
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "autoModel",
        obj.properties.autoModel
      );
    }
    if (((_c = obj.properties) == null ? void 0 : _c.heatState) != null && ((_d = obj.properties) == null ? void 0 : _d.heatState) != void 0) {
      const value = ((_e = obj.properties) == null ? void 0 : _e.heatState) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "heatState", value);
    }
    if (((_f = obj.properties) == null ? void 0 : _f.electricLevel) != null && ((_g = obj.properties) == null ? void 0 : _g.electricLevel) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.properties.electricLevel
      );
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && obj.properties.electricLevel == 100 && isSolarFlow) {
        (0, import_calculationService.setEnergyWhMax)(adapter, productKey, deviceKey);
      }
      if (obj.properties.electricLevel == 100) {
        const fullChargeNeeded = await adapter.getStateAsync(
          productKey + "." + deviceKey + ".control.fullChargeNeeded"
        );
        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
          await (adapter == null ? void 0 : adapter.setState(
            `${productKey}.${deviceKey}.control.fullChargeNeeded`,
            false,
            true
          ));
        }
      }
      const minSoc = await (adapter == null ? void 0 : adapter.getStateAsync(
        `${productKey}.${deviceKey}.minSoc`
      ));
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && minSoc && minSoc.val && obj.properties.electricLevel == Number(minSoc.val) && isSolarFlow) {
        (0, import_calculationService.setSocToZero)(adapter, productKey, deviceKey);
      }
    }
    if (obj.power != null && obj.power != void 0) {
      const value = obj.power / 10;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "power", value);
    }
    if (((_h = obj.properties) == null ? void 0 : _h.packState) != null && ((_i = obj.properties) == null ? void 0 : _i.packState) != void 0) {
      const value = ((_j = obj.properties) == null ? void 0 : _j.packState) == 0 ? "Idle" : ((_k = obj.properties) == null ? void 0 : _k.packState) == 1 ? "Charging" : ((_l = obj.properties) == null ? void 0 : _l.packState) == 2 ? "Discharging" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packState", value);
      if ((_m = obj.properties) == null ? void 0 : _m.packState) {
        (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packPower", 0);
      }
    }
    if (((_n = obj.properties) == null ? void 0 : _n.passMode) != null && ((_o = obj.properties) == null ? void 0 : _o.passMode) != void 0) {
      const value = ((_p = obj.properties) == null ? void 0 : _p.passMode) == 0 ? "Automatic" : ((_q = obj.properties) == null ? void 0 : _q.passMode) == 1 ? "Always off" : ((_r = obj.properties) == null ? void 0 : _r.passMode) == 2 ? "Always on" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "passMode", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "passMode",
        (_s = obj.properties) == null ? void 0 : _s.passMode
      );
    }
    if (((_t = obj.properties) == null ? void 0 : _t.pass) != null && ((_u = obj.properties) == null ? void 0 : _u.pass) != void 0) {
      const value = ((_v = obj.properties) == null ? void 0 : _v.pass) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pass", value);
    }
    if (((_w = obj.properties) == null ? void 0 : _w.autoRecover) != null && ((_x = obj.properties) == null ? void 0 : _x.autoRecover) != void 0) {
      const value = ((_y = obj.properties) == null ? void 0 : _y.autoRecover) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );
    }
    if (((_z = obj.properties) == null ? void 0 : _z.outputHomePower) != null && ((_A = obj.properties) == null ? void 0 : _A.outputHomePower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.properties.outputHomePower
      );
    }
    if (((_B = obj.properties) == null ? void 0 : _B.energyPower) != null && ((_C = obj.properties) == null ? void 0 : _C.energyPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "energyPower",
        obj.properties.energyPower
      );
    }
    if (((_D = obj.properties) == null ? void 0 : _D.outputLimit) != null && ((_E = obj.properties) == null ? void 0 : _E.outputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputLimit",
        obj.properties.outputLimit
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "setOutputLimit",
        obj.properties.outputLimit
      );
    }
    if (((_F = obj.properties) == null ? void 0 : _F.smartMode) != null && ((_G = obj.properties) == null ? void 0 : _G.smartMode) != void 0) {
      const value = ((_H = obj.properties) == null ? void 0 : _H.smartMode) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "smartMode", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "smartMode",
        value
      );
    }
    if (((_I = obj.properties) == null ? void 0 : _I.buzzerSwitch) != null && ((_J = obj.properties) == null ? void 0 : _J.buzzerSwitch) != void 0) {
      const value = ((_K = obj.properties) == null ? void 0 : _K.buzzerSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );
    }
    if (((_L = obj.properties) == null ? void 0 : _L.outputPackPower) != null && ((_M = obj.properties) == null ? void 0 : _M.outputPackPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.properties.outputPackPower
      );
      if (((_N = obj.properties) == null ? void 0 : _N.outputPackPower) > 0) {
        (0, import_adapterService.updateSolarFlowState)(
          adapter,
          productKey,
          deviceKey,
          "packPower",
          obj.properties.outputPackPower
        );
      } else if (((_O = obj.properties) == null ? void 0 : _O.outputPackPower) == 0) {
        const packInputPower = await (adapter == null ? void 0 : adapter.getStateAsync(
          productKey + "." + deviceKey + ".packInputPower"
        ));
        if ((packInputPower == null ? void 0 : packInputPower.val) == 0) {
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "packPower",
            -Math.abs(obj.properties.outputPackPower)
          );
        }
      }
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packInputPower", 0);
    }
    if (((_P = obj.properties) == null ? void 0 : _P.packInputPower) != null && ((_Q = obj.properties) == null ? void 0 : _Q.packInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.properties.packInputPower
      );
      if (((_R = obj.properties) == null ? void 0 : _R.packInputPower) > 0) {
        (0, import_adapterService.updateSolarFlowState)(
          adapter,
          productKey,
          deviceKey,
          "packPower",
          -Math.abs(obj.properties.packInputPower)
        );
      } else if (((_S = obj.properties) == null ? void 0 : _S.packInputPower) == 0) {
        const outputPackPower = await (adapter == null ? void 0 : adapter.getStateAsync(
          productKey + "." + deviceKey + ".outputPackPower"
        ));
        if ((outputPackPower == null ? void 0 : outputPackPower.val) == 0) {
          (0, import_adapterService.updateSolarFlowState)(
            adapter,
            productKey,
            deviceKey,
            "packPower",
            -Math.abs(obj.properties.packInputPower)
          );
        }
      }
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0
      );
    }
    if (((_T = obj.properties) == null ? void 0 : _T.solarInputPower) != null && ((_U = obj.properties) == null ? void 0 : _U.solarInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }
    if (((_V = obj.properties) == null ? void 0 : _V.pvPower1) != null && ((_W = obj.properties) == null ? void 0 : _W.pvPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }
    if (((_X = obj.properties) == null ? void 0 : _X.pvPower2) != null && ((_Y = obj.properties) == null ? void 0 : _Y.pvPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }
    if (((_Z = obj.properties) == null ? void 0 : _Z.solarPower1) != null && ((__ = obj.properties) == null ? void 0 : __.solarPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.properties.solarPower1
      );
    }
    if (((_$ = obj.properties) == null ? void 0 : _$.solarPower2) != null && ((_aa = obj.properties) == null ? void 0 : _aa.solarPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.properties.solarPower2
      );
    }
    if (((_ba = obj.properties) == null ? void 0 : _ba.solarPower3) != null && ((_ca = obj.properties) == null ? void 0 : _ca.solarPower3) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower3",
        obj.properties.solarPower3
      );
    }
    if (((_da = obj.properties) == null ? void 0 : _da.solarPower4) != null && ((_ea = obj.properties) == null ? void 0 : _ea.solarPower4) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower4",
        obj.properties.solarPower4
      );
    }
    if (((_fa = obj.properties) == null ? void 0 : _fa.remainOutTime) != null && ((_ga = obj.properties) == null ? void 0 : _ga.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }
    if (((_ha = obj.properties) == null ? void 0 : _ha.remainInputTime) != null && ((_ia = obj.properties) == null ? void 0 : _ia.remainInputTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }
    if (((_ja = obj.properties) == null ? void 0 : _ja.socSet) != null && ((_ka = obj.properties) == null ? void 0 : _ka.socSet) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.properties.socSet) / 10
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "chargeLimit",
        Number(obj.properties.socSet) / 10
      );
    }
    if (((_la = obj.properties) == null ? void 0 : _la.minSoc) != null && ((_ma = obj.properties) == null ? void 0 : _ma.minSoc) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.properties.minSoc) / 10
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "dischargeLimit",
        Number(obj.properties.minSoc) / 10
      );
    }
    if (((_na = obj.properties) == null ? void 0 : _na.inputLimit) != null && ((_oa = obj.properties) == null ? void 0 : _oa.inputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inputLimit",
        obj.properties.inputLimit
      );
      if (((_pa = productName == null ? void 0 : productName.val) == null ? void 0 : _pa.toString().toLowerCase().includes("solarflow")) || ((_qa = productName == null ? void 0 : productName.val) == null ? void 0 : _qa.toString().toLowerCase().includes("ace")) || ((_ra = productName == null ? void 0 : productName.val) == null ? void 0 : _ra.toString().toLowerCase().includes("hyper"))) {
        (0, import_adapterService.updateSolarFlowControlState)(
          adapter,
          productKey,
          deviceKey,
          "setInputLimit",
          obj.properties.inputLimit
        );
      }
    }
    if (((_sa = obj.properties) == null ? void 0 : _sa.gridInputPower) != null && ((_ta = obj.properties) == null ? void 0 : _ta.gridInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridInputPower
      );
    }
    if (((_ua = obj.properties) == null ? void 0 : _ua.acMode) != null && ((_va = obj.properties) == null ? void 0 : _va.acMode) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "acMode",
        obj.properties.acMode
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "acMode",
        obj.properties.acMode
      );
    }
    if (((_wa = obj.properties) == null ? void 0 : _wa.hyperTmp) != null && ((_xa = obj.properties) == null ? void 0 : _xa.hyperTmp) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "hyperTmp",
        obj.properties.hyperTmp / 10 - 273.15
      );
    }
    if (((_ya = obj.properties) == null ? void 0 : _ya.acOutputPower) != null && ((_za = obj.properties) == null ? void 0 : _za.acOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "acOutputPower",
        obj.properties.acOutputPower
      );
    }
    if (((_Aa = obj.properties) == null ? void 0 : _Aa.gridPower) != null && ((_Ba = obj.properties) == null ? void 0 : _Ba.gridPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridPower
      );
    }
    if (((_Ca = obj.properties) == null ? void 0 : _Ca.acSwitch) != null && ((_Da = obj.properties) == null ? void 0 : _Da.acSwitch) != void 0) {
      const value = ((_Ea = obj.properties) == null ? void 0 : _Ea.acSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "acSwitch", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "acSwitch",
        value
      );
    }
    if (((_Fa = obj.properties) == null ? void 0 : _Fa.dcSwitch) != null && ((_Ga = obj.properties) == null ? void 0 : _Ga.dcSwitch) != void 0) {
      const value = ((_Ha = obj.properties) == null ? void 0 : _Ha.dcSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "dcSwitch", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "dcSwitch",
        value
      );
    }
    if (((_Ia = obj.properties) == null ? void 0 : _Ia.dcOutputPower) != null && ((_Ja = obj.properties) == null ? void 0 : _Ja.dcOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "dcOutputPower",
        obj.properties.dcOutputPower
      );
    }
    if (((_Ka = obj.properties) == null ? void 0 : _Ka.pvBrand) != null && ((_La = obj.properties) == null ? void 0 : _La.pvBrand) != void 0) {
      const value = ((_Ma = obj.properties) == null ? void 0 : _Ma.pvBrand) == 0 ? "Others" : ((_Na = obj.properties) == null ? void 0 : _Na.pvBrand) == 1 ? "Hoymiles" : ((_Oa = obj.properties) == null ? void 0 : _Oa.pvBrand) == 2 ? "Enphase" : ((_Pa = obj.properties) == null ? void 0 : _Pa.pvBrand) == 3 ? "APSystems" : ((_Qa = obj.properties) == null ? void 0 : _Qa.pvBrand) == 4 ? "Anker" : ((_Ra = obj.properties) == null ? void 0 : _Ra.pvBrand) == 5 ? "Deye" : ((_Sa = obj.properties) == null ? void 0 : _Sa.pvBrand) == 6 ? "Bosswerk" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pvBrand", value);
    }
    if (((_Ta = obj.properties) == null ? void 0 : _Ta.inverseMaxPower) != null && ((_Ua = obj.properties) == null ? void 0 : _Ua.inverseMaxPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.properties.inverseMaxPower
      );
    }
    if (((_Va = obj.properties) == null ? void 0 : _Va.wifiState) != null && ((_Wa = obj.properties) == null ? void 0 : _Wa.wifiState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }
    if (((_Xa = obj.properties) == null ? void 0 : _Xa.packNum) != null && ((_Ya = obj.properties) == null ? void 0 : _Ya.packNum) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packNum",
        obj.properties.packNum
      );
    }
    if (((_Za = obj.properties) == null ? void 0 : _Za.hubState) != null && ((__a = obj.properties) == null ? void 0 : __a.hubState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.properties.hubState
      );
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.properties.hubState
      );
    }
    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData, isSolarFlow);
    }
    if (obj.properties && adapter.log.level == "debug") {
      const _productName = (_$a = productName == null ? void 0 : productName.val) == null ? void 0 : _$a.toString();
      if (_productName) {
        const states = (0, import_createSolarFlowStates.getStateDefinition)(_productName);
        let found = false;
        Object.entries(obj.properties).forEach(([key, value]) => {
          states.forEach((state) => {
            if (state.title == key) {
              found = true;
            }
          });
          if (found) {
          } else {
            adapter == null ? void 0 : adapter.log.debug(
              `[onMessage] ${productName == null ? void 0 : productName.val}: ${key} with value ${JSON.stringify(value)} is a UNKNOWN Mqtt Property!`
            );
          }
        });
      }
    }
  }
};
const setAcMode = async (adapter2, productKey, deviceKey, acMode) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (acMode >= 0 && acMode <= 2) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;
      const setAcMode2 = { properties: { acMode } };
      adapter2.log.debug(`[setAcMode] Set AC mode to ${acMode}!`);
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setAcMode2));
    } else {
      adapter2.log.error(`[setAcMode] AC mode must be a value between 0 and 2!`);
    }
  }
};
const setChargeLimit = async (adapter2, productKey, deviceKey, socSet) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (socSet >= 40 && socSet <= 100) {
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
    if (minSoc >= 0 && minSoc <= 50) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;
      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter2.log.debug(
        `[setDischargeLimit] Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`
      );
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter2.log.debug(
        `[setDischargeLimit] Discharge limit is not in range 0<>50!`
      );
    }
  }
};
const setHubState = async (adapter2, productKey, deviceKey, hubState) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (hubState == 0 || hubState == 1) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;
      const socSetLimit = { properties: { hubState } };
      adapter2.log.debug(
        `[setHubState] Setting Hub State for device key ${deviceKey} to ${hubState}!`
      );
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter2.log.debug(`[setHubState] Hub state is not 0 or 1!`);
    }
  }
};
const setDeviceAutomationLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b;
  if (adapter2.mqttClient && productKey && deviceKey) {
    adapter2.log.debug(
      `[setDeviceAutomationLimit] Set device Automation limit to ${limit}!`
    );
    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }
    if (adapter2.config.useLowVoltageBlock) {
      const lowVoltageBlockState = await adapter2.getStateAsync(
        productKey + "." + deviceKey + ".control.lowVoltageBlock"
      );
      if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true) {
        limit = 0;
      }
      const fullChargeNeeded = await adapter2.getStateAsync(
        productKey + "." + deviceKey + ".control.fullChargeNeeded"
      );
      if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
        limit = 0;
      }
    }
    limit = (0, import_helpers.getMinAndMaxOutputLimitForProductKey)(productKey, limit);
    const topic = `iot/${productKey}/${deviceKey}/function/invoke`;
    adapter2.msgCounter += 1;
    const timestamp = /* @__PURE__ */ new Date();
    timestamp.setMilliseconds(0);
    let _arguments = [
      {
        autoModelProgram: 2,
        autoModelValue: limit,
        msgType: 1,
        autoModel: 8
      }
    ];
    const productName = (0, import_helpers.getProductNameFromProductKey)(productKey);
    if (productName.toLowerCase().includes("2400 ac") || productName.toLowerCase().includes("solarflow 800")) {
      const outputlimit = {
        arguments: {
          outputPower: limit,
          chargeState: limit > 0 ? 0 : 1,
          chargePower: limit > 0 ? 0 : -limit,
          mode: 9
        },
        function: "deviceAutomation",
        messageId: adapter2.msgCounter,
        deviceKey,
        timestamp: timestamp.getTime() / 1e3
      };
      (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(outputlimit));
    } else if (productName.toLowerCase().includes("ace")) {
      _arguments = [
        {
          autoModelProgram: 2,
          autoModelValue: {
            chargingType: limit > 0 ? 0 : 1,
            chargingPower: limit > 0 ? 0 : -limit,
            freq: 0,
            outPower: limit
          },
          msgType: 1,
          autoModel: 8
        }
      ];
    } else {
      if (productName.toLowerCase().includes("hyper")) {
        if (limit < 0) {
          _arguments = [
            {
              autoModelProgram: 1,
              autoModelValue: {
                upTime: 0,
                chargingType: 1,
                pullTime: 1800,
                price: 2,
                chargingPower: -limit,
                prices: [
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1,
                  1
                ],
                outPower: 0,
                freq: 0
              },
              msgType: 1,
              autoModel: 8
            }
          ];
        } else {
          _arguments = [
            {
              autoModelProgram: 2,
              autoModelValue: {
                chargingType: 0,
                chargingPower: 0,
                freq: 0,
                outPower: limit
              },
              msgType: 1,
              autoModel: 8
            }
          ];
        }
      }
      const outputlimit = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: adapter2.msgCounter,
        deviceKey,
        timestamp: timestamp.getTime() / 1e3
      };
      (_b = adapter2.mqttClient) == null ? void 0 : _b.publish(topic, JSON.stringify(outputlimit));
    }
  }
};
const setOutputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b, _c;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const autoModel = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".autoModel")) == null ? void 0 : _a.val;
    if (autoModel != 0) {
      adapter2.log.warn(
        "Operation mode (autoModel) is not set to '0', we can't set the output limit!"
      );
      return;
    }
    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }
    if (adapter2.config.useLowVoltageBlock) {
      const lowVoltageBlockState = await adapter2.getStateAsync(
        productKey + "." + deviceKey + ".control.lowVoltageBlock"
      );
      if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true) {
        limit = 0;
      }
      const fullChargeNeeded = await adapter2.getStateAsync(
        productKey + "." + deviceKey + ".control.fullChargeNeeded"
      );
      if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
        limit = 0;
      }
    }
    const currentLimit = (_b = await adapter2.getStateAsync(productKey + "." + deviceKey + ".outputLimit")) == null ? void 0 : _b.val;
    if (currentLimit != null && currentLimit != void 0) {
      if (currentLimit != limit) {
        limit = (0, import_helpers.getMinAndMaxOutputLimitForProductKey)(productKey, limit);
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;
        const outputlimit = { properties: { outputLimit: limit } };
        adapter2.msgCounter += 1;
        const timestamp = /* @__PURE__ */ new Date();
        timestamp.setMilliseconds(0);
        (_c = adapter2.mqttClient) == null ? void 0 : _c.publish(topic, JSON.stringify(outputlimit));
      }
    }
  }
};
const setInputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }
    let maxLimit = 900;
    const currentLimit = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".inputLimit")) == null ? void 0 : _a.val;
    const productName = (0, import_helpers.getProductNameFromProductKey)(productKey);
    if (productName == null ? void 0 : productName.includes("hyper")) {
      maxLimit = 1200;
    }
    if (productName == null ? void 0 : productName.includes("2400 ac")) {
      maxLimit = 2400;
    }
    if (productName == null ? void 0 : productName.includes("solarflow 800")) {
      maxLimit = 800;
    }
    if (productName == null ? void 0 : productName.includes("ace")) {
      limit = Math.ceil(limit / 100) * 100;
    }
    if (limit < 0) {
      limit = 0;
    } else if (limit > 0 && limit <= 30) {
      limit = 30;
    } else if (limit > maxLimit) {
      limit = maxLimit;
    }
    if (currentLimit != null && currentLimit != void 0) {
      if (currentLimit != limit) {
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;
        const inputLimitContent = { properties: { inputLimit: limit } };
        (_b = adapter2.mqttClient) == null ? void 0 : _b.publish(topic, JSON.stringify(inputLimitContent));
      }
    }
  }
};
const setSmartMode = async (adapter2, productKey, deviceKey, smartModeOn) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setSmartModeContent = {
      properties: { smartMode: smartModeOn ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setBuzzer] Setting Smart Mode for device key ${deviceKey} to ${smartModeOn}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setSmartModeContent));
  }
};
const setBuzzerSwitch = async (adapter2, productKey, deviceKey, buzzerOn) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setBuzzerSwitchContent = {
      properties: { buzzerSwitch: buzzerOn ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setBuzzer] Setting Buzzer for device key ${deviceKey} to ${buzzerOn}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setBuzzerSwitchContent));
  }
};
const setAutoModel = async (adapter2, productKey, deviceKey, autoModel) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    let setAutoModelContent = { properties: { autoModel } };
    switch (autoModel) {
      case 8:
        setAutoModelContent = {
          properties: {
            autoModelProgram: 1,
            autoModelValue: { chargingType: 0, chargingPower: 0, outPower: 0 },
            msgType: 1,
            autoModel: 8
          }
        };
        break;
      case 9:
        setAutoModelContent = {
          properties: {
            autoModelProgram: 2,
            autoModelValue: { chargingType: 3, chargingPower: 0, outPower: 0 },
            msgType: 1,
            autoModel: 9
          }
        };
        break;
    }
    adapter2.log.debug(
      `[setAutoModel] Setting autoModel for device key ${deviceKey} to ${autoModel}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setAutoModelContent));
  }
};
const triggerFullTelemetryUpdate = async (adapter2, productKey, deviceKey) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/read`;
    const getAllContent = { properties: ["getAll"] };
    adapter2.log.debug(
      `[triggerFullTelemetryUpdate] Triggering full telemetry update for device key ${deviceKey}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(getAllContent));
  }
};
const setPassMode = async (adapter2, productKey, deviceKey, passMode) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setPassModeContent = { properties: { passMode } };
    adapter2.log.debug(
      `[setPassMode] Set passMode for device ${deviceKey} to ${passMode}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setPassModeContent));
  }
};
const setAutoRecover = async (adapter2, productKey, deviceKey, autoRecover) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setAutoRecoverContent = {
      properties: { autoRecover: autoRecover ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setAutoRecover] Set autoRecover for device ${deviceKey} to ${autoRecover}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setAutoRecoverContent));
  }
};
const setDcSwitch = async (adapter2, productKey, deviceKey, dcSwitch) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setDcSwitchContent = {
      properties: { dcSwitch: dcSwitch ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setDcSwitch] Set DC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setDcSwitchContent));
  }
};
const setAcSwitch = async (adapter2, productKey, deviceKey, acSwitch) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setAcSwitchContent = {
      properties: { acSwitch: acSwitch ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setAcSwitch] Set AC Switch for device ${deviceKey} to ${acSwitch}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setAcSwitchContent));
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
const onSubscribeIotTopic = (error, productKey, deviceKey) => {
  if (error) {
    adapter == null ? void 0 : adapter.log.error("Subscription to MQTT failed! Error: " + error);
  } else if (adapter) {
    adapter == null ? void 0 : adapter.log.debug("Subscription of IOT Topic successful!");
    triggerFullTelemetryUpdate(adapter, productKey, deviceKey);
  }
};
const subscribeReportTopic = (productKey, deviceKey, timeout) => {
  const reportTopic = `/${productKey}/${deviceKey}/#`;
  setTimeout(() => {
    var _a;
    if (adapter) {
      adapter.log.debug(
        `[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic}`
      );
      (_a = adapter.mqttClient) == null ? void 0 : _a.subscribe(reportTopic, onSubscribeReportTopic);
    }
  }, timeout);
};
const subscribeIotTopic = (productKey, deviceKey, timeout) => {
  const iotTopic = `iot/${productKey}/${deviceKey}/#`;
  setTimeout(() => {
    var _a;
    adapter == null ? void 0 : adapter.log.debug(
      `[subscribeIotTopic] Subscribing to MQTT Topic: ${iotTopic}`
    );
    (_a = adapter == null ? void 0 : adapter.mqttClient) == null ? void 0 : _a.subscribe(iotTopic, (error) => {
      onSubscribeIotTopic(error, productKey, deviceKey);
    });
  }, timeout);
};
const connectCloudMqttClient = (_adapter) => {
  var _a, _b;
  adapter = _adapter;
  if (!((_a = adapter.paths) == null ? void 0 : _a.mqttPassword)) {
    adapter.log.error(`[connectCloudMqttClient] MQTT Password is missing!`);
    return;
  }
  const mqttPassword = atob((_b = adapter.paths) == null ? void 0 : _b.mqttPassword);
  const options = {
    clientId: adapter.accessToken,
    username: "zenApp",
    password: mqttPassword,
    clean: true,
    protocolVersion: 5
  };
  if (mqtt && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug(
      `[connectCloudMqttClient] Connecting to MQTT broker ${adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort}...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options
    );
    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);
      adapter.deviceList.forEach(
        (device, index) => {
          var _a2;
          if (adapter) {
            let connectIot = true;
            if (device.productKey == "s3Xk4x") {
              const smartPlugReportTopic = `/server/app/${adapter.userId}/${device.id}/smart/power`;
              (_a2 = adapter.mqttClient) == null ? void 0 : _a2.subscribe(
                smartPlugReportTopic,
                onSubscribeReportTopic
              );
              connectIot = false;
            }
            subscribeReportTopic(
              device.productKey,
              device.deviceKey,
              1e3 * index
            );
            if (connectIot) {
              subscribeIotTopic(
                device.productKey,
                device.deviceKey,
                1e3 * index
              );
            }
            if (device.packList && device.packList.length > 0) {
              device.packList.forEach(async (subDevice) => {
                if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
                  subscribeReportTopic(
                    subDevice.productKey,
                    subDevice.deviceKey,
                    1e3 * index
                  );
                  subscribeIotTopic(
                    subDevice.productKey,
                    subDevice.deviceKey,
                    2e3 * index
                  );
                }
              });
            }
          }
        }
      );
      adapter.mqttClient.on("message", onMessage);
      (0, import_jobSchedule.startResetValuesJob)(adapter);
      (0, import_jobSchedule.startCheckStatesAndConnectionJob)(adapter);
      if (adapter.config.useCalculation) {
        (0, import_jobSchedule.startCalculationJob)(adapter);
      }
    }
  }
};
const connectLocalMqttClient = (_adapter) => {
  adapter = _adapter;
  const options = {
    clientId: "ioBroker.zendure-solarflow." + adapter.instance
  };
  if (mqtt && adapter && adapter.config && adapter.config.localMqttUrl) {
    adapter.log.debug(
      `[connectLocalMqttClient] Connecting to MQTT broker ${adapter.config.localMqttUrl + ":1883"}...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.config.localMqttUrl + ":1883",
      options
    );
    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);
      adapter.setState("info.connection", true, true);
      if (adapter.config.localDevice1ProductKey && adapter.config.localDevice1DeviceKey) {
        (0, import_createSolarFlowLocalStates.createSolarFlowLocalStates)(
          adapter,
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey
        );
        subscribeReportTopic(
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey,
          1e3
        );
        subscribeIotTopic(
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey,
          1e3
        );
      }
      if (adapter.config.localDevice2ProductKey && adapter.config.localDevice2DeviceKey) {
        (0, import_createSolarFlowLocalStates.createSolarFlowLocalStates)(
          adapter,
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey
        );
        subscribeReportTopic(
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey,
          2e3
        );
        subscribeIotTopic(
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey,
          2e3
        );
      }
      if (adapter.config.localDevice3ProductKey && adapter.config.localDevice3DeviceKey) {
        (0, import_createSolarFlowLocalStates.createSolarFlowLocalStates)(
          adapter,
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey
        );
        subscribeReportTopic(
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey,
          2e3
        );
        subscribeIotTopic(
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey,
          2e3
        );
      }
      if (adapter.config.localDevice4ProductKey && adapter.config.localDevice4DeviceKey) {
        (0, import_createSolarFlowLocalStates.createSolarFlowLocalStates)(
          adapter,
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey
        );
        subscribeReportTopic(
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey,
          2e3
        );
        subscribeIotTopic(
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey,
          2e3
        );
      }
      adapter.mqttClient.on("message", onMessage);
      (0, import_jobSchedule.startResetValuesJob)(adapter);
      (0, import_jobSchedule.startCheckStatesAndConnectionJob)(adapter);
      if (adapter.config.useCalculation) {
        (0, import_jobSchedule.startCalculationJob)(adapter);
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  connectCloudMqttClient,
  connectLocalMqttClient,
  setAcMode,
  setAcSwitch,
  setAutoModel,
  setAutoRecover,
  setBuzzerSwitch,
  setChargeLimit,
  setDcSwitch,
  setDeviceAutomationLimit,
  setDischargeLimit,
  setHubState,
  setInputLimit,
  setOutputLimit,
  setPassMode,
  setSmartMode,
  subscribeIotTopic,
  subscribeReportTopic,
  triggerFullTelemetryUpdate
});
//# sourceMappingURL=mqttService.js.map
