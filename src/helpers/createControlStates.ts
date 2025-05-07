/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";

export const createControlStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  type: string
): Promise<void> => {
  // Create control folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.control`, {
    type: "channel",
    common: {
      name: {
        de: "Steuerung für Gerät " + deviceKey,
        en: "Control for device " + deviceKey,
      },
    },
    native: {},
  });

  if (type != "smartPlug") {
    // State zum Setzen des Betriebsmodus
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.control.autoModel`,
      {
        type: "state",
        common: {
          name: {
            de: "Energieplan-Einstellung",
            en: "Energyplan",
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
            10: "Electricity Price",
          },
        },
        native: {},
      }
    );

    adapter?.subscribeStates(`${productKey}.${deviceKey}.control.autoModel`);

    // State zum Setzen des Charge Limit
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.control.chargeLimit`,
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
      }
    );

    adapter?.subscribeStates(`${productKey}.${deviceKey}.control.chargeLimit`);

    // State zum Setzen des Discharge Limit
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.control.dischargeLimit`,
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
          max: 50,
          unit: "%",
        },
        native: {},
      }
    );

    adapter?.subscribeStates(
      `${productKey}.${deviceKey}.control.dischargeLimit`
    );

    // State zum Setzen des Buzzers
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.control.buzzerSwitch`,
      {
        type: "state",
        common: {
          name: {
            de: "Sounds am HUB aktivieren",
            en: "Enable buzzer on HUB",
          },
          type: "boolean",
          desc: "buzzerSwitch",
          role: "switch",
          read: true,
          write: true,
        },
        native: {},
      }
    );

    adapter?.subscribeStates(`${productKey}.${deviceKey}.control.buzzerSwitch`);

    if (
      type == "aio" ||
      type == "solarflow" ||
      type == "hyper" ||
      type == "ace"
    ) {
      // State zum Setzen des Output Limit
      await adapter?.extendObject(
        `${productKey}.${deviceKey}.control.setOutputLimit`,
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
        }
      );

      // Subcribe to control states
      adapter?.subscribeStates(
        `${productKey}.${deviceKey}.control.setOutputLimit`
      );

      // State zum Setzen des Bypass Modus
      await adapter?.extendObject(
        `${productKey}.${deviceKey}.control.passMode`,
        {
          type: "state",
          common: {
            name: {
              de: "Einstellung des Bypass Modus",
              en: "Setting of bypass mode",
            },
            type: "number",
            desc: "passMode",
            role: "switch",
            read: true,
            write: true,
            states: {
              0: "Automatic",
              1: "Always off",
              2: "Always on",
            },
          },
          native: {},
        }
      );

      adapter?.subscribeStates(`${productKey}.${deviceKey}.control.passMode`);

      // State zum Setzen des Auto-Modus vom Bypass
      await adapter?.extendObject(
        `${productKey}.${deviceKey}.control.autoRecover`,
        {
          type: "state",
          common: {
            name: {
              de: "Am nächsten Tag Bypass auf Automatik",
              en: "Automatic recovery of bypass",
            },
            type: "boolean",
            desc: "autoRecover",
            role: "switch",
            read: true,
            write: true,
          },
          native: {},
        }
      );

      adapter?.subscribeStates(
        `${productKey}.${deviceKey}.control.autoRecover`
      );

      // State zum Setzen des Input Limit (AC)
      await adapter?.extendObject(
        `${productKey}.${deviceKey}.control.hubState`,
        {
          type: "state",
          common: {
            name: {
              de: "Verhalten wenn minimale reservierte Ladung erreicht",
              en: "Behavior when minimum reserved charge is reached",
            },
            type: "number",
            desc: "hubState",
            read: true,
            write: true,
            min: 0,
            max: 1,
            states: {
              0: "Stop output and standby",
              1: "Stop output and shut down",
            },
          },
          native: {},
        }
      );

      adapter?.subscribeStates(`${productKey}.${deviceKey}.control.hubState`);

      if (type == "solarflow" || type == "hyper" || type == "ace") {
        // State zum Setzen des Input Limit (AC)
        await adapter?.extendObject(
          `${productKey}.${deviceKey}.control.setInputLimit`,
          {
            type: "state",
            common: {
              name: {
                de: "Einzustellende Eingangsleistung",
                en: "Control of the input limit",
              },
              type: "number",
              desc: "setInputLimit",
              role: "value.power",
              read: true,
              write: true,
              min: 0,
              max: type == "ace" || type == "solarflow" ? 900 : 1200,
              step: type == "ace" || type == "solarflow" ? 100 : 1,
              unit: "W",
            },
            native: {},
          }
        );

        adapter?.subscribeStates(
          `${productKey}.${deviceKey}.control.setInputLimit`
        );

        // State zum Setzen des AC Schalters
        await adapter?.extendObject(
          `${productKey}.${deviceKey}.control.acSwitch`,
          {
            type: "state",
            common: {
              name: {
                de: "AC Schalter",
                en: "AC switch",
              },
              type: "boolean",
              desc: "acSwitch",
              role: "switch",
              read: true,
              write: true,
            },
            native: {},
          }
        );

        adapter?.subscribeStates(`${productKey}.${deviceKey}.control.acSwitch`);

        // State zum Setzen des AC Modus
        await adapter?.extendObject(
          `${productKey}.${deviceKey}.control.acMode`,
          {
            type: "state",
            common: {
              name: {
                de: "AC Modus",
                en: "AC mode",
              },
              type: "number",
              desc: "acMode",
              role: "switch",
              min: 0,
              max: type == "ace" ? 3 : 2,
              step: 1,
              read: true,
              write: true,
              states:
                type == "ace"
                  ? {
                      0: "Nothing",
                      1: "Normal work mode",
                      2: "Never turn off",
                      3: "Automatic shutdown AC",
                    }
                  : {
                      0: "Nothing",
                      1: "AC input mode",
                      2: "AC output mode",
                    },
            },
            native: {},
          }
        );

        adapter?.subscribeStates(`${productKey}.${deviceKey}.control.acMode`);
      }

      // States for controlling the low voltage block
      if (adapter.config.useLowVoltageBlock) {
        // State zum Setzen des Output Limit
        await adapter?.extendObject(
          `${productKey}.${deviceKey}.control.lowVoltageBlock`,
          {
            type: "state",
            common: {
              name: {
                de: "Niedrige Batteriespannung erkannt",
                en: "Low Voltage on battery detected",
              },
              type: "boolean",
              desc: "lowVoltageBlock",
              role: "indicator.lowbat",
              read: true,
              write: false,
            },
            native: {},
          }
        );

        adapter?.subscribeStates(
          `${productKey}.${deviceKey}.control.lowVoltageBlock`
        );

        // State zum Setzen des Output Limit
        await adapter?.extendObject(
          `${productKey}.${deviceKey}.control.fullChargeNeeded`,
          {
            type: "state",
            common: {
              name: {
                de: "Auf 100% laden, Akku muss kalibriert werden!",
                en: "Charge to 100%, battery needs to be calibrated",
              },
              type: "boolean",
              desc: "fullChargeNeeded",
              role: "indicator.lowbat",
              read: true,
              write: false,
            },
            native: {},
          }
        );

        adapter?.subscribeStates(
          `${productKey}.${deviceKey}.control.fullChargeNeeded`
        );
      }
    }

    // States only for ACE 1500
    if (type == "ace") {
      // State zum Setzen des DC Schalters
      await adapter?.extendObject(
        `${productKey}.${deviceKey}.control.dcSwitch`,
        {
          type: "state",
          common: {
            name: {
              de: "DC Schalter",
              en: "DC switch",
            },
            type: "boolean",
            desc: "dcSwitch",
            role: "switch",
            read: true,
            write: true,
          },
          native: {},
        }
      );

      adapter?.subscribeStates(`${productKey}.${deviceKey}.control.dcSwitch`);
    }
  }
};
