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
var aioControlStates_exports = {};
__export(aioControlStates_exports, {
  aioControlStates: () => aioControlStates
});
module.exports = __toCommonJS(aioControlStates_exports);
const aioControlStates = [
  {
    nameDe: "Energieplan-Einstellung",
    nameEn: "Energyplan",
    type: "number",
    title: "autoModel",
    role: "value",
    read: true,
    write: true,
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
    nameDe: "Setzen des Lade-Limits",
    nameEn: "Control of the charge limit",
    title: "chargeLimit",
    type: "number",
    role: "value.battery",
    read: true,
    write: true,
    min: 40,
    max: 100,
    unit: "%"
  },
  {
    nameDe: "Setzen des Entlade-Limits",
    nameEn: "Control of the discharge limit",
    type: "number",
    title: "dischargeLimit",
    role: "value.battery",
    read: true,
    write: true,
    min: 0,
    max: 50,
    unit: "%"
  },
  {
    nameDe: "Sounds am HUB aktivieren",
    nameEn: "Enable buzzer on HUB",
    type: "boolean",
    title: "buzzerSwitch",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "Einzustellende Ausgangsleistung",
    nameEn: "Control of the output limit",
    type: "number",
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
    title: "autoRecover",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "Verhalten wenn minimale reservierte Ladung erreicht",
    nameEn: "Behavior when minimum reserved charge is reached",
    type: "number",
    title: "hubState",
    role: "value",
    read: true,
    write: true,
    min: 0,
    max: 1,
    states: {
      0: "Stop output and standby",
      1: "Stop output and shut down"
    }
  },
  {
    nameDe: "AC Schalter",
    nameEn: "AC switch",
    type: "boolean",
    title: "acSwitch",
    role: "switch",
    read: true,
    write: true
  },
  {
    nameDe: "AC Modus",
    nameEn: "AC mode",
    type: "number",
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
    nameDe: "Niedrige Batteriespannung erkannt",
    nameEn: "Low Voltage on battery detected",
    type: "boolean",
    title: "lowVoltageBlock",
    role: "indicator.lowbat",
    read: true,
    write: false
  },
  {
    nameDe: "Auf 100% laden, Akku muss kalibriert werden!",
    nameEn: "Charge to 100%, battery needs to be calibrated",
    type: "boolean",
    title: "fullChargeNeeded",
    role: "indicator.lowbat",
    read: true,
    write: false
  },
  {
    nameDe: "Ger\xE4te Automation Limit (negativ = Laden, positiv = Einspeisen)",
    nameEn: "Device Automation Limit (negative = charging, positive = feed in)",
    type: "number",
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
  aioControlStates
});
//# sourceMappingURL=aioControlStates.js.map
