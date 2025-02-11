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
var sharedStates_exports = {};
__export(sharedStates_exports, {
  sharedStates: () => sharedStates
});
module.exports = __toCommonJS(sharedStates_exports);
const sharedStates = [
  {
    title: "lastUpdate",
    nameDe: "Letztes Update",
    nameEn: "Last Update",
    type: "number",
    role: "value.time"
  },
  {
    title: "inputLimit",
    nameDe: "Limit der Eingangsleistung",
    nameEn: "limit of input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "gridInputPower",
    nameDe: "Leistung vom Stromnetz",
    nameEn: "Grid Input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "buzzerSwitch",
    nameDe: "Sounds am HUB aktivieren",
    nameEn: "Enable buzzer on HUB",
    type: "boolean",
    role: "value"
  },
  {
    title: "packState",
    nameDe: "Systemstatus",
    nameEn: "Status of system",
    type: "string",
    role: "value"
  },
  {
    title: "electricLevel",
    nameDe: "SOC Gesamtsystem",
    nameEn: "SOC of the system",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  {
    title: "name",
    nameDe: "Name",
    nameEn: "Name",
    type: "string",
    role: "value"
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
    title: "energyPower",
    nameDe: "Leistung am Smartmeter",
    nameEn: "Smartmeter energy power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "outputPackPower",
    nameDe: "Ladeleistung zur Batterie",
    nameEn: "charge power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "packInputPower",
    nameDe: "Entladeleistung aus Batterie",
    nameEn: "discharge power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "solarInputPower",
    nameDe: "Leistung der Solarmodule",
    nameEn: "solar power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "pvPower1",
    nameDe: "Leistung PV 1",
    nameEn: "solar power channel 1",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "pvPower2",
    nameDe: "Leistung PV 2",
    nameEn: "solar power channel 2",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  {
    title: "remainInputTime",
    nameDe: "Erwartete Ladedauer",
    nameEn: "remaining charge time",
    type: "number",
    role: "value.interval"
  },
  {
    title: "remainOutTime",
    nameDe: "Erwartete Entladedauer",
    nameEn: "remaining discharge time",
    type: "number",
    role: "value.interval"
  },
  {
    title: "socSet",
    nameDe: "Max. SOC",
    nameEn: "max. SOC",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  {
    title: "minSoc",
    nameDe: "Min. SOC",
    nameEn: "min. SOC",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  {
    title: "wifiState",
    nameDe: "WiFi Status",
    nameEn: "WiFi Status",
    type: "string",
    role: "value"
  },
  {
    title: "hubState",
    nameDe: "Verhalten wenn minimale reservierte Ladung erreicht",
    nameEn: "Behavior when minimum reserved charge is reached",
    type: "number",
    role: "value",
    states: {
      0: "Stop output and standby",
      1: "Stop output and shut down"
    }
  },
  {
    title: "packNum",
    nameDe: "Anzahl der angeschlossenen Batterien",
    nameEn: "Number of batteries",
    type: "number",
    role: "value"
  },
  {
    title: "autoModel",
    nameDe: "Energieplan-Einstellungen",
    nameEn: "Energyplan settings",
    type: "number",
    role: "value",
    states: {
      0: "Nothing",
      6: "Battery priority mode",
      7: "Appointment mode",
      8: "Smart Matching Mode",
      9: "Smart CT Mode",
      10: "Electricity Price"
    }
  },
  {
    title: "heatState",
    nameDe: "W\xE4rmezustand",
    nameEn: "Heat state",
    type: "boolean",
    role: "value"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sharedStates
});
//# sourceMappingURL=sharedStates.js.map
