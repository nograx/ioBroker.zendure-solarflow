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
  createSolarFlowStates: () => createSolarFlowStates,
  updateSolarFlowState: () => updateSolarFlowState
});
module.exports = __toCommonJS(adapterService_exports);
const createSolarFlowStates = async (adapter, productKey, deviceKey) => {
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".electricLevel",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".electricLevel",
        type: "number",
        desc: "electricLevel",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".outputHomePower",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".outputHomePower",
        type: "number",
        desc: "outputHomePower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".outputLimit",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".outputLimit",
        type: "number",
        desc: "outputLimit",
        role: "value.power",
        read: true,
        write: true,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".outputPackPower",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".outputPackPower",
        type: "number",
        desc: "outputPackPower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".packInputPower",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".packInputPower",
        type: "number",
        desc: "packInputPower",
        role: "value.power",
        read: true,
        write: true,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".solarInputPower",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".solarInputPower",
        type: "number",
        desc: "solarInputPower",
        role: "value.power.produced",
        read: true,
        write: true,
        unit: "W"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".remainInputTime",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".remainInputTime",
        type: "number",
        desc: "remainInputTime",
        role: "value.interval",
        read: true,
        write: true
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".remainOutTime",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".remainOutTime",
        type: "number",
        desc: "remainOutTime",
        role: "value.interval",
        read: true,
        write: true
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".socSet",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".socSet",
        type: "number",
        desc: "socSet",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".minSoc",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".minSoc",
        type: "number",
        desc: "minSoc",
        role: "value.battery",
        read: true,
        write: true,
        unit: "%"
      },
      native: {}
    }
  ));
  await (adapter == null ? void 0 : adapter.setObjectNotExistsAsync(
    productKey + "." + deviceKey + ".control.setOutputLimit",
    {
      type: "state",
      common: {
        name: productKey + "." + deviceKey + ".control.setOutputLimit",
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
const updateSolarFlowState = async (adapter, productKey, deviceKey, state, val) => {
  adapter == null ? void 0 : adapter.setStateAsync(
    productKey + "." + deviceKey + "." + state,
    val,
    false
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSolarFlowStates,
  updateSolarFlowState
});
//# sourceMappingURL=adapterService.js.map
