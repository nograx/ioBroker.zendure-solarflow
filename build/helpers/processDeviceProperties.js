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
var processDeviceProperties_exports = {};
__export(processDeviceProperties_exports, {
  processDeviceProperties: () => processDeviceProperties
});
module.exports = __toCommonJS(processDeviceProperties_exports);
var import_allStates = require("../constants/sensorStates/allStates");
const createdStateCache = /* @__PURE__ */ new Map();
const handledMqttKeys = /* @__PURE__ */ new Set([
  "autoModel",
  "heatState",
  "electricLevel",
  "packData",
  "packState",
  "passMode",
  "pass",
  "autoRecover",
  "outputHomePower",
  "energyPower",
  "outputLimit",
  "smartMode",
  "buzzerSwitch",
  "outputPackPower",
  "packInputPower",
  "solarInputPower",
  "pvPower1",
  "pvPower2",
  "solarPower1",
  "solarPower2",
  "solarPower3",
  "solarPower4",
  "remainOutTime",
  "remainInputTime",
  "socSet",
  "minSoc",
  "inputLimit",
  "gridInputPower",
  "acMode",
  "hyperTmp",
  "acOutputPower",
  "gridPower",
  "acSwitch",
  "dcSwitch",
  "dcOutputPower",
  "pvBrand",
  "inverseMaxPower",
  "wifiState",
  "packNum",
  "hubState",
  "batteryElectric"
]);
const ensureState = async (device, stateTitle, rawValue) => {
  var _a;
  const deviceId = `${device.productKey}.${device.deviceKey}`;
  if ((_a = createdStateCache.get(deviceId)) == null ? void 0 : _a.has(stateTitle)) return;
  const stateDef = import_allStates.allStates[stateTitle];
  const productKey = device.productKey.replace(device.adapter.FORBIDDEN_CHARS, "");
  const deviceKey = device.deviceKey.replace(device.adapter.FORBIDDEN_CHARS, "");
  let type;
  let role;
  let nameDe;
  let nameEn;
  if (stateDef) {
    type = stateDef.type;
    role = stateDef.role;
    nameDe = stateDef.nameDe;
    nameEn = stateDef.nameEn;
  } else if (rawValue !== void 0) {
    const t = typeof rawValue;
    type = t === "number" ? "number" : t === "boolean" ? "boolean" : "string";
    role = "value";
    nameDe = stateTitle;
    nameEn = stateTitle;
  } else {
    return;
  }
  await device.adapter.extendObject(`${productKey}.${deviceKey}.${stateTitle}`, {
    type: "state",
    common: {
      name: { de: nameDe, en: nameEn },
      type,
      desc: stateTitle,
      role,
      read: true,
      write: false,
      unit: stateDef == null ? void 0 : stateDef.unit,
      states: stateDef == null ? void 0 : stateDef.states
    },
    native: {}
  });
  if (!createdStateCache.has(deviceId)) {
    createdStateCache.set(deviceId, /* @__PURE__ */ new Set());
  }
  createdStateCache.get(deviceId).add(stateTitle);
};
const processDeviceProperties = async (device, properties, isSolarFlow) => {
  var _a, _b, _c, _d;
  const statesToSet = /* @__PURE__ */ new Map();
  const controlStatesToSet = /* @__PURE__ */ new Map();
  if ((properties == null ? void 0 : properties.autoModel) != null) {
    statesToSet.set("autoModel", properties.autoModel);
    controlStatesToSet.set("autoModel", properties.autoModel);
  }
  if ((properties == null ? void 0 : properties.heatState) != null) {
    statesToSet.set("heatState", properties.heatState == 0 ? false : true);
  }
  if ((properties == null ? void 0 : properties.electricLevel) != null) {
    statesToSet.set("electricLevel", properties.electricLevel);
    if (((_a = device.adapter) == null ? void 0 : _a.config.useCalculation) && properties.electricLevel == 100 && isSolarFlow) {
      device.setEnergyWhMax();
    }
    if (properties.electricLevel == 100) {
      const fullChargeNeeded = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`
      );
      if ((fullChargeNeeded == null ? void 0 : fullChargeNeeded.val) == true) {
        await device.adapter.setState(
          `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`,
          false,
          true
        );
      }
    }
    const minSoc = await device.adapter.getStateAsync(
      `${device.productKey}.${device.deviceKey}.minSoc`
    );
    if (((_b = device.adapter) == null ? void 0 : _b.config.useCalculation) && (minSoc == null ? void 0 : minSoc.val) && properties.electricLevel == Number(minSoc.val) && isSolarFlow) {
      device.setSocToZero();
    }
  }
  if ((properties == null ? void 0 : properties.packState) != null) {
    statesToSet.set(
      "packState",
      properties.packState == 0 ? "Idle" : properties.packState == 1 ? "Charging" : properties.packState == 2 ? "Discharging" : "Unknown"
    );
  }
  if ((properties == null ? void 0 : properties.passMode) != null) {
    statesToSet.set(
      "passMode",
      properties.passMode == 0 ? "Automatic" : properties.passMode == 1 ? "Always off" : properties.passMode == 2 ? "Always on" : "Unknown"
    );
    controlStatesToSet.set("passMode", properties.passMode);
  }
  if ((properties == null ? void 0 : properties.pass) != null) {
    statesToSet.set("pass", properties.pass == 0 ? false : true);
  }
  if ((properties == null ? void 0 : properties.autoRecover) != null) {
    const value = properties.autoRecover == 0 ? false : true;
    statesToSet.set("autoRecover", value);
    controlStatesToSet.set("autoRecover", value);
  }
  if ((properties == null ? void 0 : properties.outputHomePower) != null) {
    statesToSet.set("outputHomePower", properties.outputHomePower);
  }
  if ((properties == null ? void 0 : properties.energyPower) != null) {
    statesToSet.set("energyPower", properties.energyPower);
  }
  if ((properties == null ? void 0 : properties.outputLimit) != null) {
    statesToSet.set("outputLimit", properties.outputLimit);
    controlStatesToSet.set("setOutputLimit", properties.outputLimit);
  }
  if ((properties == null ? void 0 : properties.smartMode) != null) {
    const value = properties.smartMode == 0 ? false : true;
    statesToSet.set("smartMode", value);
    controlStatesToSet.set("smartMode", value);
  }
  if ((properties == null ? void 0 : properties.buzzerSwitch) != null) {
    const value = properties.buzzerSwitch == 0 ? false : true;
    statesToSet.set("buzzerSwitch", value);
    controlStatesToSet.set("buzzerSwitch", value);
  }
  if ((properties == null ? void 0 : properties.outputPackPower) != null) {
    statesToSet.set("outputPackPower", properties.outputPackPower);
    if (properties.outputPackPower > 0) {
      statesToSet.set("packInputPower", 0);
    }
  }
  if ((properties == null ? void 0 : properties.packInputPower) != null) {
    statesToSet.set("packInputPower", properties.packInputPower);
    if (properties.packInputPower > 0) {
      statesToSet.set("outputPackPower", 0);
    }
  }
  if ((properties == null ? void 0 : properties.solarInputPower) != null) {
    statesToSet.set("solarInputPower", properties.solarInputPower);
  }
  if ((properties == null ? void 0 : properties.pvPower1) != null) statesToSet.set("pvPower2", properties.pvPower1);
  if ((properties == null ? void 0 : properties.pvPower2) != null) statesToSet.set("pvPower1", properties.pvPower2);
  if ((properties == null ? void 0 : properties.solarPower1) != null) statesToSet.set("pvPower1", properties.solarPower1);
  if ((properties == null ? void 0 : properties.solarPower2) != null) statesToSet.set("pvPower2", properties.solarPower2);
  if ((properties == null ? void 0 : properties.solarPower3) != null) statesToSet.set("pvPower3", properties.solarPower3);
  if ((properties == null ? void 0 : properties.solarPower4) != null) statesToSet.set("pvPower4", properties.solarPower4);
  if ((properties == null ? void 0 : properties.remainOutTime) != null) statesToSet.set("remainOutTime", properties.remainOutTime);
  if ((properties == null ? void 0 : properties.remainInputTime) != null) statesToSet.set("remainInputTime", properties.remainInputTime);
  if ((properties == null ? void 0 : properties.socSet) != null) {
    statesToSet.set("socSet", Number(properties.socSet) / 10);
    controlStatesToSet.set("chargeLimit", Number(properties.socSet) / 10);
  }
  if ((properties == null ? void 0 : properties.minSoc) != null) {
    statesToSet.set("minSoc", Number(properties.minSoc) / 10);
    controlStatesToSet.set("dischargeLimit", Number(properties.minSoc) / 10);
  }
  if ((properties == null ? void 0 : properties.inputLimit) != null) {
    statesToSet.set("inputLimit", properties.inputLimit);
    controlStatesToSet.set("setInputLimit", properties.inputLimit);
  }
  if ((properties == null ? void 0 : properties.gridInputPower) != null) statesToSet.set("gridInputPower", properties.gridInputPower);
  if ((properties == null ? void 0 : properties.acMode) != null) {
    statesToSet.set("acMode", properties.acMode);
    controlStatesToSet.set("acMode", properties.acMode);
  }
  if ((properties == null ? void 0 : properties.hyperTmp) != null) statesToSet.set("hyperTmp", properties.hyperTmp / 10 - 273.15);
  if ((properties == null ? void 0 : properties.acOutputPower) != null) statesToSet.set("acOutputPower", properties.acOutputPower);
  if ((properties == null ? void 0 : properties.gridPower) != null) statesToSet.set("gridInputPower", properties.gridPower);
  if ((properties == null ? void 0 : properties.acSwitch) != null) {
    const value = properties.acSwitch == 0 ? false : true;
    statesToSet.set("acSwitch", value);
    controlStatesToSet.set("acSwitch", value);
  }
  if ((properties == null ? void 0 : properties.dcSwitch) != null) {
    const value = properties.dcSwitch == 0 ? false : true;
    statesToSet.set("dcSwitch", value);
    controlStatesToSet.set("dcSwitch", value);
  }
  if ((properties == null ? void 0 : properties.dcOutputPower) != null) statesToSet.set("dcOutputPower", properties.dcOutputPower);
  if ((properties == null ? void 0 : properties.pvBrand) != null) {
    statesToSet.set(
      "pvBrand",
      properties.pvBrand == 0 ? "Others" : properties.pvBrand == 1 ? "Hoymiles" : properties.pvBrand == 2 ? "Enphase" : properties.pvBrand == 3 ? "APSystems" : properties.pvBrand == 4 ? "Anker" : properties.pvBrand == 5 ? "Deye" : properties.pvBrand == 6 ? "Bosswerk" : "Unknown"
    );
  }
  if ((properties == null ? void 0 : properties.inverseMaxPower) != null) statesToSet.set("inverseMaxPower", properties.inverseMaxPower);
  if ((properties == null ? void 0 : properties.wifiState) != null) {
    statesToSet.set("wifiState", properties.wifiState == 1 ? "Connected" : "Disconnected");
  }
  if ((properties == null ? void 0 : properties.packNum) != null) statesToSet.set("packNum", properties.packNum);
  if ((properties == null ? void 0 : properties.hubState) != null) {
    statesToSet.set("hubState", properties.hubState);
    controlStatesToSet.set("hubState", properties.hubState);
  }
  if ((properties == null ? void 0 : properties.batteryElectric) != null) statesToSet.set("batteryElectric", properties.batteryElectric);
  if ((properties == null ? void 0 : properties.packData) != null) {
    await device.addOrUpdatePackData(properties.packData, isSolarFlow);
  }
  if (statesToSet.has("outputPackPower") || statesToSet.has("packInputPower")) {
    let outputPower = (_c = statesToSet.get("outputPackPower")) != null ? _c : 0;
    let inputPower = (_d = statesToSet.get("packInputPower")) != null ? _d : 0;
    if (!statesToSet.has("outputPackPower")) {
      const s = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.outputPackPower`
      );
      outputPower = (s == null ? void 0 : s.val) || 0;
    }
    if (!statesToSet.has("packInputPower")) {
      const s = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.packInputPower`
      );
      inputPower = (s == null ? void 0 : s.val) || 0;
    }
    statesToSet.set("packPower", outputPower - inputPower);
  }
  for (const [key, value] of statesToSet) {
    await ensureState(device, key, value);
    device.updateSolarFlowState(key, value);
  }
  for (const [key, value] of controlStatesToSet) {
    device.updateSolarFlowControlState(key, value);
  }
  for (const [key, value] of Object.entries(properties)) {
    if (handledMqttKeys.has(key)) continue;
    if (value == null || typeof value === "object") continue;
    const rawValue = value;
    await ensureState(device, key, rawValue);
    device.updateSolarFlowState(key, rawValue);
    if (device.adapter.log.level == "debug") {
      device.adapter.log.debug(
        `[onMessage] ${device.deviceKey}: ${key} = ${JSON.stringify(rawValue)} stored via fallback handler`
      );
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processDeviceProperties
});
//# sourceMappingURL=processDeviceProperties.js.map
