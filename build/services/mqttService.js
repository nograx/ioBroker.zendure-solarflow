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
  setAcSwitch: () => setAcSwitch,
  setAutoRecover: () => setAutoRecover,
  setBuzzerSwitch: () => setBuzzerSwitch,
  setChargeLimit: () => setChargeLimit,
  setDcSwitch: () => setDcSwitch,
  setDischargeLimit: () => setDischargeLimit,
  setInputLimit: () => setInputLimit,
  setOutputLimit: () => setOutputLimit,
  setPassMode: () => setPassMode,
  triggerFullTelemetryUpdate: () => triggerFullTelemetryUpdate
});
module.exports = __toCommonJS(mqttService_exports);
var mqtt = __toESM(require("mqtt"));
var import_adapterService = require("./adapterService");
var import_calculationService = require("./calculationService");
var import_ISolarFlowMqttProperties = require("../models/ISolarFlowMqttProperties");
var import_jobSchedule = require("./jobSchedule");
let adapter = void 0;
const addOrUpdatePackData = async (productKey, deviceKey, packData, isSolarFlow) => {
  if (adapter && productKey && deviceKey) {
    await packData.forEach(async (x) => {
      if (x.sn && adapter) {
        const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(adapter.FORBIDDEN_CHARS, "");
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
        await (adapter == null ? void 0 : adapter.setStateAsync(key + ".sn", x.sn, true));
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
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setStateAsync(key + ".socLevel", x.socLevel, true));
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
          await (adapter == null ? void 0 : adapter.extendObject(key + ".minVol", {
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
          await (adapter == null ? void 0 : adapter.extendObject(key + ".maxVol", {
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
              write: false
            },
            native: {}
          }));
          const totalVol = x.totalVol / 100;
          await (adapter == null ? void 0 : adapter.setState(key + ".totalVol", totalVol, true));
          if (isSolarFlow) {
            (0, import_adapterService.checkVoltage)(adapter, productKey, deviceKey, totalVol);
          }
        }
      }
    });
  }
};
const onMessage = async (topic, message) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca;
  if (adapter) {
    const topicSplitted = topic.split("/");
    const productKey = topicSplitted[1];
    const deviceKey = topicSplitted[2];
    let obj = {};
    try {
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[JSON PARSE ERROR] ${txt}`);
    }
    let isSolarFlow = false;
    const productName = await adapter.getStateAsync(
      `${productKey}.${deviceKey}.productName`
    );
    if (((_a = productName == null ? void 0 : productName.val) == null ? void 0 : _a.toString().toLowerCase().includes("solarflow")) || ((_b = productName == null ? void 0 : productName.val) == null ? void 0 : _b.toString().toLowerCase().includes("hyper"))) {
      isSolarFlow = true;
    }
    (0, import_adapterService.updateSolarFlowState)(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      (/* @__PURE__ */ new Date()).getTime()
    );
    if (((_c = obj.properties) == null ? void 0 : _c.electricLevel) != null && ((_d = obj.properties) == null ? void 0 : _d.electricLevel) != void 0) {
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
      const minSoc = await (adapter == null ? void 0 : adapter.getStateAsync(
        `${productKey}.${deviceKey}.minSoc`
      ));
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && minSoc && minSoc.val && obj.properties.electricLevel <= Number(minSoc.val) && isSolarFlow) {
        (0, import_calculationService.setSocToZero)(adapter, productKey, deviceKey);
      }
    }
    if (((_e = obj.properties) == null ? void 0 : _e.packState) != null && ((_f = obj.properties) == null ? void 0 : _f.packState) != void 0) {
      const value = ((_g = obj.properties) == null ? void 0 : _g.packState) == 0 ? "Idle" : ((_h = obj.properties) == null ? void 0 : _h.packState) == 1 ? "Charging" : ((_i = obj.properties) == null ? void 0 : _i.packState) == 2 ? "Discharging" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packState", value);
    }
    if (((_j = obj.properties) == null ? void 0 : _j.passMode) != null && ((_k = obj.properties) == null ? void 0 : _k.passMode) != void 0) {
      const value = ((_l = obj.properties) == null ? void 0 : _l.passMode) == 0 ? "Automatic" : ((_m = obj.properties) == null ? void 0 : _m.passMode) == 1 ? "Always off" : ((_n = obj.properties) == null ? void 0 : _n.passMode) == 2 ? "Always on" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "passMode", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "passMode",
        (_o = obj.properties) == null ? void 0 : _o.passMode
      );
    }
    if (((_p = obj.properties) == null ? void 0 : _p.pass) != null && ((_q = obj.properties) == null ? void 0 : _q.pass) != void 0) {
      const value = ((_r = obj.properties) == null ? void 0 : _r.pass) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pass", value);
    }
    if (((_s = obj.properties) == null ? void 0 : _s.autoRecover) != null && ((_t = obj.properties) == null ? void 0 : _t.autoRecover) != void 0) {
      const value = ((_u = obj.properties) == null ? void 0 : _u.autoRecover) == 0 ? false : true;
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
    if (((_v = obj.properties) == null ? void 0 : _v.outputHomePower) != null && ((_w = obj.properties) == null ? void 0 : _w.outputHomePower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.properties.outputHomePower
      );
    }
    if (((_x = obj.properties) == null ? void 0 : _x.outputLimit) != null && ((_y = obj.properties) == null ? void 0 : _y.outputLimit) != void 0) {
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
    if (((_z = obj.properties) == null ? void 0 : _z.buzzerSwitch) != null && ((_A = obj.properties) == null ? void 0 : _A.buzzerSwitch) != void 0) {
      const value = ((_B = obj.properties) == null ? void 0 : _B.buzzerSwitch) == 0 ? false : true;
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
    if (((_C = obj.properties) == null ? void 0 : _C.outputPackPower) != null && ((_D = obj.properties) == null ? void 0 : _D.outputPackPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.properties.outputPackPower
      );
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packInputPower", 0);
    }
    if (((_E = obj.properties) == null ? void 0 : _E.packInputPower) != null && ((_F = obj.properties) == null ? void 0 : _F.packInputPower) != void 0) {
      let standbyUsage = 0;
      const solarInputPower = await (adapter == null ? void 0 : adapter.getStateAsync(
        `${productKey}.${deviceKey}.solarInputPower`
      ));
      if (solarInputPower && Number(solarInputPower.val) < 10) {
        standbyUsage = 10 - Number(solarInputPower.val);
      }
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.properties.packInputPower + standbyUsage
      );
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0
      );
    }
    if (((_G = obj.properties) == null ? void 0 : _G.solarInputPower) != null && ((_H = obj.properties) == null ? void 0 : _H.solarInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }
    if (((_I = obj.properties) == null ? void 0 : _I.pvPower1) != null && ((_J = obj.properties) == null ? void 0 : _J.pvPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }
    if (((_K = obj.properties) == null ? void 0 : _K.pvPower2) != null && ((_L = obj.properties) == null ? void 0 : _L.pvPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }
    if (((_M = obj.properties) == null ? void 0 : _M.solarPower1) != null && ((_N = obj.properties) == null ? void 0 : _N.solarPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.properties.solarPower1
      );
    }
    if (((_O = obj.properties) == null ? void 0 : _O.solarPower2) != null && ((_P = obj.properties) == null ? void 0 : _P.solarPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.properties.solarPower2
      );
    }
    if (((_Q = obj.properties) == null ? void 0 : _Q.remainOutTime) != null && ((_R = obj.properties) == null ? void 0 : _R.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }
    if (((_S = obj.properties) == null ? void 0 : _S.remainInputTime) != null && ((_T = obj.properties) == null ? void 0 : _T.remainInputTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }
    if (((_U = obj.properties) == null ? void 0 : _U.socSet) != null && ((_V = obj.properties) == null ? void 0 : _V.socSet) != void 0) {
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
    if (((_W = obj.properties) == null ? void 0 : _W.minSoc) != null && ((_X = obj.properties) == null ? void 0 : _X.minSoc) != void 0) {
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
    if (((_Y = obj.properties) == null ? void 0 : _Y.inputLimit) != null && ((_Z = obj.properties) == null ? void 0 : _Z.inputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inputLimit",
        obj.properties.inputLimit
      );
    }
    if (((__ = obj.properties) == null ? void 0 : __.gridInputPower) != null && ((_$ = obj.properties) == null ? void 0 : _$.gridInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridInputPower
      );
    }
    if (((_aa = obj.properties) == null ? void 0 : _aa.acOutputPower) != null && ((_ba = obj.properties) == null ? void 0 : _ba.acOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "acOutputPower",
        obj.properties.acOutputPower
      );
    }
    if (((_ca = obj.properties) == null ? void 0 : _ca.gridPower) != null && ((_da = obj.properties) == null ? void 0 : _da.gridPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridPower",
        obj.properties.gridPower
      );
    }
    if (((_ea = obj.properties) == null ? void 0 : _ea.acSwitch) != null && ((_fa = obj.properties) == null ? void 0 : _fa.acSwitch) != void 0) {
      const value = ((_ga = obj.properties) == null ? void 0 : _ga.acSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "acSwitch", value);
    }
    if (((_ha = obj.properties) == null ? void 0 : _ha.dcSwitch) != null && ((_ia = obj.properties) == null ? void 0 : _ia.dcSwitch) != void 0) {
      const value = ((_ja = obj.properties) == null ? void 0 : _ja.dcSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "dcSwitch", value);
    }
    if (((_ka = obj.properties) == null ? void 0 : _ka.dcOutputPower) != null && ((_la = obj.properties) == null ? void 0 : _la.dcOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "dcOutputPower",
        obj.properties.dcOutputPower
      );
    }
    if (((_ma = obj.properties) == null ? void 0 : _ma.pvBrand) != null && ((_na = obj.properties) == null ? void 0 : _na.pvBrand) != void 0) {
      const value = ((_oa = obj.properties) == null ? void 0 : _oa.pvBrand) == 0 ? "Others" : ((_pa = obj.properties) == null ? void 0 : _pa.pvBrand) == 1 ? "Hoymiles" : ((_qa = obj.properties) == null ? void 0 : _qa.pvBrand) == 2 ? "Enphase" : ((_ra = obj.properties) == null ? void 0 : _ra.pvBrand) == 3 ? "APSystems" : ((_sa = obj.properties) == null ? void 0 : _sa.pvBrand) == 4 ? "Anker" : ((_ta = obj.properties) == null ? void 0 : _ta.pvBrand) == 5 ? "Deye" : ((_ua = obj.properties) == null ? void 0 : _ua.pvBrand) == 6 ? "Bosswerk" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pvBrand", value);
    }
    if (((_va = obj.properties) == null ? void 0 : _va.inverseMaxPower) != null && ((_wa = obj.properties) == null ? void 0 : _wa.inverseMaxPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.properties.inverseMaxPower
      );
    }
    if (((_xa = obj.properties) == null ? void 0 : _xa.wifiState) != null && ((_ya = obj.properties) == null ? void 0 : _ya.wifiState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }
    if (((_za = obj.properties) == null ? void 0 : _za.packNum) != null && ((_Aa = obj.properties) == null ? void 0 : _Aa.packNum) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packNum",
        obj.properties.packNum
      );
    }
    if (((_Ba = obj.properties) == null ? void 0 : _Ba.hubState) != null && ((_Ca = obj.properties) == null ? void 0 : _Ca.hubState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.properties.hubState == 0 ? "Stop output and standby" : "Stop output and shut down"
      );
    }
    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData, isSolarFlow);
    }
    if (obj.properties) {
      Object.entries(obj.properties).forEach(([key, value]) => {
        if (import_ISolarFlowMqttProperties.knownMqttProps.includes(key)) {
        } else {
          console.log(
            `${productName == null ? void 0 : productName.val}: ${key} with value ${value} is a UNKNOWN Mqtt Prop!`
          );
        }
      });
    }
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
        (_b = adapter2.mqttClient) == null ? void 0 : _b.publish(topic, JSON.stringify(outputlimit));
      }
    }
  }
};
const setInputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const currentLimit = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".inputLimit")) == null ? void 0 : _a.val;
    limit = Math.ceil(limit / 100) * 100;
    if (limit < 0) {
      limit = 0;
    } else if (limit > 900) {
      limit = 900;
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
const setBuzzerSwitch = async (adapter2, productKey, deviceKey, buzzerOn) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const socSetLimit = { properties: { buzzerSwitch: buzzerOn ? 1 : 0 } };
    adapter2.log.debug(
      `[setBuzzer] Setting Buzzer for device key ${deviceKey} to ${buzzerOn}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
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
      `[setPassMode] Set autoRecover for device ${deviceKey} to ${autoRecover}!`
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
      `[setPassMode] Set DC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setDcSwitchContent));
  }
};
const setAcSwitch = async (adapter2, productKey, deviceKey, dcSwitch) => {
  var _a;
  if (adapter2.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;
    const setDcSwitchContent = {
      properties: { dcSwitch: dcSwitch ? 1 : 0 }
    };
    adapter2.log.debug(
      `[setPassMode] Set AC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    (_a = adapter2.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(setDcSwitchContent));
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
    adapter.log.debug(
      `[connectMqttClient] Connecting to MQTT broker ${adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort}...`
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
          if (adapter) {
            const reportTopic = `/${device.productKey}/${device.deviceKey}/properties/report`;
            const iotTopic = `iot/${device.productKey}/${device.deviceKey}/#`;
            setTimeout(() => {
              var _a;
              if (adapter) {
                adapter.log.debug(
                  `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
                );
                (_a = adapter.mqttClient) == null ? void 0 : _a.subscribe(
                  reportTopic,
                  onSubscribeReportTopic
                );
              }
            }, 1e3 * index);
            setTimeout(() => {
              var _a;
              adapter == null ? void 0 : adapter.log.debug(
                `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic}`
              );
              (_a = adapter == null ? void 0 : adapter.mqttClient) == null ? void 0 : _a.subscribe(iotTopic, (error) => {
                onSubscribeIotTopic(error, device.productKey, device.deviceKey);
              });
            }, 1500 * index);
          }
        }
      );
      adapter.mqttClient.on("message", onMessage);
      (0, import_jobSchedule.startResetValuesJob)(adapter);
      (0, import_jobSchedule.startCheckStatesAndConnectionJob)(adapter);
      (0, import_jobSchedule.startRefreshAccessTokenTimerJob)(adapter);
      if (adapter.config.useCalculation) {
        (0, import_jobSchedule.startCalculationJob)(adapter);
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  connectMqttClient,
  setAcSwitch,
  setAutoRecover,
  setBuzzerSwitch,
  setChargeLimit,
  setDcSwitch,
  setDischargeLimit,
  setInputLimit,
  setOutputLimit,
  setPassMode,
  triggerFullTelemetryUpdate
});
//# sourceMappingURL=mqttService.js.map
