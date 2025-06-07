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
  createControlStates: () => createControlStates,
  getControlStateDefinition: () => getControlStateDefinition
});
module.exports = __toCommonJS(createControlStates_exports);
var import_ac2400ControlStates = require("../constants/ac2400ControlStates");
var import_aceControlStates = require("../constants/aceControlStates");
var import_aioControlStates = require("../constants/aioControlStates");
var import_hubControlStates = require("../constants/hubControlStates");
var import_hyperControlStates = require("../constants/hyperControlStates");
var import_solarflow800ControlStates = require("../constants/solarflow800ControlStates");
var import_solarflow800ProControlStates = require("../constants/solarflow800ProControlStates");
const getControlStateDefinition = (productName) => {
  switch (productName.toLocaleLowerCase()) {
    case "hyper 2000":
      return import_hyperControlStates.hyperControlStates;
    case "solarflow 800":
      return import_solarflow800ControlStates.solarflow800ControlStates;
    case "solarflow2.0":
      return import_hubControlStates.hubControlStates;
    case "solarflow hub 2000":
      return import_hubControlStates.hubControlStates;
    case "solarflow aio zy":
      return import_aioControlStates.aioControlStates;
    case "ace 1500":
      return import_aceControlStates.aceControlStates;
    case "solarflow 800 pro":
      return import_solarflow800ProControlStates.solarflow800ProControlStates;
    case "solarflow 2400 ac":
      return import_ac2400ControlStates.ac2400ControlStates;
    default:
      return [];
  }
};
const createControlStates = async (adapter, productKey, deviceKey, productName) => {
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
  const controlStateDefinitions = getControlStateDefinition(productName);
  controlStateDefinitions.forEach(async (state) => {
    await (adapter == null ? void 0 : adapter.extendObject(
      `${productKey}.${deviceKey}.control.${state.title}`,
      {
        type: "state",
        common: {
          name: {
            de: state.nameDe,
            en: state.nameEn
          },
          type: state.type,
          desc: state.title,
          role: state.role,
          read: true,
          write: false,
          unit: state.unit,
          states: state.states
        },
        native: {}
      }
    ));
    adapter == null ? void 0 : adapter.subscribeStates(
      `${productKey}.${deviceKey}.control.${state.title}`
    );
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createControlStates,
  getControlStateDefinition
});
//# sourceMappingURL=createControlStates.js.map
