/* eslint-disable @typescript-eslint/indent */
import { ISolarflowState } from "../models/ISolarflowState";
import { sharedStates } from "./sharedStates";

export const hyperStates: ISolarflowState[] = sharedStates.concat([
  {
    title: "hyperTmp",
    nameDe: "Temperatur des Hyper 2000",
    nameEn: "Temperature of Hyper 2000",
    type: "number",
    role: "value.temperature",
    unit: "°C",
  },
  // TODO: Check if passmode is a state of Hyper
  {
    title: "passMode",
    nameDe: "Einstellung des Bypass Modus",
    nameEn: "Setting of bypass mode",
    type: "string",
    role: "value",
  },
  {
    title: "pvBrand",
    nameDe: "Wechselrichter Hersteller",
    nameEn: "brand of inverter",
    type: "string",
    role: "value",
  },
  {
    title: "outputHomePower",
    nameDe: "Ausgangsleistung",
    nameEn: "output power",
    type: "number",
    role: "value.power",
    unit: "W",
  },
  {
    title: "outputLimit",
    nameDe: "Limit der Ausgangsleistung",
    nameEn: "limit of output power",
    type: "number",
    role: "value.power",
    unit: "W",
  },
  {
    title: "acMode",
    nameDe: "AC Modus",
    nameEn: "AC mode",
    type: "number",
    role: "value",
  },
  {
    title: "batteryElectric",
    nameDe: "Batterie Leistung",
    nameEn: "Battery electric",
    type: "number",
    role: "value.power",
    unit: "W",
  },
  {
    title: "gridInputPower",
    nameDe: "Aktuelle AC Eingangsleistung",
    nameEn: "Current AC input power",
    type: "number",
    role: "value.power",
    unit: "W",
  },
  {
    title: "acOutputPower",
    nameDe: "Aktuelle AC Ausgangsleistung",
    nameEn: "Current AC output power",
    type: "number",
    role: "value.power",
    unit: "W",
  },
]);
