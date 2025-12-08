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
var zenWebService_exports = {};
__export(zenWebService_exports, {
  zenLogin: () => zenLogin
});
module.exports = __toCommonJS(zenWebService_exports);
var import_axios = __toESM(require("axios"));
var import_constants = require("../constants/constants");
var crypto = __toESM(require("crypto"));
const zenLogin = async (adapter) => {
  const decodedAuthCloudKey = Buffer.from(
    adapter.config.authorizationCloudKey,
    "base64"
  ).toString("utf-8");
  const lastDot = decodedAuthCloudKey.lastIndexOf(".");
  if (lastDot === -1) {
  }
  const apiUrl = decodedAuthCloudKey.slice(0, lastDot);
  const appKey = decodedAuthCloudKey.slice(lastDot + 1);
  const body = {
    appKey
  };
  const timestamp = Math.floor(Date.now() / 1e3);
  const nonce = (Math.floor(Math.random() * 9e4) + 1e4).toString();
  const signParams = {
    ...body,
    timestamp,
    nonce
  };
  const bodyStr = Object.keys(signParams).sort().map((k) => `${k}${signParams[k]}`).join("");
  const signStr = `${import_constants.haKey}${bodyStr}${import_constants.haKey}`;
  const sha1 = crypto.createHash("sha1");
  sha1.update(signStr, "utf8");
  const sign = sha1.digest("hex").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    timestamp: timestamp.toString(),
    nonce,
    clientid: "zenHa",
    sign
  };
  const config = {
    headers,
    timeout: 1e4
  };
  return import_axios.default.post(`${apiUrl}/api/ha/deviceList`, JSON.stringify(body), config).then(async function(response) {
    const data = await response.data;
    return data.data;
  }).catch(async function(error) {
    if (error.response) {
      adapter.log.error(error.response.data);
      adapter.log.error(error.response.status);
      adapter.log.error(error.response.headers);
    } else if (error.request) {
      adapter.log.error(error.request);
    } else {
      adapter.log.error("Error" + error.message);
    }
    adapter.log.error(error.config);
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  zenLogin
});
//# sourceMappingURL=zenWebService.js.map
