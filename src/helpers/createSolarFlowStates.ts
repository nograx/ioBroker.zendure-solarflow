/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { updateSolarFlowState } from "../services/adapterService";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  device: ISolarFlowDeviceDetails,
  type: string
): Promise<void> => {
  const productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  const deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  adapter.log.debug(
    `[createSolarFlowStates] Creating or updating SolarFlow states for productKey ${productKey} and deviceKey ${deviceKey}.`
  );

  // Create device (e.g. the product type -> SolarFlow)
  await adapter?.extendObject(productKey, {
    type: "device",
    common: {
      name: { de: "Produkt " + productKey, en: "Product " + productKey },
    },
    native: {},
  });

  // Create channel (e.g. the device specific key)
  await adapter?.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey },
    },
    native: {},
  });

  // Create calculations folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.calculations`, {
    type: "channel",
    common: {
      name: {
        de: "Berechnungen für Gerät " + deviceKey,
        en: "Calculations for Device " + deviceKey,
      },
    },
    native: {},
  });

  // Create pack data folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.packData`, {
    type: "channel",
    common: {
      name: {
        de: "Batterie Packs",
        en: "Battery packs",
      },
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.lastUpdate`, {
    type: "state",
    common: {
      name: { de: "Letztes Update", en: "Last Update" },
      type: "number",
      desc: "lastUpdate",
      role: "value.time",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.buzzerSwitch`, {
    type: "state",
    common: {
      name: {
        de: "Sounds am HUB aktivieren",
        en: "Enable buzzer on HUB",
      },
      type: "boolean",
      desc: "buzzerSwitch",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.packState`, {
    type: "state",
    common: {
      name: { de: "Systemstatus", en: "Status of system" },
      type: "string",
      desc: "packState",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.electricLevel`, {
    type: "state",
    common: {
      name: { de: "SOC Gesamtsystem", en: "SOC of the system" },
      type: "number",
      desc: "electricLevel",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%",
    },
    native: {},
  });

  // Set sn number from device
  if (device.electricity) {
    await updateSolarFlowState(
      adapter,
      device.productKey,
      device.deviceKey,
      "electricLevel",
      device.electricity
    );
  }

  await adapter?.extendObject(`${productKey}.${deviceKey}.name`, {
    type: "state",
    common: {
      name: { de: "Name", en: "Name" },
      type: "string",
      desc: "name",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.snNumber`, {
    type: "state",
    common: {
      name: { de: "Seriennnummer", en: "Serial ID" },
      type: "string",
      desc: "snNumber",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  // Set sn number from device
  if (device.snNumber) {
    await updateSolarFlowState(
      adapter,
      device.productKey,
      device.deviceKey,
      "snNumber",
      device.snNumber.toString()
    );
  }

  await adapter?.extendObject(`${productKey}.${deviceKey}.productName`, {
    type: "state",
    common: {
      name: { de: "Produkt Name", en: "Product name" },
      type: "string",
      desc: "productName",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  // Set product name from device
  await updateSolarFlowState(
    adapter,
    device.productKey,
    device.deviceKey,
    "productName",
    device.productName
  );

  await adapter?.extendObject(`${productKey}.${deviceKey}.registeredServer`, {
    type: "state",
    common: {
      name: { de: "Registrierter Server", en: "Registered server" },
      type: "string",
      desc: "registeredServer",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.energyPower`, {
    type: "state",
    common: {
      name: { de: "Leistung am Smartmeter", en: "Smartmeter energy power" },
      type: "number",
      desc: "energyPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.outputPackPower`, {
    type: "state",
    common: {
      name: { de: "Ladeleistung zur Batterie", en: "charge power" },
      type: "number",
      desc: "outputPackPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.packInputPower`, {
    type: "state",
    common: {
      name: { de: "Entladeleistung aus Batterie", en: "discharge power" },
      type: "number",
      desc: "packInputPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.solarInputPower`, {
    type: "state",
    common: {
      name: { de: "Leistung der Solarmodule", en: "solar power" },
      type: "number",
      desc: "solarInputPower",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.pvPower1`, {
    type: "state",
    common: {
      name: { de: "Leistung PV 1", en: "solar power channel 1" },
      type: "number",
      desc: "pvPower1",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.pvPower2`, {
    type: "state",
    common: {
      name: { de: "Leistung PV 2", en: "solar power channel 2" },
      type: "number",
      desc: "pvPower2",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.remainInputTime`, {
    type: "state",
    common: {
      name: { de: "Erwartete Ladedauer", en: "remaining charge time" },
      type: "number",
      desc: "remainInputTime",
      role: "value.interval",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.remainOutTime`, {
    type: "state",
    common: {
      name: {
        de: "Erwartete Entladedauer (Minuten)",
        en: "remaining discharge time (minutes)",
      },
      type: "number",
      desc: "remainOutTime",
      role: "value.interval",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.socSet`, {
    type: "state",
    common: {
      name: { de: "Max. SOC", en: "max. SOC" },
      type: "number",
      desc: "socSet",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.minSoc`, {
    type: "state",
    common: {
      name: { de: "Min. SOC", en: "min. SOC" },
      type: "number",
      desc: "minSoc",
      role: "value.battery",
      read: true,
      write: false,
      unit: "%",
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.inverseMaxPower`, {
    type: "state",
    common: {
      name: {
        de: "Maximal akzeptabler Eingang des PV-Mikrowechselrichters",
        en: "highest acceptable input power",
      },
      type: "number",
      desc: "inverseMaxPower",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.wifiState`, {
    type: "state",
    common: {
      name: {
        de: "WiFi Status",
        en: "WiFi Status",
      },
      type: "string",
      desc: "wifiState",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  // Set wifi state from device
  await updateSolarFlowState(
    adapter,
    device.productKey,
    device.deviceKey,
    "wifiState",
    device.wifiStatus ? "Connected" : "Disconnected"
  );

  await adapter?.extendObject(`${productKey}.${deviceKey}.hubState`, {
    type: "state",
    common: {
      name: {
        de: "Verhalten wenn minimale reservierte Ladung erreicht",
        en: "Behavior when minimum reserved charge is reached",
      },
      type: "string",
      desc: "hubState",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  await adapter?.extendObject(`${productKey}.${deviceKey}.packNum`, {
    type: "state",
    common: {
      name: {
        de: "Anzahl der angeschlossenen Batterien",
        en: "Number of batteries",
      },
      type: "number",
      desc: "packNum",
      role: "value",
      read: true,
      write: false,
    },
    native: {},
  });

  /* ACE only States */

  if (type == "ace") {
    await adapter?.extendObject(`${productKey}.${deviceKey}.dcOutputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle DC Ausgangsleistung",
          en: "Current DC output power",
        },
        type: "number",
        desc: "dcOutputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.dcSwitch`, {
      type: "state",
      common: {
        name: {
          de: "DC Schalter",
          en: "DC switch",
        },
        type: "boolean",
        desc: "dcSwitch",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });
  }

  await adapter?.extendObject(`${productKey}.${deviceKey}.inputLimit`, {
    type: "state",
    common: {
      name: { de: "Limit der Eingangsleistung", en: "limit of input power" },
      type: "number",
      desc: "inputLimit",
      role: "value.power",
      read: true,
      write: false,
      unit: "W",
    },
    native: {},
  });

  /* Solarflow only States */

  if (type == "solarflow") {
    await adapter?.extendObject(`${productKey}.${deviceKey}.pass`, {
      type: "state",
      common: {
        name: { de: "Bypass an/aus", en: "Bypass on/off" },
        type: "boolean",
        desc: "pass",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.autoRecover`, {
      type: "state",
      common: {
        name: {
          de: "Am nächsten Tag Bypass auf Automatik",
          en: "Automatic recovery of bypass",
        },
        type: "boolean",
        desc: "autoRecover",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });
  }

  /* Solarflow and Hyper only States */

  if (type == "solarflow" || type == "hyper") {
    await adapter?.extendObject(`${productKey}.${deviceKey}.passMode`, {
      type: "state",
      common: {
        name: {
          de: "Einstellung des Bypass Modus",
          en: "Setting of bypass mode",
        },
        type: "string",
        desc: "passMode",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.pvBrand`, {
      type: "state",
      common: {
        name: { de: "Wechselrichter Hersteller", en: "brand of inverter" },
        type: "string",
        desc: "pvBrand",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.outputHomePower`, {
      type: "state",
      common: {
        name: { de: "Ausgangsleistung", en: "output power" },
        type: "number",
        desc: "outputHomePower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.outputLimit`, {
      type: "state",
      common: {
        name: { de: "Limit der Ausgangsleistung", en: "limit of output power" },
        type: "number",
        desc: "outputLimit",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });
  }

  if (type == "ace" || type == "hyper") {
    await adapter?.extendObject(`${productKey}.${deviceKey}.gridPower`, {
      type: "state",
      common: {
        name: { de: "Leistung vom Stromnetz", en: "Grid power" },
        type: "number",
        desc: "gridPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.batteryElectric`, {
      type: "state",
      common: {
        name: { de: "Batterie Leistung", en: "Battery electric" },
        type: "number",
        desc: "batteryElectric",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.gridInputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle AC Eingangsleistung",
          en: "current ac input power",
        },
        type: "number",
        desc: "gridInputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.acOutputPower`, {
      type: "state",
      common: {
        name: {
          de: "Aktuelle AC Ausgangsleistung",
          en: "Current AC output power",
        },
        type: "number",
        desc: "acOutputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W",
      },
      native: {},
    });

    await adapter?.extendObject(`${productKey}.${deviceKey}.acSwitch`, {
      type: "state",
      common: {
        name: {
          de: "AC Schalter",
          en: "AC switch",
        },
        type: "boolean",
        desc: "acSwitch",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });
  }

  // Create control states only when using App MQTT servers - and not the fallback one!
  if (!adapter.config.useFallbackService) {
    await createControlStates(adapter, productKey, deviceKey, type);
  }

  if (
    adapter.config.useCalculation &&
    (type == "solarflow" || type == "hyper")
  ) {
    await createCalculationStates(adapter, productKey, deviceKey);
  } else {
    //await deleteCalculationStates(adapter, productKey, deviceKey);
  }
};
