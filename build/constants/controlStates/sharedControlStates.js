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
var sharedControlStates_exports = {};
__export(sharedControlStates_exports, {
  sharedControlStates: () => sharedControlStates
});
module.exports = __toCommonJS(sharedControlStates_exports);
const sharedControlStates = [
  {
    nameDe: "Energieplan-Einstellung",
    nameEn: "Energyplan",
    type: "number",
    def: 0,
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
    def: 0,
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
    def: 0,
    title: "dischargeLimit",
    role: "value.battery",
    read: true,
    write: true,
    min: 0,
    max: 50,
    unit: "%"
  },
  {
    nameDe: "Verhalten wenn minimale reservierte Ladung erreicht",
    nameEn: "Behavior when minimum reserved charge is reached",
    type: "number",
    def: 0,
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
    nameDe: "Niedrige Batteriespannung erkannt",
    nameEn: "Low Voltage on battery detected",
    type: "boolean",
    def: false,
    title: "lowVoltageBlock",
    role: "indicator.lowbat",
    read: true,
    write: false
  },
  {
    nameDe: "Auf 100% laden, Akku muss kalibriert werden!",
    nameEn: "Charge to 100%, battery needs to be calibrated",
    type: "boolean",
    def: false,
    title: "fullChargeNeeded",
    role: "indicator.lowbat",
    read: true,
    write: false
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sharedControlStates
});
//# sourceMappingURL=sharedControlStates.js.map
