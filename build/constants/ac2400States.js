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
var ac2400States_exports = {};
__export(ac2400States_exports, {
  ac2400States: () => ac2400States
});
module.exports = __toCommonJS(ac2400States_exports);
var import_sharedStates = require("./sharedStates");
const ac2400States = import_sharedStates.sharedStates.concat([
  {
    title: "hyperTmp",
    nameDe: "Temperatur des AC 2400",
    nameEn: "Temperature of AC 2400",
    type: "number",
    role: "value.temperature",
    unit: "\xB0C"
  },
  {
    title: "passMode",
    nameDe: "Einstellung des Bypass Modus",
    nameEn: "Setting of bypass mode",
    type: "string",
    role: "value"
  },
  {
    title: "pvBrand",
    nameDe: "Wechselrichter Hersteller",
    nameEn: "brand of inverter",
    type: "string",
    role: "value"
  },
  {
    title: "outputHomePower",
    nameDe: "Ausgangsleistung",
    nameEn: "output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "outputLimit",
    nameDe: "Limit der Ausgangsleistung",
    nameEn: "limit of output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "acMode",
    nameDe: "AC Modus",
    nameEn: "AC mode",
    type: "number",
    role: "value",
    states: {
      0: "Nothing",
      1: "AC input mode",
      2: "AC output mode"
    }
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
    title: "inverseMaxPower",
    nameDe: "Maximal akzeptabler Eingang des PV-Mikrowechselrichters",
    nameEn: "highest acceptable input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "pass",
    nameDe: "Bypass an/aus",
    nameEn: "Bypass on/off",
    type: "boolean",
    role: "value"
  }
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ac2400States
});
//# sourceMappingURL=ac2400States.js.map
