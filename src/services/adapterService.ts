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
  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "lastUpdate",
    {
      type: "state",
      common: {
        name: { de: "Letztes Update", en: "Last Update" },
        type: "number",
        desc: "lastUpdate",
        role: "value.time",
        read: true,
        write: true,
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "electricLevel",
    {
      type: "state",
      common: {
        name: { de: "SOC Gesamtsystem", en: "SOC of the system" },
        type: "number",
        desc: "electricLevel",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "outputHomePower",
    {
      type: "state",
      common: {
        name: { de: "Ausgangsleistung", en: "output power" },
        type: "number",
        desc: "outputHomePower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "outputLimit",
    {
      type: "state",
      common: {
        name: { de: "Limit der Ausgangsleistung", en: "limit of output power" },
        type: "number",
        desc: "outputLimit",
        role: "value.power",
        read: true,
        write: true,
        unit: "W",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "outputPackPower",
    {
      type: "state",
      common: {
        name: { de: "Ladeleistung zum Akku", en: "charge power" },
        type: "number",
        desc: "outputPackPower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "packInputPower",
    {
      type: "state",
      common: {
        name: { de: "Entladeleistung zum Akku", en: "discharge power" },
        type: "number",
        desc: "packInputPower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "solarInputPower",
    {
      type: "state",
      common: {
        name: { de: "Leistung der Solarmodule", en: "solar power" },
        type: "number",
        desc: "solarInputPower",
        role: "value.power.produced",
        read: true,
        write: true,
        unit: "W",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "remainInputTime",
    {
      type: "state",
      common: {
        name: { de: "Erwartete Ladedauer", en: "remaining charge time" },
        type: "number",
        desc: "remainInputTime",
        role: "value.interval",
        read: true,
        write: true,
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "remainOutTime",
    {
      type: "state",
      common: {
        name: { de: "Erwartete Entladedauer", en: "remaining discharge time" },
        type: "number",
        desc: "remainOutTime",
        role: "value.interval",
        read: true,
        write: true,
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "socSet",
    {
      type: "state",
      common: {
        name: { de: "Max. SOC", en: "max. SOC" },
        type: "number",
        desc: "socSet",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%",
      },
      native: {},
    },
  );

  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "minSoc",
    {
      type: "state",
      common: {
        name: { de: "Min. SOC", en: "min. SOC" },
        type: "number",
        desc: "minSoc",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%",
      },
      native: {},
    },
  );

  // State zum Setzen des Output Limit
  await adapter?.setObjectNotExistsAsync(
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
    // Daten nur verarbeiten wenn eine SN mitgesendet wird!
    if (x.sn) {
      // State für SN
      const key = productKey + "." + deviceKey + ".packData." + x.sn;
      await adapter?.setObjectNotExistsAsync(key + ".sn", {
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
          write: true,
        },
        native: {},
      });

      await adapter?.setStateAsync(key + ".sn", x.sn, false);

      if (x.socLevel) {
        // State für socLevel
        await adapter?.setObjectNotExistsAsync(key + ".socLevel", {
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
            write: true,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".socLevel", x.socLevel, false);
      }

      if (x.maxTemp) {
        // State für maxTemp
        await adapter?.setObjectNotExistsAsync(key + ".maxTemp", {
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
            write: true,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".maxTemp", x.maxTemp / 100, false);
      }

      if (x.minVol) {
        await adapter?.setObjectNotExistsAsync(key + ".minVol", {
          type: "state",
          common: {
            name: "minVol",
            type: "number",
            desc: "minVol",
            role: "value",
            read: true,
            write: true,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".minVol", x.minVol / 100, false);
      }

      if (x.maxVol) {
        await adapter?.setObjectNotExistsAsync(key + ".maxVol", {
          type: "state",
          common: {
            name: "maxVol",
            type: "number",
            desc: "maxVol",
            role: "value",
            read: true,
            write: true,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".maxVol", x.maxVol / 100, false);
      }

      if (x.totalVol) {
        await adapter?.setObjectNotExistsAsync(key + ".totalVol", {
          type: "state",
          common: {
            name: "totalVol",
            type: "number",
            desc: "totalVol",
            role: "value",
            read: true,
            write: true,
          },
          native: {},
        });

        await adapter?.setStateAsync(key + ".totalVol", x.totalVol / 100, false);
      }
    }
  });
};

export const startCheckStatesTimer = async (adapter: ZendureSolarflow): Promise<void> => {
  // Check for states that has no updates in the last 5 minutes and set them to 0
  const statesToReset: string[] = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower",
  ];

  // Timer starten
  if (adapter && adapter.timer) {
    adapter.timer = null;
  }

  adapter.timer = setTimeout(async () => {
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
