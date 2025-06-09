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
  getProductNameFromProductKey: () => getProductNameFromProductKey
});
module.exports = __toCommonJS(helpers_exports);
const getProductNameFromProductKey = (productKey) => {
  switch (productKey) {
    case "73bkTV":
      return "Solarflow2.0";
    case "A8yh63":
      return "Solarflow Hub 2000";
    case "yWF7hV":
      return "Solarflow AIO zy";
    case "ja72U0ha":
      return "Hyper 2000";
    case "gDa3tb":
      return "Hyper 2000";
    case "8bM93H":
      return "ACE 1500";
    default:
      return "";
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getProductNameFromProductKey
});
//# sourceMappingURL=helpers.js.map
