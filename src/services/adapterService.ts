import { ZendureSolarflow } from "../main";
import { IPackData } from "../models/IPackData";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { getDeviceList } from "./webService";

/* eslint-disable @typescript-eslint/indent */
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

  // Create control folder
  await adapter?.extendObjectAsync(productKey + "." + deviceKey + ".control", {
    type: "channel",
    common: {
      name: {
        de: "Steuerung Device " + deviceKey,
        en: "Control Device " + deviceKey,
      },
    },
    native: {},
  });

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
        role: "value.power.produced",
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
        name: { de: "Erwartete Entladedauer", en: "remaining discharge time" },
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

  // Subscibe to State updates to listen to changes
  adapter?.subscribeStates(
    productKey + "." + deviceKey + ".control." + "setOutputLimit",
  );
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

      await adapter?.setStateAsync(key + ".sn", x.sn, false);

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

        await adapter?.setStateAsync(key + ".socLevel", x.socLevel, false);
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
          false,
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

        await adapter?.setStateAsync(key + ".minVol", x.minVol / 100, false);
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

        await adapter?.setStateAsync(key + ".maxVol", x.maxVol / 100, false);
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

        await adapter?.setStateAsync(
          key + ".totalVol",
          x.totalVol / 100,
          false,
        );
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
            adapter.log.info(
              `Last update for deviceKey ${device.deviceKey} was at ${new Date(
                Number(lastUpdate),
              )}, checking for pseudo power values!`,
            );
            // State was not updated in the last 10 minutes... set states to 0
            await statesToReset.forEach(async (stateName: string) => {
              await adapter?.setStateAsync(
                device.productKey + "." + device.deviceKey + "." + stateName,
                0,
                false,
              );
            });

            // set electricLevel from deviceList
            await adapter?.setStateAsync(
              device.productKey + "." + device.deviceKey + ".electricLevel",
              device.electricity,
              false,
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

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string,
): Promise<void> => {
  adapter?.setStateAsync(
    productKey + "." + deviceKey + "." + state,
    val,
    false,
  );
};
