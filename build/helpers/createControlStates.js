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
var createControlStates_exports = {};
__export(createControlStates_exports, {
  createControlStates: () => createControlStates
});
module.exports = __toCommonJS(createControlStates_exports);
const createControlStates = async (adapter, productKey, deviceKey, type) => {
  await (adapter == null ? void 0 : adapter.extendObject(`${productKey}.${deviceKey}.control`, {
    type: "channel",
    common: {
      name: {
        de: "Steuerung f\xFCr Ger\xE4t " + deviceKey,
        en: "Control for device " + deviceKey
      }
    },
    native: {}
  }));
  if (type != "smartPlug") {
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.control.autoModel`,
      {
        type: "state",
        common: {
          name: {
            de: "Energieplan-Einstellung",
            en: "Energyplan"
          },
          type: "number",
          desc: "autoModel",
          role: "value",
          read: true,
          write: true,
          states: {
            0: "Nothing",
            6: "Battery priority mode",
            7: "Appointment mode",
            8: "Smart Matching Mode",
            9: "Smart CT Mode",
            10: "Electricity Price"
          }
        },
        native: {}
      }
    ));
    adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.autoModel`);
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.control.chargeLimit`,
      {
        type: "state",
        common: {
          name: {
            de: "Setzen des Lade-Limits",
            en: "Control of the charge limit"
          },
          type: "number",
          desc: "chargeLimit",
          role: "value.battery",
          read: true,
          write: true,
          min: 40,
          max: 100,
          unit: "%"
        },
        native: {}
      }
    ));
    adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.chargeLimit`);
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.control.dischargeLimit`,
      {
        type: "state",
        common: {
          name: {
            de: "Setzen des Entlade-Limits",
            en: "Control of the discharge limit"
          },
          type: "number",
          desc: "dischargeLimit",
          role: "value.battery",
          read: true,
          write: true,
          min: 0,
          max: 50,
          unit: "%"
        },
        native: {}
      }
    ));
    adapter == null ? void 0 : adapter.subscribeStates(
      `${productKey}.${deviceKey}.control.dischargeLimit`
    );
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.control.buzzerSwitch`,
      {
        type: "state",
        common: {
          name: {
            de: "Sounds am HUB aktivieren",
            en: "Enable buzzer on HUB"
          },
          type: "boolean",
          desc: "buzzerSwitch",
          role: "switch",
          read: true,
          write: true
        },
        native: {}
      }
    ));
    adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.buzzerSwitch`);
    if (type == "aio" || type == "solarflow" || type == "hyper" || type == "ace") {
      await (adapter == null ? void 0 : adapter.extendObject(
        `${productKey}.${deviceKey}.control.setOutputLimit`,
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
        `${productKey}.${deviceKey}.control.setOutputLimit`
      );
      await (adapter == null ? void 0 : adapter.extendObject(
        `${productKey}.${deviceKey}.control.passMode`,
        {
          type: "state",
          common: {
            name: {
              de: "Einstellung des Bypass Modus",
              en: "Setting of bypass mode"
            },
            type: "number",
            desc: "passMode",
            role: "switch",
            read: true,
            write: true,
            states: {
              0: "Automatic",
              1: "Always off",
              2: "Always on"
            }
          },
          native: {}
        }
      ));
      adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.passMode`);
      await (adapter == null ? void 0 : adapter.extendObject(
        `${productKey}.${deviceKey}.control.autoRecover`,
        {
          type: "state",
          common: {
            name: {
              de: "Am n\xE4chsten Tag Bypass auf Automatik",
              en: "Automatic recovery of bypass"
            },
            type: "boolean",
            desc: "autoRecover",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        }
      ));
      adapter == null ? void 0 : adapter.subscribeStates(
        `${productKey}.${deviceKey}.control.autoRecover`
      );
      await (adapter == null ? void 0 : adapter.extendObject(
        `${productKey}.${deviceKey}.control.hubState`,
        {
          type: "state",
          common: {
            name: {
              de: "Verhalten wenn minimale reservierte Ladung erreicht",
              en: "Behavior when minimum reserved charge is reached"
            },
            type: "number",
            desc: "hubState",
            read: true,
            write: true,
            min: 0,
            max: 1,
            states: {
              0: "Stop output and standby",
              1: "Stop output and shut down"
            }
          },
          native: {}
        }
      ));
      adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.hubState`);
      if (type == "solarflow" || type == "hyper" || type == "ace") {
        await (adapter == null ? void 0 : adapter.extendObject(
          `${productKey}.${deviceKey}.control.setInputLimit`,
          {
            type: "state",
            common: {
              name: {
                de: "Einzustellende Eingangsleistung",
                en: "Control of the input limit"
              },
              type: "number",
              desc: "setInputLimit",
              role: "value.power",
              read: true,
              write: true,
              min: 0,
              max: type == "ace" || type == "solarflow" ? 900 : 1200,
              step: type == "ace" || type == "solarflow" ? 100 : 1,
              unit: "W"
            },
            native: {}
          }
        ));
        adapter == null ? void 0 : adapter.subscribeStates(
          `${productKey}.${deviceKey}.control.setInputLimit`
        );
        await (adapter == null ? void 0 : adapter.extendObject(
          `${productKey}.${deviceKey}.control.acSwitch`,
          {
            type: "state",
            common: {
              name: {
                de: "AC Schalter",
                en: "AC switch"
              },
              type: "boolean",
              desc: "acSwitch",
              role: "switch",
              read: true,
              write: true
            },
            native: {}
          }
        ));
        adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.acSwitch`);
        await (adapter == null ? void 0 : adapter.extendObject(
          `${productKey}.${deviceKey}.control.acMode`,
          {
            type: "state",
            common: {
              name: {
                de: "AC Modus",
                en: "AC mode"
              },
              type: "number",
              desc: "acMode",
              role: "switch",
              min: 0,
              max: 2,
              step: 1,
              read: true,
              write: true,
              states: {
                0: "Nothing",
                1: "AC input mode",
                2: "AC output mode"
              }
            },
            native: {}
          }
        ));
        adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.acMode`);
      }
      if (adapter.config.useLowVoltageBlock) {
        await (adapter == null ? void 0 : adapter.extendObject(
          `${productKey}.${deviceKey}.control.lowVoltageBlock`,
          {
            type: "state",
            common: {
              name: {
                de: "Niedrige Batteriespannung erkannt",
                en: "Low Voltage on battery detected"
              },
              type: "boolean",
              desc: "lowVoltageBlock",
              role: "indicator.lowbat",
              read: true,
              write: false
            },
            native: {}
          }
        ));
        adapter == null ? void 0 : adapter.subscribeStates(
          `${productKey}.${deviceKey}.control.lowVoltageBlock`
        );
        await (adapter == null ? void 0 : adapter.extendObject(
          `${productKey}.${deviceKey}.control.fullChargeNeeded`,
          {
            type: "state",
            common: {
              name: {
                de: "Auf 100% laden, Akku muss kalibriert werden!",
                en: "Charge to 100%, battery needs to be calibrated"
              },
              type: "boolean",
              desc: "fullChargeNeeded",
              role: "indicator.lowbat",
              read: true,
              write: false
            },
            native: {}
          }
        ));
        adapter == null ? void 0 : adapter.subscribeStates(
          `${productKey}.${deviceKey}.control.fullChargeNeeded`
        );
      }
    }
    if (type == "ace") {
      await (adapter == null ? void 0 : adapter.extendObject(
        `${productKey}.${deviceKey}.control.dcSwitch`,
        {
          type: "state",
          common: {
            name: {
              de: "DC Schalter",
              en: "DC switch"
            },
            type: "boolean",
            desc: "dcSwitch",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        }
      ));
      adapter == null ? void 0 : adapter.subscribeStates(`${productKey}.${deviceKey}.control.dcSwitch`);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createControlStates
});
//# sourceMappingURL=createControlStates.js.map
