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
var aceStates_exports = {};
__export(aceStates_exports, {
  aceStates: () => aceStates
});
module.exports = __toCommonJS(aceStates_exports);
var import_sharedStates = require("./sharedStates");
const aceStates = import_sharedStates.sharedStates.concat([
  {
    title: "dcOutputPower",
    nameDe: "Aktuelle DC Ausgangsleistung",
    nameEn: "Current DC output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "dcSwitch",
    nameDe: "DC Schalter",
    nameEn: "DC switch",
    type: "boolean",
    role: "value"
  },
  {
    title: "acMode",
    nameDe: "AC Modus",
    nameEn: "AC mode",
    type: "number",
    role: "value"
  },
  {
    title: "batteryElectric",
    nameDe: "Batterie Leistung",
    nameEn: "Battery electric",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "gridInputPower",
    nameDe: "Aktuelle AC Eingangsleistung",
    nameEn: "Current AC input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "acOutputPower",
    nameDe: "Aktuelle AC Ausgangsleistung",
    nameEn: "Current AC output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "acSwitch",
    nameDe: "AC Schalter",
    nameEn: "AC switch",
    type: "boolean",
    role: "value"
  }
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  aceStates
});
//# sourceMappingURL=aceStates.js.map
