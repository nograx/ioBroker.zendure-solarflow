import { ZendureSolarflow } from "../main";
import { IPackData } from "../models/IPackData";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { getDeviceList } from "./webService";

/* eslint-disable @typescript-eslint/indent */
const createCalculationStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  /*
  Start Solar Input Energy states
  */
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations.solarInputEnergyTodayWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag (Wh)",
          en: "Todays solar input (Wh)",
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh"
      },
      native: {},
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations.solarInputEnergyTodaykWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag (kWh)",
          en: "Todays solar input (kWh)",
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh"
      },
      native: {},
    },
  );

  /*
  Start output pack Energy states
  */
  await adapter?.extendObjectAsync(
    productKey +
      "." +
      deviceKey +
      ".calculations.outputPackEnergyTodayWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zum Akku (Wh)",
          en: "todays charge energy to battery (Wh)",
        },
        type: "number",
        desc: "outputPackEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    },
  );

  await adapter?.extendObjectAsync(
    productKey +
      "." +
      deviceKey +
      ".calculations.outputPackEnergyTodaykWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zum Akku (kWh)",
          en: "todays charge energy to battery (kWh)",
        },
        type: "number",
        desc: "outputPackEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh",
      },
      native: {},
    },
  );

  /*
  Start Pack Input Energy states
  */
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey  + ".calculations.packInputEnergyTodayWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zum Akku (Wh)",
          en: "todays charge energy to battery (Wh)",
        },
        type: "number",
        desc: "packInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    },
  );

  await adapter?.extendObjectAsync(
    productKey +
      "." +
      deviceKey +
      ".calculations.packInputEnergyTodaykWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung aus Akku (kWh)",
          en: "Todays discharge energy from battery (kWh)",
        },
        type: "number",
        desc: "packInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh",
      },
      native: {},
    },
  );

  /*
  Start outputHome Energy states
  */
  await adapter?.extendObjectAsync(
    productKey +
      "." +
      deviceKey +
      ".calculations.outputHomeEnergyTodayWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung ins Haus (Wh)",
          en: "Todays input energy to home (Wh)",
        },
        type: "number",
        desc: "outputHomeEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    },
  );

  await adapter?.extendObjectAsync(
    productKey +
      "." +
      deviceKey +
      ".calculations.outputHomeEnergyTodaykWh",
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung ins Haus (kWh)",
          en: "Todays input energy to home (kWh)",
        },
        type: "number",
        desc: "outputHomeEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh",
      },
      native: {},
    },
  );
  /*
  End Energy states
  */

  // Calculation input time
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations.remainInputTime",
    {
      type: "state",
      common: {
        name: {
          de: "Erwartete Ladedauer (hh:mm)",
          en: "remaining charge time (hh:mm)",
        },
        type: "string",
        desc: "calcRemainInputTime",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    },
  );

  // Calculation remainOutTime
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations.remainOutTime",
    {
      type: "state",
      common: {
        name: {
          de: "Erwartete Entladedauer (hh:mm)",
          en: "remaining discharge time (hh:mm)",
        },
        type: "string",
        desc: "calcRemainOutTime",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    },
  );
};

const createControlStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  // Create control folder
  await adapter?.extendObjectAsync(productKey + "." + deviceKey + ".control", {
    type: "channel",
    common: {
      name: {
        de: "Steuerung für Gerät " + deviceKey,
        en: "Control for device " + deviceKey,
      },
    },
    native: {},
  });

  // State zum Setzen des Output Limit
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".control." + "setOutputLimit",
    {
      type: "state",
      common: {
        name: {
          de: "Einzustellende Ausgangsleistung",
          en: "Control of the output limit",
        },
        type: "number",
        desc: "setOutputLimit",
        role: "value.power",
        read: true,
        write: true,
        min: 0,
        unit: "W",
      },
      native: {},
    },
  );

  // State zum Setzen des Charge Limit
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".control." + "chargeLimit",
    {
      type: "state",
      common: {
        name: {
          de: "Setzen des Lade-Limits",
          en: "Control of the charge limit",
        },
        type: "number",
        desc: "chargeLimit",
        role: "value.battery",
        read: true,
        write: true,
        min: 40,
        max: 100,
        unit: "%",
      },
      native: {},
    },
  );

  // State zum Setzen des Discharge Limit
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".control." + "dischargeLimit",
    {
      type: "state",
      common: {
        name: {
          de: "Setzen des Entlade-Limits",
          en: "Control of the discharge limit",
        },
        type: "number",
        desc: "dischargeLimit",
        role: "value.battery",
        read: true,
        write: true,
        min: 0,
        max: 90,
        unit: "%",
      },
      native: {},
    },
  );

  // Subcribe to control states
  adapter?.subscribeStates(
    productKey + "." + deviceKey + ".control." + "setOutputLimit",
  );

  adapter?.subscribeStates(
    productKey + "." + deviceKey + ".control." + "chargeLimit",
  );

  adapter?.subscribeStates(
    productKey + "." + deviceKey + ".control." + "dischargeLimit",
  );
};

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
  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + ".calculations",
    {
      type: "channel",
      common: {
        name: {
          de: "Berechnungen für Gerät " + deviceKey,
          en: "Calculations for Device " + deviceKey,
        },
      },
      native: {},
    },
  );

  // Create pack data folder
  await adapter?.extendObjectAsync(productKey + "." + deviceKey + ".packData", {
    type: "channel",
    common: {
      name: {
        de: "Akku Packs",
        en: "Battery packs",
      },
    },
    native: {},
  });

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "lastUpdate",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "electricLevel",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "outputHomePower",
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

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "outputLimit",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "outputPackPower",
    {
      type: "state",
      common: {
        name: { de: "Ladeleistung zum Akku", en: "charge power" },
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
    productKey + "." + deviceKey + "." + "packInputPower",
    {
      type: "state",
      common: {
        name: { de: "Entladeleistung zum Akku", en: "discharge power" },
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
    productKey + "." + deviceKey + "." + "solarInputPower",
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

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "pvPower1",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "pvPower2",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "remainInputTime",
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

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "remainOutTime",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "socSet",
    {
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
    },
  );

  await adapter?.extendObjectAsync(
    productKey + "." + deviceKey + "." + "minSoc",
    {
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
    },
  );

  // Subscibe to State updates to listen to changes
  adapter?.subscribeStates(
    productKey + "." + deviceKey + "." + "solarInputPower",
  );

  adapter?.subscribeStates(
    productKey + "." + deviceKey + "." + "outputPackPower",
  );

  adapter?.subscribeStates(
    productKey + "." + deviceKey + "." + "packInputPower",
  );

  adapter?.subscribeStates(
    productKey + "." + deviceKey + "." + "outputHomePower",
  );

  await createControlStates(adapter, productKey, deviceKey);
  await createCalculationStates(adapter, productKey, deviceKey);
};

export const addOrUpdatePackData = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  packData: IPackData[],
): Promise<void> => {
  await packData.forEach(async (x) => {
    // Process data only with a serial id!
    if (x.sn) {
      // create a state for the serial id
      const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(
        adapter.FORBIDDEN_CHARS,
        "",
      );

      await adapter?.extendObjectAsync(key + ".sn", {
        type: "state",
        common: {
          name: {
            de: "Seriennummer",
            en: "Serial id",
          },
          type: "string",
          desc: "Serial ID",
          role: "value",
          read: true,
          write: false,
        },
        native: {},
      });

      await adapter?.setStateAsync(key + ".sn", x.sn, true);

      if (x.socLevel) {
        // State für socLevel
        await adapter?.extendObjectAsync(key + ".socLevel", {
          type: "state",
          common: {
            name: {
              de: "SOC der Batterie",
              en: "soc of battery",
            },
            type: "number",
            desc: "SOC Level",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".socLevel", x.socLevel, true);
      }

      if (x.maxTemp) {
        // State für maxTemp
        await adapter?.extendObjectAsync(key + ".maxTemp", {
          type: "state",
          common: {
            name: {
              de: "Max. Temperatur der Batterie",
              en: "max temp. of battery",
            },
            type: "number",
            desc: "Max. Temp",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        // Convert Kelvin to Celsius
        await adapter?.setStateAsync(
          key + ".maxTemp",
          x.maxTemp / 10 - 273.15,
          true,
        );
      }

      if (x.minVol) {
        await adapter?.extendObjectAsync(key + ".minVol", {
          type: "state",
          common: {
            name: "minVol",
            type: "number",
            desc: "minVol",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".minVol", x.minVol / 100, true);
      }

      if (x.maxVol) {
        await adapter?.extendObjectAsync(key + ".maxVol", {
          type: "state",
          common: {
            name: "maxVol",
            type: "number",
            desc: "maxVol",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".maxVol", x.maxVol / 100, true);
      }

      if (x.totalVol) {
        await adapter?.extendObjectAsync(key + ".totalVol", {
          type: "state",
          common: {
            name: "totalVol",
            type: "number",
            desc: "totalVol",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".totalVol", x.totalVol / 100, true);
      }
    }
  });
};

export const startCheckStatesTimer = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  // Check for states that has no updates in the last 5 minutes and set them to 0
  const statesToReset: string[] = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower",
  ];

  adapter.interval = adapter.setInterval(async () => {
    getDeviceList(adapter)
      .then((deviceList: ISolarFlowDeviceDetails[]) => {
        deviceList.forEach(async (device: ISolarFlowDeviceDetails) => {
          const lastUpdate = await adapter?.getStateAsync(
            device.productKey + "." + device.deviceKey + ".lastUpdate",
          );

          const tenMinutesAgo = Date.now() / 1000 - 10 * 60; // Ten minutes ago

          if (
            lastUpdate &&
            lastUpdate.val &&
            Number(lastUpdate.val) < tenMinutesAgo
          ) {
            adapter.log.debug(
              `Last update for deviceKey ${device.deviceKey} was at ${new Date(
                Number(lastUpdate),
              )}, checking for pseudo power values!`,
            );
            // State was not updated in the last 10 minutes... set states to 0
            await statesToReset.forEach(async (stateName: string) => {
              await adapter?.setStateAsync(
                device.productKey + "." + device.deviceKey + "." + stateName,
                0,
                true,
              );
            });

            // set electricLevel from deviceList
            await adapter?.setStateAsync(
              device.productKey + "." + device.deviceKey + ".electricLevel",
              device.electricity,
              true,
            );
          }
        });
      })
      .catch(() => {
        adapter.log?.error("Retrieving device failed!");
        return null;
      });
  }, 50000);
};

export const calculateEnergy = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  stateKey: string, // e.g. packInput, outputHome, outputPack, solarInput
  state: ioBroker.State,
): Promise<void> => {
  const stateNameWh =
    productKey +
    "." +
    deviceKey +
    ".calculations." +
    stateKey +
    "EnergyTodayWh";

  const stateNamekWh =
    productKey +
    "." +
    deviceKey +
    ".calculations." +
    stateKey +
    "EnergyTodaykWh";
  const currentVal = await adapter?.getStateAsync(stateNameWh);

  if (currentVal && currentVal.lc && state.val) {
    const timeFrame = state.lc - currentVal?.lc;
    const newVal =
      Number(currentVal.val) + (Number(state.val) * timeFrame) / 3600000000; // Wh

    adapter?.setStateAsync(stateNameWh, newVal, true);
    adapter?.setStateAsync(stateNamekWh, (newVal / 1000).toFixed(2), true);
  }
  else {
    adapter?.setStateAsync(stateNameWh, 0, true);
    adapter?.setStateAsync(stateNamekWh, 0, true);
  }
};

export const resetTodaysValues = async (
  adapter: ZendureSolarflow,
): Promise<void> => {
  adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
    const names = ["packInput", "outputHome", "outputPack", "solarInput"];

    names.forEach((name: string) => {
      const stateNameWh =
        device.productKey +
        "." +
        device.deviceKey +
        ".calculations." +
        name +
        "EnergyTodayWh";
      const stateNamekWh =
        device.productKey +
        "." +
        device.deviceKey +
        ".calculations." +
        name +
        "EnergyTodaykWh";

      adapter?.setStateAsync(stateNameWh, 0, true);
      adapter?.setStateAsync(stateNamekWh, 0, true);
    });
  });
};

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string,
): Promise<void> => {
  adapter?.setStateAsync(productKey + "." + deviceKey + "." + state, val, true);
};
