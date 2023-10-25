import { ZendureSolarflow } from "../main";

/* eslint-disable @typescript-eslint/indent */
export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
) => {
  await adapter?.setObjectNotExistsAsync(
    productKey + "." + deviceKey + "." + "electricLevel",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + "." + "electricLevel",
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
        name: productKey + "." + deviceKey + "." + "outputHomePower",
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
        name: productKey + "." + deviceKey + "." + "outputLimit",
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
        name: productKey + "." + deviceKey + "." + "outputPackPower",
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
        name: productKey + "." + deviceKey + "." + "packInputPower",
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
        name: productKey + "." + deviceKey + "." + "solarInputPower",
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
        name: productKey + "." + deviceKey + "." + "remainInputTime",
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
        name: productKey + "." + deviceKey + "." + "remainOutTime",
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
        name: productKey + "." + deviceKey + "." + "socSet",
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
        name: productKey + "." + deviceKey + "." + "minSoc",
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
        name: productKey + "." + deviceKey + ".control." + "setOutputLimit",
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

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string,
) => {
  adapter?.setStateAsync(
    productKey + "." + deviceKey + "." + state,
    val,
    false,
  );
};
