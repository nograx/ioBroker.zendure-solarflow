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
var hyperControlStates_exports = {};
__export(hyperControlStates_exports, {
  hyperControlStates: () => hyperControlStates
});
module.exports = __toCommonJS(hyperControlStates_exports);
const hyperControlStates = [
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
    max: 1200,
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
    max: 1200,
    step: 1,
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
    nameDe: "Ger\xE4te Automation Limit (negativ = Laden, positiv = Einspeisen)",
    nameEn: "Device Automation Limit (negative = charging, positive = feed in)",
    type: "number",
    def: 0,
    title: "setDeviceAutomationInOutLimit",
    role: "value.power",
    read: true,
    write: true,
    min: -1200,
    max: 1200,
    unit: "W"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hyperControlStates
});
//# sourceMappingURL=hyperControlStates.js.map
