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
var fileHelper_exports = {};
__export(fileHelper_exports, {
  FileHelper: () => FileHelper
});
module.exports = __toCommonJS(fileHelper_exports);
class FileHelper {
  adapter;
  fileNamespaceReady;
  constructor(_adapter) {
    this.adapter = _adapter;
  }
  get fileNamespace() {
    var _a;
    return `${(_a = this.adapter) == null ? void 0 : _a.name}.admin`;
  }
  // Some objects DB backends (e.g. Redis) require the target namespace to already exist as a "meta"
  // object before readFile/writeFile can be used, unlike the default jsonl/file backend which does not.
  ensureFileNamespaceExists() {
    var _a, _b;
    if (!this.fileNamespaceReady) {
      this.fileNamespaceReady = ((_b = (_a = this.adapter) == null ? void 0 : _a.setObjectNotExistsAsync(this.fileNamespace, {
        type: "meta",
        common: {
          name: "Zendure Solarflow files",
          type: "meta.folder"
        },
        native: {}
      })) != null ? _b : Promise.resolve()).then(() => void 0);
    }
    return this.fileNamespaceReady;
  }
  async readDeviceListFromFile() {
    await this.ensureFileNamespaceExists();
    return new Promise((resolve, reject) => {
      var _a;
      (_a = this.adapter) == null ? void 0 : _a.readFile(this.fileNamespace, "deviceList.json", (err, data) => {
        var _a2;
        if (err) {
          (_a2 = this.adapter) == null ? void 0 : _a2.log.error(`[onReady] Error reading device list from file: ${err.message}`);
          reject(err);
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (parseErr) {
            reject(parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
          }
        }
      });
    });
  }
  async writeDeviceListToFile(deviceList) {
    var _a;
    await this.ensureFileNamespaceExists();
    (_a = this.adapter) == null ? void 0 : _a.writeFile(this.fileNamespace, "deviceList.json", JSON.stringify(deviceList, null, 2), (err) => {
      var _a2, _b;
      if (err) {
        (_a2 = this.adapter) == null ? void 0 : _a2.log.error(`[onReady] Error saving device list to file: ${err.message}`);
      } else {
        (_b = this.adapter) == null ? void 0 : _b.log.debug("[onReady] Device list saved to file 'deviceList.json'");
      }
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileHelper
});
//# sourceMappingURL=fileHelper.js.map
