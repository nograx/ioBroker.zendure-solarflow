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
var smartPlugStates_exports = {};
__export(smartPlugStates_exports, {
  smartPlugStates: () => smartPlugStates
});
module.exports = __toCommonJS(smartPlugStates_exports);
const smartPlugStates = [
  {
    title: "lastUpdate",
    nameDe: "Letztes Update",
    nameEn: "Last Update",
    type: "number",
    role: "value.time"
  },
  {
    title: "power",
    nameDe: "Leistung",
    nameEn: "Power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "snNumber",
    nameDe: "Seriennnummer",
    nameEn: "Serial ID",
    type: "string",
    role: "value"
  },
  {
    title: "productName",
    nameDe: "Produkt Name",
    nameEn: "Product name",
    type: "string",
    role: "value"
  },
  {
    title: "registeredServer",
    nameDe: "Registrierter Server",
    nameEn: "Registered Server",
    type: "string",
    role: "value"
  },
  {
    title: "wifiState",
    nameDe: "WiFi Status",
    nameEn: "WiFi Status",
    type: "string",
    role: "value"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  smartPlugStates
});
//# sourceMappingURL=smartPlugStates.js.map
