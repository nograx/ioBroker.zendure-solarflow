"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var fallbackWebService_exports = {};
__export(fallbackWebService_exports, {
  createDeveloperAccount: () => createDeveloperAccount
});
module.exports = __toCommonJS(fallbackWebService_exports);
var import_axios = __toESM(require("axios"));
var import_paths = require("../constants/paths");
const config = {
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "de-DE",
    Accept: "*/*"
  },
  timeout: 1e4
};
const createDeveloperAccount = (adapter) => {
  adapter.log.info(
    "[createDeveloperAccount] Connecting to Zendure Developer Web API..."
  );
  const body = {
    snNumber: adapter.config.snNumber,
    account: adapter.config.userName
  };
  let paths = void 0;
  if (adapter.config.server == "eu") {
    paths = import_paths.pathsEu;
  } else {
    paths = import_paths.pathsGlobal;
  }
  return import_axios.default.post(paths.solarFlowDevRegisterUrl, JSON.stringify(body), config).then(function(response) {
    adapter.log.info("Successfully created Developer Account!");
    if (response.data && response.data.success == true) {
      return response.data.data;
    } else {
      console.warn("No Response Data!");
      return void 0;
    }
  }).catch(function(error) {
    var _a, _b, _c, _d, _e, _f;
    if (((_b = (_a = error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.code) && ((_d = (_c = error.response) == null ? void 0 : _c.data) == null ? void 0 : _d.msg)) {
      adapter.log.error(
        "Failed to created Zendure Developer Account: " + ((_f = (_e = error.response) == null ? void 0 : _e.data) == null ? void 0 : _f.code) + " - " + error.response.data.msg
      );
    }
    return Promise.reject("Failed to created Zendure Developer Account!");
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createDeveloperAccount
});
//# sourceMappingURL=fallbackWebService.js.map
