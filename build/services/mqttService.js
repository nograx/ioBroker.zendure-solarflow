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
  setAcMode: () => setAcMode,
  setAcSwitch: () => setAcSwitch,
  setAutoRecover: () => setAutoRecover,
  setBuzzerSwitch: () => setBuzzerSwitch,
  setChargeLimit: () => setChargeLimit,
  setDcSwitch: () => setDcSwitch,
  setDischargeLimit: () => setDischargeLimit,
  setHubState: () => setHubState,
  setInputLimit: () => setInputLimit,
  setOutputLimit: () => setOutputLimit,
  setPassMode: () => setPassMode,
  triggerFullTelemetryUpdate: () => triggerFullTelemetryUpdate
});
module.exports = __toCommonJS(mqttService_exports);
var mqtt = __toESM(require("mqtt"));
var import_adapterService = require("./adapterService");
var import_calculationService = require("./calculationService");
var import_jobSchedule = require("./jobSchedule");
let adapter = void 0;
const addOrUpdatePackData = async (productKey, deviceKey, packData, isSolarFlow) => {
  if (adapter && productKey && deviceKey) {
    await packData.forEach(async (x) => {
      if (x.sn && adapter) {
        let batType = "";
        if (x.sn.startsWith("C")) {
          batType = "AB2000";
        } else if (x.sn.startsWith("A")) {
          batType = "AB1000";
        }
        if (!adapter.pack2Devices.some(
          (y) => y.packSn == x.sn && y.deviceKey == deviceKey
        )) {
          adapter.pack2Devices.push({
            packSn: x.sn,
            deviceKey,
            type: batType
          });
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
              write: false
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
              write: false
            },
            native: {}
          }));
          await (adapter == null ? void 0 : adapter.setState(key + ".minVol", x.minVol / 100, true));
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga, _Ha, _Ia, _Ja, _Ka, _La;
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
    if (deviceKey == "Np6E071g") {
      console.log(obj.properties);
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
    if (((_x = obj.properties) == null ? void 0 : _x.energyPower) != null && ((_y = obj.properties) == null ? void 0 : _y.energyPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "energyPower",
        obj.properties.energyPower
      );
    }
    if (((_z = obj.properties) == null ? void 0 : _z.outputLimit) != null && ((_A = obj.properties) == null ? void 0 : _A.outputLimit) != void 0) {
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
    if (((_B = obj.properties) == null ? void 0 : _B.buzzerSwitch) != null && ((_C = obj.properties) == null ? void 0 : _C.buzzerSwitch) != void 0) {
      const value = ((_D = obj.properties) == null ? void 0 : _D.buzzerSwitch) == 0 ? false : true;
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
    if (((_E = obj.properties) == null ? void 0 : _E.outputPackPower) != null && ((_F = obj.properties) == null ? void 0 : _F.outputPackPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.properties.outputPackPower
      );
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "packInputPower", 0);
    }
    if (((_G = obj.properties) == null ? void 0 : _G.packInputPower) != null && ((_H = obj.properties) == null ? void 0 : _H.packInputPower) != void 0) {
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
    if (((_I = obj.properties) == null ? void 0 : _I.solarInputPower) != null && ((_J = obj.properties) == null ? void 0 : _J.solarInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }
    if (((_K = obj.properties) == null ? void 0 : _K.pvPower1) != null && ((_L = obj.properties) == null ? void 0 : _L.pvPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }
    if (((_M = obj.properties) == null ? void 0 : _M.pvPower2) != null && ((_N = obj.properties) == null ? void 0 : _N.pvPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }
    if (((_O = obj.properties) == null ? void 0 : _O.solarPower1) != null && ((_P = obj.properties) == null ? void 0 : _P.solarPower1) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.properties.solarPower1
      );
    }
    if (((_Q = obj.properties) == null ? void 0 : _Q.solarPower2) != null && ((_R = obj.properties) == null ? void 0 : _R.solarPower2) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.properties.solarPower2
      );
    }
    if (((_S = obj.properties) == null ? void 0 : _S.remainOutTime) != null && ((_T = obj.properties) == null ? void 0 : _T.remainOutTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }
    if (((_U = obj.properties) == null ? void 0 : _U.remainInputTime) != null && ((_V = obj.properties) == null ? void 0 : _V.remainInputTime) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }
    if (((_W = obj.properties) == null ? void 0 : _W.socSet) != null && ((_X = obj.properties) == null ? void 0 : _X.socSet) != void 0) {
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
    if (((_Y = obj.properties) == null ? void 0 : _Y.minSoc) != null && ((_Z = obj.properties) == null ? void 0 : _Z.minSoc) != void 0) {
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
    if (((__ = obj.properties) == null ? void 0 : __.inputLimit) != null && ((_$ = obj.properties) == null ? void 0 : _$.inputLimit) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inputLimit",
        obj.properties.inputLimit
      );
      if (((_aa = productName == null ? void 0 : productName.val) == null ? void 0 : _aa.toString().toLowerCase().includes("solarflow")) || ((_ba = productName == null ? void 0 : productName.val) == null ? void 0 : _ba.toString().toLowerCase().includes("ace")) || ((_ca = productName == null ? void 0 : productName.val) == null ? void 0 : _ca.toString().toLowerCase().includes("hyper"))) {
        (0, import_adapterService.updateSolarFlowControlState)(
          adapter,
          productKey,
          deviceKey,
          "setInputLimit",
          obj.properties.inputLimit
        );
      }
    }
    if (((_da = obj.properties) == null ? void 0 : _da.gridInputPower) != null && ((_ea = obj.properties) == null ? void 0 : _ea.gridInputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridInputPower
      );
    }
    if (((_fa = obj.properties) == null ? void 0 : _fa.acMode) != null && ((_ga = obj.properties) == null ? void 0 : _ga.acMode) != void 0) {
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
    if (((_ha = obj.properties) == null ? void 0 : _ha.hyperTmp) != null && ((_ia = obj.properties) == null ? void 0 : _ia.hyperTmp) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "hyperTmp",
        obj.properties.hyperTmp / 10 - 273.15
      );
    }
    if (((_ja = obj.properties) == null ? void 0 : _ja.acOutputPower) != null && ((_ka = obj.properties) == null ? void 0 : _ka.acOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "acOutputPower",
        obj.properties.acOutputPower
      );
    }
    if (((_la = obj.properties) == null ? void 0 : _la.gridPower) != null && ((_ma = obj.properties) == null ? void 0 : _ma.gridPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "gridPower",
        obj.properties.gridPower
      );
    }
    if (((_na = obj.properties) == null ? void 0 : _na.acSwitch) != null && ((_oa = obj.properties) == null ? void 0 : _oa.acSwitch) != void 0) {
      const value = ((_pa = obj.properties) == null ? void 0 : _pa.acSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "acSwitch", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "acSwitch",
        value
      );
    }
    if (((_qa = obj.properties) == null ? void 0 : _qa.dcSwitch) != null && ((_ra = obj.properties) == null ? void 0 : _ra.dcSwitch) != void 0) {
      const value = ((_sa = obj.properties) == null ? void 0 : _sa.dcSwitch) == 0 ? false : true;
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "dcSwitch", value);
      (0, import_adapterService.updateSolarFlowControlState)(
        adapter,
        productKey,
        deviceKey,
        "dcSwitch",
        value
      );
    }
    if (((_ta = obj.properties) == null ? void 0 : _ta.dcOutputPower) != null && ((_ua = obj.properties) == null ? void 0 : _ua.dcOutputPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "dcOutputPower",
        obj.properties.dcOutputPower
      );
    }
    if (((_va = obj.properties) == null ? void 0 : _va.pvBrand) != null && ((_wa = obj.properties) == null ? void 0 : _wa.pvBrand) != void 0) {
      const value = ((_xa = obj.properties) == null ? void 0 : _xa.pvBrand) == 0 ? "Others" : ((_ya = obj.properties) == null ? void 0 : _ya.pvBrand) == 1 ? "Hoymiles" : ((_za = obj.properties) == null ? void 0 : _za.pvBrand) == 2 ? "Enphase" : ((_Aa = obj.properties) == null ? void 0 : _Aa.pvBrand) == 3 ? "APSystems" : ((_Ba = obj.properties) == null ? void 0 : _Ba.pvBrand) == 4 ? "Anker" : ((_Ca = obj.properties) == null ? void 0 : _Ca.pvBrand) == 5 ? "Deye" : ((_Da = obj.properties) == null ? void 0 : _Da.pvBrand) == 6 ? "Bosswerk" : "Unknown";
      (0, import_adapterService.updateSolarFlowState)(adapter, productKey, deviceKey, "pvBrand", value);
    }
    if (((_Ea = obj.properties) == null ? void 0 : _Ea.inverseMaxPower) != null && ((_Fa = obj.properties) == null ? void 0 : _Fa.inverseMaxPower) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.properties.inverseMaxPower
      );
    }
    if (((_Ga = obj.properties) == null ? void 0 : _Ga.wifiState) != null && ((_Ha = obj.properties) == null ? void 0 : _Ha.wifiState) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }
    if (((_Ia = obj.properties) == null ? void 0 : _Ia.packNum) != null && ((_Ja = obj.properties) == null ? void 0 : _Ja.packNum) != void 0) {
      (0, import_adapterService.updateSolarFlowState)(
        adapter,
        productKey,
        deviceKey,
        "packNum",
        obj.properties.packNum
      );
    }
    if (((_Ka = obj.properties) == null ? void 0 : _Ka.hubState) != null && ((_La = obj.properties) == null ? void 0 : _La.hubState) != void 0) {
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
    if (minSoc > 0 && minSoc < 50) {
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
const setOutputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b, _c, _d;
  if (adapter2.mqttClient && productKey && deviceKey) {
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
    const currentLimit = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".outputLimit")) == null ? void 0 : _a.val;
    const productName = (_c = (_b = await adapter2.getStateAsync(productKey + "." + deviceKey + ".productName")) == null ? void 0 : _b.val) == null ? void 0 : _c.toString().toLowerCase();
    if (currentLimit != null && currentLimit != void 0) {
      if (currentLimit != limit) {
        if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0) {
          if (limit < 100 && limit > 90 && !(productName == null ? void 0 : productName.includes("hyper"))) {
            limit = 90;
          } else if (limit > 60 && limit < 90 && !(productName == null ? void 0 : productName.includes("hyper"))) {
            limit = 60;
          } else if (limit > 30 && limit < 60 && !(productName == null ? void 0 : productName.includes("hyper"))) {
            limit = 30;
          } else if (limit < 30) {
            limit = 30;
          }
        }
        if (limit > 1200) {
          limit = 1200;
        }
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;
        const outputlimit = { properties: { outputLimit: limit } };
        (_d = adapter2.mqttClient) == null ? void 0 : _d.publish(topic, JSON.stringify(outputlimit));
      }
    }
  }
};
const setInputLimit = async (adapter2, productKey, deviceKey, limit) => {
  var _a, _b, _c, _d;
  if (adapter2.mqttClient && productKey && deviceKey) {
    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }
    let maxLimit = 900;
    const currentLimit = (_a = await adapter2.getStateAsync(productKey + "." + deviceKey + ".inputLimit")) == null ? void 0 : _a.val;
    const productName = (_c = (_b = await adapter2.getStateAsync(productKey + "." + deviceKey + ".productName")) == null ? void 0 : _b.val) == null ? void 0 : _c.toString().toLowerCase();
    if (productName == null ? void 0 : productName.includes("hyper")) {
      maxLimit = 1200;
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
        (_d = adapter2.mqttClient) == null ? void 0 : _d.publish(topic, JSON.stringify(inputLimitContent));
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
const connectMqttClient = (_adapter) => {
  var _a, _b;
  adapter = _adapter;
  if (!((_a = adapter.paths) == null ? void 0 : _a.mqttPassword)) {
    adapter.log.error(`[connectMqttClient] MQTT Password is missing!`);
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
            let connectIot = true;
            let reportTopic = `/${device.productKey}/${device.deviceKey}/#`;
            const iotTopic = `iot/${device.productKey}/${device.deviceKey}/#`;
            if (device.productKey == "s3Xk4x") {
              reportTopic = `/server/app/${adapter.userId}/${device.id}/smart/power`;
              connectIot = false;
            }
            setTimeout(
              () => {
                var _a2;
                if (adapter) {
                  adapter.log.debug(
                    `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
                  );
                  (_a2 = adapter.mqttClient) == null ? void 0 : _a2.subscribe(
                    reportTopic,
                    onSubscribeReportTopic
                  );
                }
              },
              1e3 * index + 1
            );
            if (connectIot) {
              setTimeout(
                () => {
                  var _a2;
                  adapter == null ? void 0 : adapter.log.debug(
                    `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic}`
                  );
                  (_a2 = adapter == null ? void 0 : adapter.mqttClient) == null ? void 0 : _a2.subscribe(iotTopic, (error) => {
                    onSubscribeIotTopic(
                      error,
                      device.productKey,
                      device.deviceKey
                    );
                  });
                },
                1500 * index + 1
              );
            }
            if (device.packList && device.packList.length > 0) {
              device.packList.forEach(async (subDevice) => {
                if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
                  const reportTopic2 = `/${subDevice.productKey}/${subDevice.deviceKey}/properties/report`;
                  const iotTopic2 = `iot/${subDevice.productKey}/${subDevice.deviceKey}/#`;
                  setTimeout(() => {
                    var _a2;
                    if (adapter) {
                      adapter.log.debug(
                        `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic2}`
                      );
                      (_a2 = adapter.mqttClient) == null ? void 0 : _a2.subscribe(
                        reportTopic2,
                        onSubscribeReportTopic
                      );
                    }
                  }, 1e3 * index);
                  setTimeout(() => {
                    var _a2;
                    adapter == null ? void 0 : adapter.log.debug(
                      `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic2}`
                    );
                    (_a2 = adapter == null ? void 0 : adapter.mqttClient) == null ? void 0 : _a2.subscribe(iotTopic2, (error) => {
                      onSubscribeIotTopic(
                        error,
                        subDevice.productKey,
                        subDevice.deviceKey
                      );
                    });
                  }, 1500 * index);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  connectMqttClient,
  setAcMode,
  setAcSwitch,
  setAutoRecover,
  setBuzzerSwitch,
  setChargeLimit,
  setDcSwitch,
  setDischargeLimit,
  setHubState,
  setInputLimit,
  setOutputLimit,
  setPassMode,
  triggerFullTelemetryUpdate
});
//# sourceMappingURL=mqttService.js.map
