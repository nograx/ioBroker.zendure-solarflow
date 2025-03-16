import { ZendureSolarflow } from "../main";

/* eslint-disable @typescript-eslint/indent */
export const createCalculationStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  type: string
): Promise<void> => {
  if (
    type == "aio" ||
    type == "hyper" ||
    type == "ace" ||
    type == "solarflow"
  ) {
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.calculations.gridInputEnergyTodayWh`,
      {
        type: "state",
        common: {
          name: {
            de: "Heutige Ladung per AC (Wh)",
            en: "Charged by AC (Wh)",
          },
          type: "number",
          desc: "gridInputEnergyTodayWh",
          role: "value.energy",
          read: true,
          write: false,
          unit: "Wh",
        },
        native: {},
      }
    );

    await adapter?.extendObject(
      `${productKey}.${deviceKey}.calculations.gridInputEnergyTodaykWh`,
      {
        type: "state",
        common: {
          name: {
            de: "Heutige Ladung per AC (kWh)",
            en: "Charged by AC (kWh)",
          },
          type: "number",
          desc: "gridInputEnergyTodaykWh",
          role: "value.energy",
          read: true,
          write: false,
          unit: "kWh",
        },
        native: {},
      }
    );
  }

  /*
    Start Solar Input Energy states
    */
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputEnergyTodayWh`,
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
        unit: "Wh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputEnergyTodaykWh`,
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
        unit: "kWh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV1 (Wh)",
          en: "Todays solar input PV1 (Wh)",
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv1EnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV1 (kWh)",
          en: "Todays solar input PV1 (kWh)",
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV2 (Wh)",
          en: "Todays solar input PV2 (Wh)",
        },
        type: "number",
        desc: "solarInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.solarInputPv2EnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutiger Solarertrag PV2 (kWh)",
          en: "Todays solar input PV2 (kWh)",
        },
        type: "number",
        desc: "solarInputEnergyTodaykWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "kWh",
      },
      native: {},
    }
  );

  /*
    Start output pack Energy states
    */
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.outputPackEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zu Batterie (Wh)",
          en: "Todays charge energy to battery (Wh)",
        },
        type: "number",
        desc: "outputPackEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.outputPackEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Ladung zur Batterie (kWh)",
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
    }
  );

  /*
    Start Pack Input Energy states
    */
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.packInputEnergyTodayWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung aus Batterie (Wh)",
          en: "Todays discharge energy from battery (Wh)",
        },
        type: "number",
        desc: "packInputEnergyTodayWh",
        role: "value.energy",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.packInputEnergyTodaykWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Heutige Einspeisung aus Batterie (kWh)",
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
    }
  );

  /*
    Start outputHome Energy states
    */
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.outputHomeEnergyTodayWh`,
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
    }
  );

  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.outputHomeEnergyTodaykWh`,
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
    }
  );
  /*
    End Energy states
    */

  // Calculation input time
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.remainInputTime`,
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
    }
  );

  // Calculation remainOutTime
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.remainOutTime`,
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
    }
  );

  // Calculation SOC
  await adapter?.extendObject(`${productKey}.${deviceKey}.calculations.soc`, {
    type: "state",
    common: {
      name: {
        de: "Ladezustand in % (der nutzbaren Energie)",
        en: "State of Charge % (of usable energy)",
      },
      type: "number",
      desc: "soc",
      role: "value",
      read: true,
      write: false,
      unit: "%",
    },
    native: {},
  });

  // Energy Wh
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.energyWh`,
    {
      type: "state",
      common: {
        name: {
          de: "Nutzbare Energie in den Batterien (Wh)",
          en: "Usable energy in battery (Wh)",
        },
        type: "number",
        desc: "energyWh",
        role: "value",
        read: true,
        write: false,
        unit: "Wh",
      },
      native: {},
    }
  );

  // Max. Energy for alle batteries Wh
  await adapter?.extendObject(
    `${productKey}.${deviceKey}.calculations.energyWhMax`,
    {
      type: "state",
      common: {
        name: {
          de: "Max. nutzbare Energie in allen Batterien (Wh)",
          en: "Max. usable energy in battery (Wh)",
        },
        type: "number",
        desc: "energyWhMax",
        role: "value",
        read: true,
        write: true,
        unit: "Wh",
      },
      native: {},
    }
  );
};
