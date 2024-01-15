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
var adapterService_exports = {};
__export(adapterService_exports, {
  addOrUpdatePackData: () => addOrUpdatePackData,
  createSolarFlowStates: () => createSolarFlowStates,
  startCheckStatesTimer: () => startCheckStatesTimer,
  updateSolarFlowState: () => updateSolarFlowState
});
module.exports = __toCommonJS(adapterService_exports);
var import_webService = require("./webService");
const createSolarFlowStates = async (adapter, productKey, deviceKey) => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey, {
    type: "device",
    common: {
      name: { de: "Produkt " + productKey, en: "Product " + productKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey + "." + deviceKey + ".control", {
    type: "channel",
    common: {
      name: {
        de: "Steuerung Device " + deviceKey,
        en: "Control Device " + deviceKey
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(productKey + "." + deviceKey + ".packData", {
    type: "channel",
    common: {
      name: {
        de: "Akku Packs",
        en: "Battery packs"
      }
    },
    native: {}
  }));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".lastUpdate",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".electricLevel",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputHomePower",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputLimit",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".outputPackPower",
    {
      type: "state",
      common: {
        name: { de: "Ladeleistung zum Akku", en: "charge power" },
        type: "number",
        desc: "outputPackPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".packInputPower",
    {
      type: "state",
      common: {
        name: { de: "Entladeleistung zum Akku", en: "discharge power" },
        type: "number",
        desc: "packInputPower",
        role: "value.power",
        read: true,
        write: false,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".solarInputPower",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".pvPower1",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".pvPower2",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".remainInputTime",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".remainOutTime",
    {
      type: "state",
      common: {
        name: { de: "Erwartete Entladedauer", en: "remaining discharge time" },
        type: "number",
        desc: "remainOutTime",
        role: "value.interval",
        read: true,
        write: false
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".socSet",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".minSoc",
    {
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
    }
  ));
  await (adapter == null ? void 0 : adapter.extendObjectAsync(
    productKey + "." + deviceKey + ".control.setOutputLimit",
    {
      type: "state",
      common: {
        name: {
          de: "Einzustellende Ausgangsleistung",
          en: "Control of the output limit"
        },
        type: "number",
        desc: "setOutputLimit",
        role: "value.power",
        read: true,
        write: true,
        min: 0,
        unit: "W"
      },
      native: {}
    }
  ));
  adapter == null ? void 0 : adapter.subscribeStates(
    productKey + "." + deviceKey + ".control.setOutputLimit"
  );
};
const addOrUpdatePackData = async (adapter, productKey, deviceKey, packData) => {
  await packData.forEach(async (x) => {
    if (x.sn) {
      const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(
        adapter.FORBIDDEN_CHARS,
        ""
      );
      await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".sn", {
        type: "state",
        common: {
          name: {
            de: "Seriennummer",
            en: "Serial id"
          },
          type: "string",
          desc: "Serial ID",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      }));
      await (adapter == null ? void 0 : adapter.setStateAsync(key + ".sn", x.sn, true));
      if (x.socLevel) {
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".socLevel", {
          type: "state",
          common: {
            name: {
              de: "SOC der Batterie",
              en: "soc of battery"
            },
            type: "number",
            desc: "SOC Level",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(key + ".socLevel", x.socLevel, true));
      }
      if (x.maxTemp) {
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".maxTemp", {
          type: "state",
          common: {
            name: {
              de: "Max. Temperatur der Batterie",
              en: "max temp. of battery"
            },
            type: "number",
            desc: "Max. Temp",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(
          key + ".maxTemp",
          x.maxTemp / 10 - 273.15,
          true
        ));
      }
      if (x.minVol) {
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".minVol", {
          type: "state",
          common: {
            name: "minVol",
            type: "number",
            desc: "minVol",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(key + ".minVol", x.minVol / 100, true));
      }
      if (x.maxVol) {
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".maxVol", {
          type: "state",
          common: {
            name: "maxVol",
            type: "number",
            desc: "maxVol",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(key + ".maxVol", x.maxVol / 100, true));
      }
      if (x.totalVol) {
        await (adapter == null ? void 0 : adapter.extendObjectAsync(key + ".totalVol", {
          type: "state",
          common: {
            name: "totalVol",
            type: "number",
            desc: "totalVol",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }));
        await (adapter == null ? void 0 : adapter.setStateAsync(
          key + ".totalVol",
          x.totalVol / 100,
          true
        ));
      }
    }
  });
};
const startCheckStatesTimer = async (adapter) => {
  const statesToReset = [
    "outputHomePower",
    "outputPackPower",
    "packInputPower",
    "solarInputPower"
  ];
  adapter.interval = adapter.setInterval(async () => {
    (0, import_webService.getDeviceList)(adapter).then((deviceList) => {
      deviceList.forEach(async (device) => {
        const lastUpdate = await (adapter == null ? void 0 : adapter.getStateAsync(
          device.productKey + "." + device.deviceKey + ".lastUpdate"
        ));
        const tenMinutesAgo = Date.now() / 1e3 - 10 * 60;
        if (lastUpdate && lastUpdate.val && Number(lastUpdate.val) < tenMinutesAgo) {
          adapter.log.debug(
            `Last update for deviceKey ${device.deviceKey} was at ${new Date(
              Number(lastUpdate)
            )}, checking for pseudo power values!`
          );
          await statesToReset.forEach(async (stateName) => {
            await (adapter == null ? void 0 : adapter.setStateAsync(
              device.productKey + "." + device.deviceKey + "." + stateName,
              0,
              true
            ));
          });
          await (adapter == null ? void 0 : adapter.setStateAsync(
            device.productKey + "." + device.deviceKey + ".electricLevel",
            device.electricity,
            true
          ));
        }
      });
    }).catch(() => {
      var _a;
      (_a = adapter.log) == null ? void 0 : _a.error("Retrieving device failed!");
      return null;
    });
  }, 5e4);
};
const updateSolarFlowState = async (adapter, productKey, deviceKey, state, val) => {
  adapter == null ? void 0 : adapter.setStateAsync(
    productKey + "." + deviceKey + "." + state,
    val,
    true
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addOrUpdatePackData,
  createSolarFlowStates,
  startCheckStatesTimer,
  updateSolarFlowState
});
//# sourceMappingURL=adapterService.js.map
