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
var Aio2400_exports = {};
__export(Aio2400_exports, {
  Aio2400: () => Aio2400
});
module.exports = __toCommonJS(Aio2400_exports);
var import_aioControlStates = require("../../constants/aioControlStates");
var import_aioStates = require("../../constants/aioStates");
var import_ZenHaDevice = require("./ZenHaDevice");
class Aio2400 extends import_ZenHaDevice.ZenHaDevice {
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails
    );
    this.maxInputLimit = 0;
    this.maxOutputLimit = 1200;
    this.states = import_aioStates.aioStates;
    this.controlStates = import_aioControlStates.aioControlStates;
  }
  async setDeviceAutomationInOutLimit(limit) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`
      );
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true && limit > 0) {
          limit = 0;
        }
        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded"
        );
        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true && limit > 0) {
          limit = 0;
        }
      }
      if (limit < 0) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] AIO 2400 can not charge by AC!`
        );
        return;
      } else {
        if (limit > this.maxOutputLimit) {
          limit = this.maxOutputLimit;
        }
      }
      if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0) {
        if (limit < 100 && limit > 90) {
          limit = 90;
        } else if (limit > 60 && limit < 90) {
          limit = 60;
        } else if (limit > 30 && limit < 60) {
          limit = 30;
        } else if (limit < 30) {
          limit = 30;
        }
      }
      this.adapter.msgCounter += 1;
      const timestamp = /* @__PURE__ */ new Date();
      timestamp.setMilliseconds(0);
      let _arguments = [];
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Using FEED IN variant of AIO device automation, as device '${this.productKey}' detected and limit is positive!`
      );
      _arguments = [
        {
          autoModelProgram: 2,
          autoModelValue: limit,
          msgType: 1,
          autoModel: 8
        }
      ];
      const deviceAutomation = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: this.adapter.msgCounter,
        deviceKey: this.deviceKey,
        timestamp: timestamp.getTime() / 1e3
      };
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.functionTopic,
        JSON.stringify(deviceAutomation)
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Aio2400
});
//# sourceMappingURL=Aio2400.js.map
