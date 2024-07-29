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
var createSolarFlowStates_exports = {};
__export(createSolarFlowStates_exports, {
  createSolarFlowStates: () => createSolarFlowStates
});
module.exports = __toCommonJS(createSolarFlowStates_exports);
var import_adapterService = require("../services/adapterService");
var import_createCalculationStates = require("./createCalculationStates");
var import_createControlStates = require("./createControlStates");
const createSolarFlowStates = async (adapter, device, type) => {
  const productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  const deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  adapter.log.debug(
    `[createSolarFlowStates] Creating or updating SolarFlow states for productKey ${productKey} and deviceKey ${deviceKey}.`
  );
  let solarflowWithAce = false;
  if (device.packList && device.packList.length > 0) {
    if (device.packList.some((x) => x.productName.toLowerCase() == "ace 1500")) {
      solarflowWithAce = true;
    }
  }
  await (adapter == null ? void 0 : adapter.extendObject(productKey, {
    type: "device",
    common: {
      name: { de: "Produkt " + productKey, en: "Product " + productKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.calculations`, {
    type: "channel",
    common: {
      name: {
        de: "Berechnungen f\xFCr Ger\xE4t " + deviceKey,
        en: "Calculations for Device " + deviceKey
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.packData`, {
    type: "channel",
    common: {
      name: {
        de: "Batterie Packs",
        en: "Battery packs"
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.lastUpdate`, {
    type: "state",
    common: {
      name: { de: "Letztes Update", en: "Last Update" },
      type: "number",
      desc: "lastUpdate",
      role: "value.time",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.buzzerSwitch`, {
    type: "state",
    common: {
      name: {
        de: "Sounds am HUB aktivieren",
        en: "Enable buzzer on HUB"
      },
      type: "boolean",
      desc: "buzzerSwitch",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.packState`, {
    type: "state",
    common: {
      name: { de: "Systemstatus", en: "Status of system" },
      type: "string",
      desc: "packState",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.electricLevel`, {
    type: "state",
    common: {
      name: { de: "SOC Gesamtsystem", en: "SOC of the system" },
      type: "number",
      desc: "electricLevel",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  }));
  if (device.electricity) {
    await (0, import_adapterService.updateSolarFlowState)(
      adapter,
      device.productKey,
      device.deviceKey,
      "electricLevel",
      device.electricity
    );
  }
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.name`, {
    type: "state",
    common: {
      name: { de: "Name", en: "Name" },
      type: "string",
      desc: "name",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.snNumber`, {
    type: "state",
    common: {
      name: { de: "Seriennnummer", en: "Serial ID" },
      type: "string",
      desc: "snNumber",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  if (device.snNumber) {
    await (0, import_adapterService.updateSolarFlowState)(
      adapter,
      device.productKey,
      device.deviceKey,
      "snNumber",
      device.snNumber.toString()
    );
  }
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.productName`, {
    type: "state",
    common: {
      name: { de: "Produkt Name", en: "Product name" },
      type: "string",
      desc: "productName",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (0, import_adapterService.updateSolarFlowState)(
    adapter,
    device.productKey,
    device.deviceKey,
    "productName",
    device.productName
  );
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.registeredServer`, {
    type: "state",
    common: {
      name: { de: "Registrierter Server", en: "Registered server" },
      type: "string",
      desc: "registeredServer",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.outputPackPower`, {
    type: "state",
    common: {
      name: { de: "Ladeleistung zur Batterie", en: "charge power" },
      type: "number",
      desc: "outputPackPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.packInputPower`, {
    type: "state",
    common: {
      name: { de: "Entladeleistung aus Batterie", en: "discharge power" },
      type: "number",
      desc: "packInputPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.solarInputPower`, {
    type: "state",
    common: {
      name: { de: "Leistung der Solarmodule", en: "solar power" },
      type: "number",
      desc: "solarInputPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.pvPower1`, {
    type: "state",
    common: {
      name: { de: "Leistung PV 1", en: "solar power channel 1" },
      type: "number",
      desc: "pvPower1",
      role: "value.power",
      read: true,
      write: false,
      unit: "W"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.pvPower2`, {
    type: "state",
    common: {
      name: { de: "Leistung PV 2", en: "solar power channel 2" },
      type: "number",
      desc: "pvPower2",
      role: "value.power",
      read: true,
      write: false,
      unit: "W"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.remainInputTime`, {
    type: "state",
    common: {
      name: { de: "Erwartete Ladedauer", en: "remaining charge time" },
      type: "number",
      desc: "remainInputTime",
      role: "value.interval",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.remainOutTime`, {
    type: "state",
    common: {
      name: {
        de: "Erwartete Entladedauer (Minuten)",
        en: "remaining discharge time (minutes)"
      },
      type: "number",
      desc: "remainOutTime",
      role: "value.interval",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.socSet`, {
    type: "state",
    common: {
      name: { de: "Max. SOC", en: "max. SOC" },
      type: "number",
      desc: "socSet",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.minSoc`, {
    type: "state",
    common: {
      name: { de: "Min. SOC", en: "min. SOC" },
      type: "number",
      desc: "minSoc",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.inverseMaxPower`, {
    type: "state",
    common: {
      name: {
        de: "Maximal akzeptabler Eingang des PV-Mikrowechselrichters",
        en: "highest acceptable input power"
      },
      type: "number",
      desc: "inverseMaxPower",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.wifiState`, {
    type: "state",
    common: {
      name: {
        de: "WiFi Status",
        en: "WiFi Status"
      },
      type: "string",
      desc: "wifiState",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (0, import_adapterService.updateSolarFlowState)(
    adapter,
    device.productKey,
    device.deviceKey,
    "wifiStatus",
    device.wifiStatus ? "Connected" : "Disconnected"
  );
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.hubState`, {
    type: "state",
    common: {
      name: {
        de: "Verhalten wenn minimale reservierte Ladung erreicht",
        en: "Behavior when minimum reserved charge is reached"
      },
      type: "string",
      desc: "hubState",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.packNum`, {
    type: "state",
    common: {
      name: {
        de: "Anzahl der angeschlossenen Batterien",
        en: "Number of batteries"
      },
      type: "number",
      desc: "packNum",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.solarflowWithAce`, {
    type: "state",
    common: {
      name: {
        de: "ACE 1500 erkannt",
        en: "ACE 1500 detected"
      },
      type: "boolean",
      desc: "solarflowWithAce",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }));
  await (0, import_adapterService.updateSolarFlowState)(
    adapter,
    device.productKey,
    device.deviceKey,
    "solarflowWithAce",
    solarflowWithAce
  );
  if (type == "ace" || solarflowWithAce) {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.dcOutputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle DC Ausgangsleistung",
          en: "Current DC output power"
        },
        type: "number",
        desc: "dcOutputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.dcSwitch`, {
      type: "state",
      common: {
        name: {
          de: "DC Schalter",
          en: "DC switch"
        },
        type: "boolean",
        desc: "dcSwitch",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
  }
  if (type == "solarflow") {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.pass`, {
      type: "state",
      common: {
        name: { de: "Bypass an/aus", en: "Bypass on/off" },
        type: "boolean",
        desc: "pass",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.autoRecover`, {
      type: "state",
      common: {
        name: {
          de: "Am n\xE4chsten Tag Bypass auf Automatik",
          en: "Automatic recovery of bypass"
        },
        type: "boolean",
        desc: "autoRecover",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
  }
  if (type == "solarflow" || type == "hyper") {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.passMode`, {
      type: "state",
      common: {
        name: {
          de: "Einstellung des Bypass Modus",
          en: "Setting of bypass mode"
        },
        type: "string",
        desc: "passMode",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.pvBrand`, {
      type: "state",
      common: {
        name: { de: "Wechselrichter Hersteller", en: "brand of inverter" },
        type: "string",
        desc: "pvBrand",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.outputHomePower`, {
      type: "state",
      common: {
        name: { de: "Ausgangsleistung", en: "output power" },
        type: "number",
        desc: "outputHomePower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.outputLimit`, {
      type: "state",
      common: {
        name: { de: "Limit der Ausgangsleistung", en: "limit of output power" },
        type: "number",
        desc: "outputLimit",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
  }
  if (type == "ace" || type == "hyper" || solarflowWithAce) {
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.gridPower`, {
      type: "state",
      common: {
        name: { de: "Leistung vom Stromnetz", en: "Grid power" },
        type: "number",
        desc: "gridPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.inputLimit`, {
      type: "state",
      common: {
        name: { de: "Limit der Eingangsleistung", en: "limit of input power" },
        type: "number",
        desc: "inputLimit",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.gridInputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle AC Eingangsleistung",
          en: "current ac input power"
        },
        type: "number",
        desc: "gridInputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.acOutputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle AC Ausgangsleistung",
          en: "Current AC output power"
        },
        type: "number",
        desc: "acOutputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }));
    await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.acSwitch`, {
      type: "state",
      common: {
        name: {
          de: "AC Schalter",
          en: "AC switch"
        },
        type: "boolean",
        desc: "acSwitch",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    }));
  }
  if (!adapter.config.useFallbackService) {
    await (0, import_createControlStates.createControlStates)(adapter, productKey, deviceKey, type);
  }
  if (adapter.config.useCalculation && (type == "solarflow" || type == "hyper")) {
    await (0, import_createCalculationStates.createCalculationStates)(adapter, productKey, deviceKey);
  } else {
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowStates
});
//# sourceMappingURL=createSolarFlowStates.js.map
