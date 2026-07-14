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
var allStates_exports = {};
__export(allStates_exports, {
  allStates: () => allStates
});
module.exports = __toCommonJS(allStates_exports);
const allStates = {
  // ===== From sharedStates =====
  lastUpdate: {
    title: "lastUpdate",
    nameDe: "Letztes Update",
    nameEn: "Last Update",
    type: "number",
    role: "value.time"
  },
  inputLimit: {
    title: "inputLimit",
    nameDe: "Limit der Eingangsleistung",
    nameEn: "limit of input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  gridInputPower: {
    title: "gridInputPower",
    nameDe: "Leistung vom Stromnetz",
    nameEn: "Grid Input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  buzzerSwitch: {
    title: "buzzerSwitch",
    nameDe: "Sounds am HUB aktivieren",
    nameEn: "Enable buzzer on HUB",
    type: "boolean",
    role: "value"
  },
  packState: {
    title: "packState",
    nameDe: "Systemstatus",
    nameEn: "Status of system",
    type: "string",
    role: "value"
  },
  electricLevel: {
    title: "electricLevel",
    nameDe: "SOC Gesamtsystem",
    nameEn: "SOC of the system",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  name: {
    title: "name",
    nameDe: "Name",
    nameEn: "Name",
    type: "string",
    role: "value"
  },
  snNumber: {
    title: "snNumber",
    nameDe: "Seriennummer",
    nameEn: "Serial ID",
    type: "string",
    role: "value"
  },
  productName: {
    title: "productName",
    nameDe: "Produkt Name",
    nameEn: "Product name",
    type: "string",
    role: "value"
  },
  registeredServer: {
    title: "registeredServer",
    nameDe: "Registrierter Server",
    nameEn: "Registered Server",
    type: "string",
    role: "value"
  },
  energyPower: {
    title: "energyPower",
    nameDe: "Leistung am Smartmeter",
    nameEn: "Smartmeter energy power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  packPower: {
    title: "packPower",
    nameDe: "Lade/Entladeleistung der Batterie",
    nameEn: "charge/discharge power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  outputPackPower: {
    title: "outputPackPower",
    nameDe: "Ladeleistung zur Batterie",
    nameEn: "charge power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  packInputPower: {
    title: "packInputPower",
    nameDe: "Entladeleistung aus Batterie",
    nameEn: "discharge power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  solarInputPower: {
    title: "solarInputPower",
    nameDe: "Leistung der Solarmodule",
    nameEn: "solar power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  pvPower1: {
    title: "pvPower1",
    nameDe: "Leistung PV 1",
    nameEn: "solar power channel 1",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  pvPower2: {
    title: "pvPower2",
    nameDe: "Leistung PV 2",
    nameEn: "solar power channel 2",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  pvPower3: {
    title: "pvPower3",
    nameDe: "Leistung PV 3",
    nameEn: "solar power channel 3",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  pvPower4: {
    title: "pvPower4",
    nameDe: "Leistung PV 4",
    nameEn: "solar power channel 4",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  remainInputTime: {
    title: "remainInputTime",
    nameDe: "Erwartete Ladedauer",
    nameEn: "remaining charge time",
    type: "number",
    role: "value.interval"
  },
  remainOutTime: {
    title: "remainOutTime",
    nameDe: "Erwartete Entladedauer",
    nameEn: "remaining discharge time",
    type: "number",
    role: "value.interval"
  },
  socSet: {
    title: "socSet",
    nameDe: "Max. SOC",
    nameEn: "max. SOC",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  minSoc: {
    title: "minSoc",
    nameDe: "Min. SOC",
    nameEn: "min. SOC",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  ip: {
    title: "ip",
    nameDe: "IP Adresse",
    nameEn: "IP Address",
    type: "string",
    role: "value"
  },
  wifiState: {
    title: "wifiState",
    nameDe: "WiFi Status",
    nameEn: "WiFi Status",
    type: "string",
    role: "value"
  },
  hubState: {
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
  packNum: {
    title: "packNum",
    nameDe: "Anzahl der angeschlossenen Batterien",
    nameEn: "Number of batteries",
    type: "number",
    role: "value"
  },
  autoModel: {
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
  heatState: {
    title: "heatState",
    nameDe: "W\xE4rmezustand",
    nameEn: "Heat state",
    type: "boolean",
    role: "value"
  },
  connectionMode: {
    title: "connectionMode",
    nameDe: "Verbindungs Modus",
    nameEn: "Connection mode",
    type: "string",
    role: "value"
  },
  // ===== Device-specific states =====
  inverseMaxPower: {
    title: "inverseMaxPower",
    nameDe: "Maximal akzeptabler Eingang des PV-Mikrowechselrichters",
    nameEn: "highest acceptable input power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  pass: {
    title: "pass",
    nameDe: "Bypass an/aus",
    nameEn: "Bypass on/off",
    type: "boolean",
    role: "value"
  },
  autoRecover: {
    title: "autoRecover",
    nameDe: "Am n\xE4chsten Tag Bypass auf Automatik",
    nameEn: "Automatic recovery of bypass",
    type: "boolean",
    role: "value"
  },
  passMode: {
    title: "passMode",
    nameDe: "Einstellung des Bypass Modus",
    nameEn: "Setting of bypass mode",
    type: "string",
    role: "value"
  },
  pvBrand: {
    title: "pvBrand",
    nameDe: "Wechselrichter Hersteller",
    nameEn: "brand of inverter",
    type: "string",
    role: "value"
  },
  outputHomePower: {
    title: "outputHomePower",
    nameDe: "Ausgangsleistung",
    nameEn: "output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  outputLimit: {
    title: "outputLimit",
    nameDe: "Limit der Ausgangsleistung",
    nameEn: "limit of output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  acMode: {
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
  connectedWithAce: {
    title: "connectedWithAce",
    nameDe: "Mit ACE (1500) verbunden",
    nameEn: "Connected with ACE (1500)",
    type: "boolean",
    role: "value"
  },
  smartMode: {
    title: "smartMode",
    nameDe: "Smart Mode",
    nameEn: "Smart Mode",
    type: "boolean",
    role: "value"
  },
  hyperTmp: {
    title: "hyperTmp",
    nameDe: "Temperatur",
    nameEn: "Temperature",
    type: "number",
    role: "value.temperature",
    unit: "\xB0C"
  },
  batteryElectric: {
    title: "batteryElectric",
    nameDe: "Batterie Leistung",
    nameEn: "Battery electric",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  acOutputPower: {
    title: "acOutputPower",
    nameDe: "Aktuelle AC Ausgangsleistung",
    nameEn: "Current AC output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  acSwitch: {
    title: "acSwitch",
    nameDe: "AC Schalter",
    nameEn: "AC switch",
    type: "boolean",
    role: "value"
  },
  dcSwitch: {
    title: "dcSwitch",
    nameDe: "DC Schalter",
    nameEn: "DC switch",
    type: "boolean",
    role: "value"
  },
  dcOutputPower: {
    title: "dcOutputPower",
    nameDe: "Aktuelle DC Ausgangsleistung",
    nameEn: "Current DC output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  socStatus: {
    title: "socStatus",
    nameDe: "SOC Status",
    nameEn: "SOC status",
    type: "number",
    role: "value",
    states: {
      0: "Normal mode",
      1: "Auto-calibration"
    }
  },
  power: {
    title: "power",
    nameDe: "Leistung",
    nameEn: "Power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  // Additional power states
  solarPower5: {
    title: "solarPower5",
    nameDe: "Leistung Solar 5",
    nameEn: "solar power channel 5",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  solarPower6: {
    title: "solarPower6",
    nameDe: "Leistung Solar 6",
    nameEn: "solar power channel 6",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  gridOffPower: {
    title: "gridOffPower",
    nameDe: "Leistung bei Netzausfall",
    nameEn: "Grid off power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  invOutputPower: {
    title: "invOutputPower",
    nameDe: "Wechselrichter Ausgangsleistung",
    nameEn: "inverter output power",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  // Voltage / Current
  VoltWakeup: {
    title: "VoltWakeup",
    nameDe: "Aufwachspannung",
    nameEn: "wakeup voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  totalVol: {
    title: "totalVol",
    nameDe: "Gesamtspannung",
    nameEn: "total voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  totalBatteryVolt: {
    title: "totalBatteryVolt",
    nameDe: "Gesamtbatteriespannung",
    nameEn: "total battery voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  maxVol: {
    title: "maxVol",
    nameDe: "Max. Zellspannung",
    nameEn: "max cell voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  minVol: {
    title: "minVol",
    nameDe: "Min. Zellspannung",
    nameEn: "min cell voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  batcur: {
    title: "batcur",
    nameDe: "Batteriestrom",
    nameEn: "battery current",
    type: "number",
    role: "value.current",
    unit: "A"
  },
  BatVolt: {
    title: "BatVolt",
    nameDe: "Batteriespannung",
    nameEn: "battery voltage",
    type: "number",
    role: "value.voltage",
    unit: "V"
  },
  // Temperature / Health
  maxTemp: {
    title: "maxTemp",
    nameDe: "Max. Temperatur",
    nameEn: "max temperature",
    type: "number",
    role: "value.temperature",
    unit: "\xB0C"
  },
  socLevel: {
    title: "socLevel",
    nameDe: "SOC",
    nameEn: "state of charge",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  soh: {
    title: "soh",
    nameDe: "Batterie Gesundheitszustand",
    nameEn: "state of health",
    type: "number",
    role: "value.battery",
    unit: "%"
  },
  rssi: {
    title: "rssi",
    nameDe: "WLAN Signalst\xE4rke",
    nameEn: "WLAN signal strength",
    type: "number",
    role: "value.signal",
    unit: "dBm"
  },
  // Firmware / Hardware versions
  softVersion: {
    title: "softVersion",
    nameDe: "Firmware Version",
    nameEn: "firmware version",
    type: "string",
    role: "value"
  },
  masterSoftVersion: {
    title: "masterSoftVersion",
    nameDe: "Master Firmware Version",
    nameEn: "master firmware version",
    type: "string",
    role: "value"
  },
  masterhaerVersion: {
    title: "masterhaerVersion",
    nameDe: "Master Hardware Version",
    nameEn: "master hardware version",
    type: "string",
    role: "value"
  },
  dspversion: {
    title: "dspversion",
    nameDe: "DSP Version",
    nameEn: "DSP version",
    type: "string",
    role: "value"
  },
  mpptFirmwareVersion: {
    title: "mpptFirmwareVersion",
    nameDe: "MPPT Firmware Version",
    nameEn: "MPPT firmware version",
    type: "string",
    role: "value"
  },
  dcFirmwareVersion: {
    title: "dcFirmwareVersion",
    nameDe: "DC Firmware Version",
    nameEn: "DC firmware version",
    type: "string",
    role: "value"
  },
  acFirmwareVersion: {
    title: "acFirmwareVersion",
    nameDe: "AC Firmware Version",
    nameEn: "AC firmware version",
    type: "string",
    role: "value"
  },
  bmsFirmwareVersion: {
    title: "bmsFirmwareVersion",
    nameDe: "BMS Firmware Version",
    nameEn: "BMS firmware version",
    type: "string",
    role: "value"
  },
  masterFirmwareVersion: {
    title: "masterFirmwareVersion",
    nameDe: "Master Firmware Version",
    nameEn: "master firmware version",
    type: "string",
    role: "value"
  },
  dcHardwareVersion: {
    title: "dcHardwareVersion",
    nameDe: "DC Hardware Version",
    nameEn: "DC hardware version",
    type: "string",
    role: "value"
  },
  acHardwareVersion: {
    title: "acHardwareVersion",
    nameDe: "AC Hardware Version",
    nameEn: "AC hardware version",
    type: "string",
    role: "value"
  },
  bmsHardwareVersion: {
    title: "bmsHardwareVersion",
    nameDe: "BMS Hardware Version",
    nameEn: "BMS hardware version",
    type: "string",
    role: "value"
  },
  masterHardwareVersion: {
    title: "masterHardwareVersion",
    nameDe: "Master Hardware Version",
    nameEn: "master hardware version",
    type: "string",
    role: "value"
  },
  // Binary / switch states
  masterSwitch: {
    title: "masterSwitch",
    nameDe: "Hauptschalter",
    nameEn: "master switch",
    type: "boolean",
    role: "value"
  },
  restState: {
    title: "restState",
    nameDe: "Ruhezustand",
    nameEn: "rest state",
    type: "boolean",
    role: "value"
  },
  reverseState: {
    title: "reverseState",
    nameDe: "Umkehrzustand",
    nameEn: "reverse state",
    type: "boolean",
    role: "value"
  },
  lowTemperature: {
    title: "lowTemperature",
    nameDe: "Niedrige Temperatur",
    nameEn: "low temperature",
    type: "boolean",
    role: "value"
  },
  localState: {
    title: "localState",
    nameDe: "Lokaler Zustand",
    nameEn: "local state",
    type: "boolean",
    role: "value"
  },
  ctOff: {
    title: "ctOff",
    nameDe: "CT aus",
    nameEn: "CT off",
    type: "boolean",
    role: "value"
  },
  lampSwitch: {
    title: "lampSwitch",
    nameDe: "Lampe",
    nameEn: "lamp switch",
    type: "boolean",
    role: "value"
  },
  fanSwitch: {
    title: "fanSwitch",
    nameDe: "L\xFCfter",
    nameEn: "fan switch",
    type: "boolean",
    role: "value"
  },
  Fanmode: {
    title: "Fanmode",
    nameDe: "L\xFCfter Modus",
    nameEn: "fan mode",
    type: "boolean",
    role: "value"
  },
  ambientSwitch: {
    title: "ambientSwitch",
    nameDe: "Umgebungslicht",
    nameEn: "ambient light switch",
    type: "boolean",
    role: "value"
  },
  // Select states (enum)
  autoHeat: {
    title: "autoHeat",
    nameDe: "Automatische Heizung",
    nameEn: "auto heat",
    type: "number",
    role: "value",
    states: {
      0: "off",
      1: "on"
    }
  },
  gridReverse: {
    title: "gridReverse",
    nameDe: "Netzeinspeisung",
    nameEn: "grid reverse",
    type: "number",
    role: "value",
    states: {
      0: "disabled",
      1: "allow",
      2: "forbidden"
    }
  },
  gridOffMode: {
    title: "gridOffMode",
    nameDe: "Netzausfall Modus",
    nameEn: "grid off mode",
    type: "number",
    role: "value",
    states: {
      0: "normal",
      1: "eco",
      2: "off"
    }
  },
  fanSpeed: {
    title: "fanSpeed",
    nameDe: "L\xFCftergeschwindigkeit",
    nameEn: "fan speed",
    type: "number",
    role: "value",
    states: {
      0: "auto",
      1: "normal",
      2: "fast"
    }
  },
  // Ambient light
  ambientLightNess: {
    title: "ambientLightNess",
    nameDe: "Umgebungslicht Helligkeit",
    nameEn: "ambient light brightness",
    type: "number",
    role: "value"
  },
  ambientLightColor: {
    title: "ambientLightColor",
    nameDe: "Umgebungslicht Farbe",
    nameEn: "ambient light color",
    type: "number",
    role: "value"
  },
  ambientLightMode: {
    title: "ambientLightMode",
    nameDe: "Umgebungslicht Modus",
    nameEn: "ambient light mode",
    type: "number",
    role: "value"
  },
  // Diagnostic / misc
  faultLevel: {
    title: "faultLevel",
    nameDe: "Fehlerstufe",
    nameEn: "fault level",
    type: "number",
    role: "value"
  },
  oldMode: {
    title: "oldMode",
    nameDe: "Alter Modus",
    nameEn: "old mode",
    type: "number",
    role: "value"
  },
  circuitCheckMode: {
    title: "circuitCheckMode",
    nameDe: "Schaltkreis Pr\xFCfmodus",
    nameEn: "circuit check mode",
    type: "number",
    role: "value"
  },
  PowerCycle: {
    title: "PowerCycle",
    nameDe: "Leistungszyklus",
    nameEn: "power cycle",
    type: "number",
    role: "value"
  },
  // Power cycle states
  acoutputPowerCycle: {
    title: "acoutputPowerCycle",
    nameDe: "AC Ausgangsleistung Zyklus",
    nameEn: "AC output power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  dcoutputPowerCycle: {
    title: "dcoutputPowerCycle",
    nameDe: "DC Ausgangsleistung Zyklus",
    nameEn: "DC output power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  gridInputPowerCycle: {
    title: "gridInputPowerCycle",
    nameDe: "Netzeingangsleistung Zyklus",
    nameEn: "grid input power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  packInputPowerCycle: {
    title: "packInputPowerCycle",
    nameDe: "Batterieeingangsleistung Zyklus",
    nameEn: "pack input power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  outputPackPowerCycle: {
    title: "outputPackPowerCycle",
    nameDe: "Batterieausgangsleistung Zyklus",
    nameEn: "output pack power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  outputHomePowerCycle: {
    title: "outputHomePowerCycle",
    nameDe: "Hausausgangsleistung Zyklus",
    nameEn: "output home power cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  solarPower1Cycle: {
    title: "solarPower1Cycle",
    nameDe: "Solar 1 Leistungszyklus",
    nameEn: "solar power 1 cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  solarPower2Cycle: {
    title: "solarPower2Cycle",
    nameDe: "Solar 2 Leistungszyklus",
    nameEn: "solar power 2 cycle",
    type: "number",
    role: "value.power",
    unit: "W"
  },
  // Timestamp
  ts: {
    title: "ts",
    nameDe: "Zeitstempel",
    nameEn: "timestamp",
    type: "number",
    role: "value.time"
  },
  tsZone: {
    title: "tsZone",
    nameDe: "Zeitzone",
    nameEn: "timezone",
    type: "string",
    role: "value"
  },
  model: {
    title: "model",
    nameDe: "Batterietyp",
    nameEn: "Battery type",
    type: "string",
    role: "value"
  },
  sn: {
    title: "sn",
    nameDe: "Seriennummer",
    nameEn: "Serial id",
    type: "string",
    role: "value"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  allStates
});
//# sourceMappingURL=allStates.js.map
