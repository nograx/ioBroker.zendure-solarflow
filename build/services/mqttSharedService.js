"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mqttSharedService_exports = {};
__export(mqttSharedService_exports, {
  adapter: () => adapter,
  initAdapter: () => initAdapter,
  knownPackDataProperties: () => knownPackDataProperties,
  onConnected: () => onConnected,
  onDisconnected: () => onDisconnected,
  onError: () => onError,
  onMessage: () => onMessage,
  onSubscribeIotTopic: () => onSubscribeIotTopic,
  onSubscribeReportTopic: () => onSubscribeReportTopic
});
module.exports = __toCommonJS(mqttSharedService_exports);
let adapter = void 0;
const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh",
  "power",
  "batcur"
];
const initAdapter = (_adapter) => {
  adapter = _adapter;
  adapter.log.debug("[initAdapter] Init adapter in mqttSharedService!");
  return true;
};
const onMessage = async (topic, message) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga, _Ha, _Ia, _Ja, _Ka, _La, _Ma, _Na, _Oa, _Pa, _Qa, _Ra, _Sa, _Ta, _Ua, _Va, _Wa, _Xa;
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
    const _device = adapter == null ? void 0 : adapter.zenHaDeviceList.find(
      (x) => x.deviceKey == deviceKey
    );
    if (!_device) {
      adapter.log.error(
        `[onMessage] DeviceKey '${deviceKey} not found in device list!'}`
      );
    }
    if (adapter.log.level == "debug") {
      adapter.log.debug(
        `[onMessage] MQTT message on topic '${topic}': ${message.toString()}`
      );
    }
    if (productKey != "8bM93H") {
      isSolarFlow = true;
    }
    if (obj.function == "deviceAutomation" && obj.success == 1) {
      const currentValue = await adapter.getStateAsync(
        productKey + "." + deviceKey + ".control.setDeviceAutomationInOutLimit"
      );
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "setDeviceAutomationInOutLimit",
        (currentValue == null ? void 0 : currentValue.val) ? currentValue.val : 0
      );
    } else if (obj.function == "deviceAutomation" && obj.success == 0) {
      adapter == null ? void 0 : adapter.log.warn(
        `[onMessage] device automation failed for ${_device == null ? void 0 : _device.productName}: ${productKey}/${deviceKey}!`
      );
    }
    if (((_a = obj.properties) == null ? void 0 : _a.autoModel) != null && ((_b = obj.properties) == null ? void 0 : _b.autoModel) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("autoModel", obj.properties.autoModel);
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "autoModel",
        obj.properties.autoModel
      );
    }
    if (((_c = obj.properties) == null ? void 0 : _c.heatState) != null && ((_d = obj.properties) == null ? void 0 : _d.heatState) != void 0) {
      const value = ((_e = obj.properties) == null ? void 0 : _e.heatState) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("heatState", value);
    }
    if (((_f = obj.properties) == null ? void 0 : _f.electricLevel) != null && ((_g = obj.properties) == null ? void 0 : _g.electricLevel) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "electricLevel",
        obj.properties.electricLevel
      );
      if ((adapter == null ? void 0 : adapter.config.useCalculation) && obj.properties.electricLevel == 100 && isSolarFlow) {
        _device == null ? void 0 : _device.setEnergyWhMax();
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
        _device == null ? void 0 : _device.setSocToZero();
      }
    }
    if (obj.power != null && obj.power != void 0) {
      const value = obj.power / 10;
      _device == null ? void 0 : _device.updateSolarFlowState("power", value);
    }
    if (((_h = obj.properties) == null ? void 0 : _h.packState) != null && ((_i = obj.properties) == null ? void 0 : _i.packState) != void 0) {
      const value = ((_j = obj.properties) == null ? void 0 : _j.packState) == 0 ? "Idle" : ((_k = obj.properties) == null ? void 0 : _k.packState) == 1 ? "Charging" : ((_l = obj.properties) == null ? void 0 : _l.packState) == 2 ? "Discharging" : "Unknown";
      _device == null ? void 0 : _device.updateSolarFlowState("packState", value);
      if ((_m = obj.properties) == null ? void 0 : _m.packState) {
        _device == null ? void 0 : _device.updateSolarFlowState("packPower", 0);
      }
    }
    if (((_n = obj.properties) == null ? void 0 : _n.passMode) != null && ((_o = obj.properties) == null ? void 0 : _o.passMode) != void 0) {
      const value = ((_p = obj.properties) == null ? void 0 : _p.passMode) == 0 ? "Automatic" : ((_q = obj.properties) == null ? void 0 : _q.passMode) == 1 ? "Always off" : ((_r = obj.properties) == null ? void 0 : _r.passMode) == 2 ? "Always on" : "Unknown";
      _device == null ? void 0 : _device.updateSolarFlowState("passMode", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "passMode",
        (_s = obj.properties) == null ? void 0 : _s.passMode
      );
    }
    if (((_t = obj.properties) == null ? void 0 : _t.pass) != null && ((_u = obj.properties) == null ? void 0 : _u.pass) != void 0) {
      const value = ((_v = obj.properties) == null ? void 0 : _v.pass) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("pass", value);
    }
    if (((_w = obj.properties) == null ? void 0 : _w.autoRecover) != null && ((_x = obj.properties) == null ? void 0 : _x.autoRecover) != void 0) {
      const value = ((_y = obj.properties) == null ? void 0 : _y.autoRecover) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("autoRecover", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState("autoRecover", value);
    }
    if (((_z = obj.properties) == null ? void 0 : _z.outputHomePower) != null && ((_A = obj.properties) == null ? void 0 : _A.outputHomePower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "outputHomePower",
        obj.properties.outputHomePower
      );
    }
    if (((_B = obj.properties) == null ? void 0 : _B.energyPower) != null && ((_C = obj.properties) == null ? void 0 : _C.energyPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("energyPower", obj.properties.energyPower);
    }
    if (((_D = obj.properties) == null ? void 0 : _D.outputLimit) != null && ((_E = obj.properties) == null ? void 0 : _E.outputLimit) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("outputLimit", obj.properties.outputLimit);
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "setOutputLimit",
        obj.properties.outputLimit
      );
    }
    if (((_F = obj.properties) == null ? void 0 : _F.smartMode) != null && ((_G = obj.properties) == null ? void 0 : _G.smartMode) != void 0) {
      const value = ((_H = obj.properties) == null ? void 0 : _H.smartMode) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("smartMode", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState("smartMode", value);
    }
    if (((_I = obj.properties) == null ? void 0 : _I.buzzerSwitch) != null && ((_J = obj.properties) == null ? void 0 : _J.buzzerSwitch) != void 0) {
      const value = ((_K = obj.properties) == null ? void 0 : _K.buzzerSwitch) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("buzzerSwitch", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState("buzzerSwitch", value);
    }
    if (((_L = obj.properties) == null ? void 0 : _L.outputPackPower) != null && ((_M = obj.properties) == null ? void 0 : _M.outputPackPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "outputPackPower",
        obj.properties.outputPackPower
      );
      if (((_N = obj.properties) == null ? void 0 : _N.outputPackPower) > 0) {
        _device == null ? void 0 : _device.updateSolarFlowState(
          "packPower",
          obj.properties.outputPackPower
        );
      } else if (((_O = obj.properties) == null ? void 0 : _O.outputPackPower) == 0) {
        const packInputPower = await (adapter == null ? void 0 : adapter.getStateAsync(
          productKey + "." + deviceKey + ".packInputPower"
        ));
        if ((packInputPower == null ? void 0 : packInputPower.val) == 0) {
          _device == null ? void 0 : _device.updateSolarFlowState(
            "packPower",
            -Math.abs(obj.properties.outputPackPower)
          );
        }
      }
      _device == null ? void 0 : _device.updateSolarFlowState("packInputPower", 0);
    }
    if (((_P = obj.properties) == null ? void 0 : _P.packInputPower) != null && ((_Q = obj.properties) == null ? void 0 : _Q.packInputPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "packInputPower",
        obj.properties.packInputPower
      );
      if (((_R = obj.properties) == null ? void 0 : _R.packInputPower) > 0) {
        _device == null ? void 0 : _device.updateSolarFlowState(
          "packPower",
          -Math.abs(obj.properties.packInputPower)
        );
      } else if (((_S = obj.properties) == null ? void 0 : _S.packInputPower) == 0) {
        const outputPackPower = await (adapter == null ? void 0 : adapter.getStateAsync(
          productKey + "." + deviceKey + ".outputPackPower"
        ));
        if ((outputPackPower == null ? void 0 : outputPackPower.val) == 0) {
          _device == null ? void 0 : _device.updateSolarFlowState(
            "packPower",
            -Math.abs(obj.properties.packInputPower)
          );
        }
      }
      _device == null ? void 0 : _device.updateSolarFlowState("outputPackPower", 0);
    }
    if (((_T = obj.properties) == null ? void 0 : _T.solarInputPower) != null && ((_U = obj.properties) == null ? void 0 : _U.solarInputPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }
    if (((_V = obj.properties) == null ? void 0 : _V.pvPower1) != null && ((_W = obj.properties) == null ? void 0 : _W.pvPower1) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "pvPower2",
        // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }
    if (((_X = obj.properties) == null ? void 0 : _X.pvPower2) != null && ((_Y = obj.properties) == null ? void 0 : _Y.pvPower2) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "pvPower1",
        // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }
    if (((_Z = obj.properties) == null ? void 0 : _Z.solarPower1) != null && ((__ = obj.properties) == null ? void 0 : __.solarPower1) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("pvPower1", obj.properties.solarPower1);
    }
    if (((_$ = obj.properties) == null ? void 0 : _$.solarPower2) != null && ((_aa = obj.properties) == null ? void 0 : _aa.solarPower2) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("pvPower2", obj.properties.solarPower2);
    }
    if (((_ba = obj.properties) == null ? void 0 : _ba.solarPower3) != null && ((_ca = obj.properties) == null ? void 0 : _ca.solarPower3) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("pvPower3", obj.properties.solarPower3);
    }
    if (((_da = obj.properties) == null ? void 0 : _da.solarPower4) != null && ((_ea = obj.properties) == null ? void 0 : _ea.solarPower4) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("pvPower4", obj.properties.solarPower4);
    }
    if (((_fa = obj.properties) == null ? void 0 : _fa.remainOutTime) != null && ((_ga = obj.properties) == null ? void 0 : _ga.remainOutTime) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }
    if (((_ha = obj.properties) == null ? void 0 : _ha.remainInputTime) != null && ((_ia = obj.properties) == null ? void 0 : _ia.remainInputTime) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }
    if (((_ja = obj.properties) == null ? void 0 : _ja.socSet) != null && ((_ka = obj.properties) == null ? void 0 : _ka.socSet) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "socSet",
        Number(obj.properties.socSet) / 10
      );
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "chargeLimit",
        Number(obj.properties.socSet) / 10
      );
    }
    if (((_la = obj.properties) == null ? void 0 : _la.minSoc) != null && ((_ma = obj.properties) == null ? void 0 : _ma.minSoc) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "minSoc",
        Number(obj.properties.minSoc) / 10
      );
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "dischargeLimit",
        Number(obj.properties.minSoc) / 10
      );
    }
    if (((_na = obj.properties) == null ? void 0 : _na.inputLimit) != null && ((_oa = obj.properties) == null ? void 0 : _oa.inputLimit) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("inputLimit", obj.properties.inputLimit);
      _device == null ? void 0 : _device.updateSolarFlowControlState(
        "setInputLimit",
        obj.properties.inputLimit
      );
    }
    if (((_pa = obj.properties) == null ? void 0 : _pa.gridInputPower) != null && ((_qa = obj.properties) == null ? void 0 : _qa.gridInputPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "gridInputPower",
        obj.properties.gridInputPower
      );
    }
    if (((_ra = obj.properties) == null ? void 0 : _ra.acMode) != null && ((_sa = obj.properties) == null ? void 0 : _sa.acMode) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("acMode", obj.properties.acMode);
      _device == null ? void 0 : _device.updateSolarFlowControlState("acMode", obj.properties.acMode);
    }
    if (((_ta = obj.properties) == null ? void 0 : _ta.hyperTmp) != null && ((_ua = obj.properties) == null ? void 0 : _ua.hyperTmp) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "hyperTmp",
        obj.properties.hyperTmp / 10 - 273.15
      );
    }
    if (((_va = obj.properties) == null ? void 0 : _va.acOutputPower) != null && ((_wa = obj.properties) == null ? void 0 : _wa.acOutputPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "acOutputPower",
        obj.properties.acOutputPower
      );
    }
    if (((_xa = obj.properties) == null ? void 0 : _xa.gridPower) != null && ((_ya = obj.properties) == null ? void 0 : _ya.gridPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("gridInputPower", obj.properties.gridPower);
    }
    if (((_za = obj.properties) == null ? void 0 : _za.acSwitch) != null && ((_Aa = obj.properties) == null ? void 0 : _Aa.acSwitch) != void 0) {
      const value = ((_Ba = obj.properties) == null ? void 0 : _Ba.acSwitch) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("acSwitch", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState("acSwitch", value);
    }
    if (((_Ca = obj.properties) == null ? void 0 : _Ca.dcSwitch) != null && ((_Da = obj.properties) == null ? void 0 : _Da.dcSwitch) != void 0) {
      const value = ((_Ea = obj.properties) == null ? void 0 : _Ea.dcSwitch) == 0 ? false : true;
      _device == null ? void 0 : _device.updateSolarFlowState("dcSwitch", value);
      _device == null ? void 0 : _device.updateSolarFlowControlState("dcSwitch", value);
    }
    if (((_Fa = obj.properties) == null ? void 0 : _Fa.dcOutputPower) != null && ((_Ga = obj.properties) == null ? void 0 : _Ga.dcOutputPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "dcOutputPower",
        obj.properties.dcOutputPower
      );
    }
    if (((_Ha = obj.properties) == null ? void 0 : _Ha.pvBrand) != null && ((_Ia = obj.properties) == null ? void 0 : _Ia.pvBrand) != void 0) {
      const value = ((_Ja = obj.properties) == null ? void 0 : _Ja.pvBrand) == 0 ? "Others" : ((_Ka = obj.properties) == null ? void 0 : _Ka.pvBrand) == 1 ? "Hoymiles" : ((_La = obj.properties) == null ? void 0 : _La.pvBrand) == 2 ? "Enphase" : ((_Ma = obj.properties) == null ? void 0 : _Ma.pvBrand) == 3 ? "APSystems" : ((_Na = obj.properties) == null ? void 0 : _Na.pvBrand) == 4 ? "Anker" : ((_Oa = obj.properties) == null ? void 0 : _Oa.pvBrand) == 5 ? "Deye" : ((_Pa = obj.properties) == null ? void 0 : _Pa.pvBrand) == 6 ? "Bosswerk" : "Unknown";
      _device == null ? void 0 : _device.updateSolarFlowState("pvBrand", value);
    }
    if (((_Qa = obj.properties) == null ? void 0 : _Qa.inverseMaxPower) != null && ((_Ra = obj.properties) == null ? void 0 : _Ra.inverseMaxPower) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "inverseMaxPower",
        obj.properties.inverseMaxPower
      );
    }
    if (((_Sa = obj.properties) == null ? void 0 : _Sa.wifiState) != null && ((_Ta = obj.properties) == null ? void 0 : _Ta.wifiState) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState(
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }
    if (((_Ua = obj.properties) == null ? void 0 : _Ua.packNum) != null && ((_Va = obj.properties) == null ? void 0 : _Va.packNum) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("packNum", obj.properties.packNum);
    }
    if (((_Wa = obj.properties) == null ? void 0 : _Wa.hubState) != null && ((_Xa = obj.properties) == null ? void 0 : _Xa.hubState) != void 0) {
      _device == null ? void 0 : _device.updateSolarFlowState("hubState", obj.properties.hubState);
      _device == null ? void 0 : _device.updateSolarFlowControlState("hubState", obj.properties.hubState);
    }
    if (obj.packData) {
      _device == null ? void 0 : _device.addOrUpdatePackData(obj.packData, isSolarFlow);
    }
    if (obj.properties && adapter.log.level == "debug") {
      let found = false;
      Object.entries(obj.properties).forEach(([key, value]) => {
        _device == null ? void 0 : _device.states.forEach((state) => {
          if (state.title == key) {
            found = true;
          }
        });
        if (found) {
        } else {
          adapter == null ? void 0 : adapter.log.debug(
            `[onMessage] ${_device == null ? void 0 : _device.deviceKey}: ${key} with value ${JSON.stringify(value)} is a UNKNOWN Mqtt Property!`
          );
        }
      });
    }
  }
};
const onConnected = () => {
  if (adapter) {
    adapter.lastLogin = /* @__PURE__ */ new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info("[onConnected] Connected with MQTT!");
  }
};
const onDisconnected = () => {
  if (adapter) {
    adapter.lastLogin = /* @__PURE__ */ new Date();
    adapter.setState("info.connection", false, true);
    adapter.log.info("[onDisconnected] Disconnected from MQTT!");
  }
};
const onError = (error) => {
  if (adapter) {
    adapter.setState("info.connection", false, true);
    adapter.log.error("Connection to MQTT failed! Error: " + error);
  }
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
    const _device = adapter.zenHaDeviceList.find(
      (x) => x.productKey == productKey && x.deviceKey == deviceKey
    );
    if (_device) {
      _device.triggerFullTelemetryUpdate();
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adapter,
  initAdapter,
  knownPackDataProperties,
  onConnected,
  onDisconnected,
  onError,
  onMessage,
  onSubscribeIotTopic,
  onSubscribeReportTopic
});
//# sourceMappingURL=mqttSharedService.js.map
