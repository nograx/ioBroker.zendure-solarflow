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
var deviceStatus_exports = {};
__export(deviceStatus_exports, {
  DEVICE_STATUS_AUTOMATION_DISABLED: () => DEVICE_STATUS_AUTOMATION_DISABLED,
  DEVICE_STATUS_DEVICE_DISABLED: () => DEVICE_STATUS_DEVICE_DISABLED,
  DEVICE_STATUS_WAITING_FOR_TRIGGER: () => DEVICE_STATUS_WAITING_FOR_TRIGGER,
  getDeviceStatusStates: () => getDeviceStatusStates,
  getDeviceTaskCode: () => getDeviceTaskCode
});
module.exports = __toCommonJS(deviceStatus_exports);
const DEVICE_STATUS_AUTOMATION_DISABLED = 0;
const DEVICE_STATUS_DEVICE_DISABLED = 1;
const DEVICE_STATUS_WAITING_FOR_TRIGGER = 2;
const DEVICE_TASK_CODES = {
  feedIn: 10,
  standby: 20,
  surplusCharging: 30,
  chargeKeepAlive: 40,
  forceCharging: 50,
  chargeBlocked: 60,
  waitingForSurplus: 70,
  full: 80,
  idle: 90
};
const DEVICE_STATUS_TEXTS = {
  en: {
    tasks: {
      feedIn: "Feeding in",
      standby: "Standby",
      surplusCharging: "Charging from surplus",
      chargeKeepAlive: "Holding the charge keep-alive",
      forceCharging: "Force charging",
      chargeBlocked: "Waiting before charging may start",
      waitingForSurplus: "Waiting for surplus charging",
      full: "Fully charged, idle",
      idle: "Idle"
    },
    leadSuffix: " (lead device)",
    automationDisabled: "Automation disabled globally",
    deviceDisabled: "Automation disabled for this device",
    waitingForTrigger: "Waiting for a change of the automation trigger state"
  },
  de: {
    tasks: {
      feedIn: "Speist ein",
      standby: "Standby",
      surplusCharging: "L\xE4dt aus \xDCberschuss",
      chargeKeepAlive: "H\xE4lt den Lade-Keep-Alive",
      forceCharging: "L\xE4dt erzwungen",
      chargeBlocked: "Wartet, bevor das Laden beginnen darf",
      waitingForSurplus: "Wartet auf \xDCberschussladung",
      full: "Voll geladen, inaktiv",
      idle: "Inaktiv"
    },
    leadSuffix: " (f\xFChrendes Ger\xE4t)",
    automationDisabled: "Automatisierung global deaktiviert",
    deviceDisabled: "Automatisierung f\xFCr dieses Ger\xE4t deaktiviert",
    waitingForTrigger: "Wartet auf eine \xC4nderung des Ausl\xF6ser-Datenpunkts"
  }
};
let statusLanguage;
const getStatusLanguage = async (adapter) => {
  var _a;
  if (!statusLanguage) {
    const systemConfig = await adapter.getForeignObjectAsync("system.config");
    statusLanguage = ((_a = systemConfig == null ? void 0 : systemConfig.common) == null ? void 0 : _a.language) === "de" ? "de" : "en";
  }
  return statusLanguage;
};
const getDeviceTaskCode = (task, isLead) => DEVICE_TASK_CODES[task] + (isLead ? 1 : 0);
const getDeviceStatusStates = async (adapter) => {
  const texts = DEVICE_STATUS_TEXTS[await getStatusLanguage(adapter)];
  const states = {
    [DEVICE_STATUS_AUTOMATION_DISABLED]: texts.automationDisabled,
    [DEVICE_STATUS_DEVICE_DISABLED]: texts.deviceDisabled,
    [DEVICE_STATUS_WAITING_FOR_TRIGGER]: texts.waitingForTrigger
  };
  Object.keys(DEVICE_TASK_CODES).forEach((task) => {
    states[getDeviceTaskCode(task, false)] = texts.tasks[task];
    states[getDeviceTaskCode(task, true)] = `${texts.tasks[task]}${texts.leadSuffix}`;
  });
  return states;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEVICE_STATUS_AUTOMATION_DISABLED,
  DEVICE_STATUS_DEVICE_DISABLED,
  DEVICE_STATUS_WAITING_FOR_TRIGGER,
  getDeviceStatusStates,
  getDeviceTaskCode
});
//# sourceMappingURL=deviceStatus.js.map
