/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";

export const createControlStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
): Promise<void> => {
  // Create control folder
  await adapter?.extendObjectAsync(`${productKey}.${deviceKey}.control`, {
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
    },
  );

  // State zum Setzen des Charge Limit
  await adapter?.extendObjectAsync(
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
    },
  );

  // State zum Setzen des Discharge Limit
  await adapter?.extendObjectAsync(
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
        max: 90,
        unit: "%",
      },
      native: {},
    },
  );

  // State zum Setzen des Buzzers
  await adapter?.extendObjectAsync(
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
    },
  );

  // State zum Setzen des Buzzers
  await adapter?.extendObjectAsync(
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
    },
  );

  // State zum Setzen des Auto-Modus vom Bypass
  await adapter?.extendObjectAsync(
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
    },
  );

  if (adapter.config.useLowVoltageBlock) {
    // State zum Setzen des Output Limit
    await adapter?.extendObjectAsync(
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
      },
    );

    adapter?.subscribeStates(
      `${productKey}.${deviceKey}.control.lowVoltageBlock`,
    );
  }

  // Subcribe to control states
  adapter?.subscribeStates(`${productKey}.${deviceKey}.control.setOutputLimit`);

  adapter?.subscribeStates(`${productKey}.${deviceKey}.control.chargeLimit`);

  adapter?.subscribeStates(`${productKey}.${deviceKey}.control.dischargeLimit`);
};
