/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  // Create device (e.g. the product type -> SolarFlow)
  await adapter?.extendObjectAsync(productKey, {
    type: "device",
    common: {
      name: { de: "Produkt " + productKey, en: "Product " + productKey },
    },
    native: {},
  });

  // Create channel (e.g. the device specific key)
  await adapter?.extendObjectAsync(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey },
    },
    native: {},
  });

  // Create calculations folder
  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.calculations`, {
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
  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.packData`, {
    type: "channel",
    common: {
      name: {
        de: "Batterie Packs",
        en: "Battery packs",
      },
    },
    native: {},
  });

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.lastUpdate`, {
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

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.electricLevel`, {
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

  await adapter?.extendObjectAsync(
    `${productKey}.${deviceKey}.outputHomePower`,
    {
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
    },
  );

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.outputLimit`, {
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

  await adapter?.extendObjectAsync(
    `${productKey}.${deviceKey}.outputPackPower`,
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    `${productKey}.${deviceKey}.packInputPower`,
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    `${productKey}.${deviceKey}.solarInputPower`,
    {
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
    },
  );

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.pvPower1`, {
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

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.pvPower2`, {
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

  await adapter?.extendObjectAsync(
    `${productKey}.${deviceKey}.remainInputTime`,
    {
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
    },
  );

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.remainOutTime`, {
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

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.socSet`, {
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

  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.minSoc`, {
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

  await createControlStates(adapter, productKey, deviceKey);

  if (adapter.config.useCalculation) {
    await createCalculationStates(adapter, productKey, deviceKey);
  } else {
    //await deleteCalculationStates(adapter, productKey, deviceKey);
  }
};