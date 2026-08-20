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
var hubControlStates_exports = {};
__export(hubControlStates_exports, {
  hubControlStates: () => hubControlStates
});
module.exports = __toCommonJS(hubControlStates_exports);
const hubControlStates = [
  {
    nameDe: "Sounds am HUB aktivieren",
    nameEn: "Enable buzzer on HUB",
    type: "boolean",
    def: false,
    title: "buzzerSwitch",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "Einzustellende Ausgangsleistung",
    nameEn: "Control of the output limit",
    type: "number",
    def: 0,
    title: "setOutputLimit",
    role: "value.power",
    read: true,
    write: true,
    min: 0,
    unit: "W"
  },
  {
    nameDe: "Einstellung des Bypass Modus",
    nameEn: "Setting of bypass mode",
    type: "number",
    def: 0,
    title: "passMode",
    role: "switch",
    read: true,
    write: true,
    states: {
      0: "Automatic",
      1: "Always off",
      2: "Always on"
    }
  },
  {
    nameDe: "Am n\xE4chsten Tag Bypass auf Automatik",
    nameEn: "Automatic recovery of bypass",
    type: "boolean",
    def: false,
    title: "autoRecover",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "Maximal akzeptabler Eingang des PV-Mikrowechselrichters",
    nameEn: "highest acceptable input power",
    type: "number",
    def: 0,
    title: "inverseMaxPower",
    role: "value.power",
    read: true,
    write: true,
    min: 0,
    unit: "W"
  },
  {
    nameDe: "Einzustellende Eingangsleistung",
    nameEn: "Control of the input limit",
    type: "number",
    def: 0,
    title: "setInputLimit",
    role: "value.power",
    read: true,
    write: true,
    min: 0,
    max: 900,
    // Hyper, AC2400, Solarflow800 = MEHR, sonst 900
    step: 100,
    // Hyper, AC2400, Solarflow800 = 1, sonst 100
    unit: "W"
  },
  {
    nameDe: "AC Schalter",
    nameEn: "AC switch",
    type: "boolean",
    def: false,
    title: "acSwitch",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "AC Modus",
    nameEn: "AC mode",
    type: "number",
    def: 0,
    title: "acMode",
    role: "switch",
    min: 0,
    max: 2,
    step: 1,
    read: true,
    write: true,
    states: {
      0: "Nothing",
      1: "AC input mode",
      2: "AC output mode"
    }
  },
  {
    nameDe: "Smart Mode",
    nameEn: "Smart Mode",
    type: "boolean",
    def: false,
    title: "smartMode",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "Ger\xE4te Automation Limit (negativ = Laden, positiv = Einspeisen)",
    nameEn: "Device Automation Limit (negative = charging, positive = feed in)",
    type: "number",
    def: 0,
    title: "setDeviceAutomationInOutLimit",
    role: "value.power",
    read: true,
    write: true,
    min: 0,
    unit: "W"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hubControlStates
});
//# sourceMappingURL=hubControlStates.js.map
