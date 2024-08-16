/* eslint-disable @typescript-eslint/indent */

import { ISolarflowState } from "../models/ISolarflowState";

export const smartPlugStates: ISolarflowState[] = [
  {
    title: "lastUpdate",
    nameDe: "Letztes Update",
    nameEn: "Last Update",
    type: "number",
    role: "value.time",
  },
  {
    title: "power",
    nameDe: "Leistung",
    nameEn: "Power",
    type: "number",
    role: "value.power",
    unit: "W",
  },
  {
    title: "snNumber",
    nameDe: "Seriennnummer",
    nameEn: "Serial ID",
    type: "string",
    role: "value",
  },
  {
    title: "productName",
    nameDe: "Produkt Name",
    nameEn: "Product name",
    type: "string",
    role: "value",
  },
  {
    title: "registeredServer",
    nameDe: "Registrierter Server",
    nameEn: "Registered Server",
    type: "string",
    role: "value",
  },
  {
    title: "wifiState",
    nameDe: "WiFi Status",
    nameEn: "WiFi Status",
    type: "string",
    role: "value",
  },
];
