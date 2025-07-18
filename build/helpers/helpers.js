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
var helpers_exports = {};
__export(helpers_exports, {
  getMinAndMaxOutputLimitForProductKey: () => getMinAndMaxOutputLimitForProductKey,
  getProductNameFromProductKey: () => getProductNameFromProductKey
});
module.exports = __toCommonJS(helpers_exports);
const getProductNameFromProductKey = (productKey) => {
  switch (productKey.toLowerCase()) {
    case "73bktv":
      return "solarflow2.0";
    case "a8yh63":
      return "solarflow hub 2000";
    case "ywf7hv":
      return "solarflow aio zy";
    case "ja72u0ha":
      return "hyper 2000";
    case "gda3tb":
      return "hyper 2000";
    case "8bm93h":
      return "ace 1500";
    case "bc8b7f":
      return "solarflow 2400 ac";
    case "b1nhmc":
      return "solarflow 800";
    default:
      return "";
  }
};
const getMinAndMaxOutputLimitForProductKey = (productKey, limit) => {
  const productName = getProductNameFromProductKey(productKey);
  if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0) {
    if (limit < 100 && limit > 90 && !(productName == null ? void 0 : productName.includes("hyper")) && !(productName == null ? void 0 : productName.includes("2400 ac")) && !(productName == null ? void 0 : productName.includes("solarflow 800"))) {
      limit = 90;
    } else if (limit > 60 && limit < 90 && !(productName == null ? void 0 : productName.includes("hyper")) && !(productName == null ? void 0 : productName.includes("2400 ac")) && !(productName == null ? void 0 : productName.includes("solarflow 800"))) {
      limit = 60;
    } else if (limit > 30 && limit < 60 && !(productName == null ? void 0 : productName.includes("hyper")) && !(productName == null ? void 0 : productName.includes("2400 ac")) && !(productName == null ? void 0 : productName.includes("solarflow 800"))) {
      limit = 30;
    } else if (limit < 30) {
      limit = 30;
    }
  }
  switch (productName == null ? void 0 : productName.toLocaleLowerCase()) {
    case "hyper 2000":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow 800":
      if (limit > 800) {
        limit = 800;
      }
      break;
    case "solarflow2.0":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow hub 2000":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow aio zy":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow 800 pro":
      if (limit > 800) {
        limit = 800;
      }
      break;
    case "solarflow 2400 ac":
      if (limit > 2400) {
        limit = 2400;
      }
      break;
    default:
      break;
  }
  return limit;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMinAndMaxOutputLimitForProductKey,
  getProductNameFromProductKey
});
//# sourceMappingURL=helpers.js.map
