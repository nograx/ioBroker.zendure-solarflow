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
var processDeviceProperties_exports = {};
__export(processDeviceProperties_exports, {
  processDeviceProperties: () => processDeviceProperties
});
module.exports = __toCommonJS(processDeviceProperties_exports);
const processDeviceProperties = async (device, properties, isSolarFlow) => {
  var _a, _b, _c, _d, _e, _f;
  if ((properties == null ? void 0 : properties.autoModel) != null && (properties == null ? void 0 : properties.autoModel) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("autoModel", properties.autoModel);
    device == null ? void 0 : device.updateSolarFlowControlState("autoModel", properties.autoModel);
  }
  if ((properties == null ? void 0 : properties.heatState) != null && (properties == null ? void 0 : properties.heatState) != void 0) {
    const value = (properties == null ? void 0 : properties.heatState) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("heatState", value);
  }
  if ((properties == null ? void 0 : properties.electricLevel) != null && (properties == null ? void 0 : properties.electricLevel) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("electricLevel", properties.electricLevel);
    if (((_a = device.adapter) == null ? void 0 : _a.config.useCalculation) && properties.electricLevel == 100 && isSolarFlow) {
      device == null ? void 0 : device.setEnergyWhMax();
    }
    if (properties.electricLevel == 100) {
      const fullChargeNeeded = await device.adapter.getStateAsync(
        device.productKey + "." + device.deviceKey + ".control.fullChargeNeeded"
      );
      if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
        await ((_b = device.adapter) == null ? void 0 : _b.setState(
          `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`,
          false,
          true
        ));
      }
    }
    const minSoc = await ((_c = device.adapter) == null ? void 0 : _c.getStateAsync(
      `${device.productKey}.${device.deviceKey}.minSoc`
    ));
    if (((_d = device.adapter) == null ? void 0 : _d.config.useCalculation) && minSoc && minSoc.val && properties.electricLevel == Number(minSoc.val) && isSolarFlow) {
      device == null ? void 0 : device.setSocToZero();
    }
  }
  if ((properties == null ? void 0 : properties.packState) != null && (properties == null ? void 0 : properties.packState) != void 0) {
    const value = (properties == null ? void 0 : properties.packState) == 0 ? "Idle" : (properties == null ? void 0 : properties.packState) == 1 ? "Charging" : (properties == null ? void 0 : properties.packState) == 2 ? "Discharging" : "Unknown";
    device == null ? void 0 : device.updateSolarFlowState("packState", value);
    if (properties == null ? void 0 : properties.packState) {
      device == null ? void 0 : device.updateSolarFlowState("packPower", 0);
    }
  }
  if ((properties == null ? void 0 : properties.passMode) != null && (properties == null ? void 0 : properties.passMode) != void 0) {
    const value = (properties == null ? void 0 : properties.passMode) == 0 ? "Automatic" : (properties == null ? void 0 : properties.passMode) == 1 ? "Always off" : (properties == null ? void 0 : properties.passMode) == 2 ? "Always on" : "Unknown";
    device == null ? void 0 : device.updateSolarFlowState("passMode", value);
    device == null ? void 0 : device.updateSolarFlowControlState("passMode", properties == null ? void 0 : properties.passMode);
  }
  if ((properties == null ? void 0 : properties.pass) != null && (properties == null ? void 0 : properties.pass) != void 0) {
    const value = (properties == null ? void 0 : properties.pass) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("pass", value);
  }
  if ((properties == null ? void 0 : properties.autoRecover) != null && (properties == null ? void 0 : properties.autoRecover) != void 0) {
    const value = (properties == null ? void 0 : properties.autoRecover) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("autoRecover", value);
    device == null ? void 0 : device.updateSolarFlowControlState("autoRecover", value);
  }
  if ((properties == null ? void 0 : properties.outputHomePower) != null && (properties == null ? void 0 : properties.outputHomePower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("outputHomePower", properties.outputHomePower);
  }
  if ((properties == null ? void 0 : properties.energyPower) != null && (properties == null ? void 0 : properties.energyPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("energyPower", properties.energyPower);
  }
  if ((properties == null ? void 0 : properties.outputLimit) != null && (properties == null ? void 0 : properties.outputLimit) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("outputLimit", properties.outputLimit);
    device == null ? void 0 : device.updateSolarFlowControlState(
      "setOutputLimit",
      properties.outputLimit
    );
  }
  if ((properties == null ? void 0 : properties.smartMode) != null && (properties == null ? void 0 : properties.smartMode) != void 0) {
    const value = (properties == null ? void 0 : properties.smartMode) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("smartMode", value);
    device == null ? void 0 : device.updateSolarFlowControlState("smartMode", value);
  }
  if ((properties == null ? void 0 : properties.buzzerSwitch) != null && (properties == null ? void 0 : properties.buzzerSwitch) != void 0) {
    const value = (properties == null ? void 0 : properties.buzzerSwitch) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("buzzerSwitch", value);
    device == null ? void 0 : device.updateSolarFlowControlState("buzzerSwitch", value);
  }
  if ((properties == null ? void 0 : properties.outputPackPower) != null && (properties == null ? void 0 : properties.outputPackPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("outputPackPower", properties.outputPackPower);
    if (properties.outputPackPower > 0) {
      device == null ? void 0 : device.updateSolarFlowState("packInputPower", 0);
    }
  }
  if ((properties == null ? void 0 : properties.packInputPower) != null && (properties == null ? void 0 : properties.packInputPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("packInputPower", properties.packInputPower);
    if (properties.packInputPower > 0) {
      device == null ? void 0 : device.updateSolarFlowState("outputPackPower", 0);
    }
  }
  if ((properties == null ? void 0 : properties.solarInputPower) != null && (properties == null ? void 0 : properties.solarInputPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("solarInputPower", properties.solarInputPower);
  }
  if ((properties == null ? void 0 : properties.pvPower1) != null && (properties == null ? void 0 : properties.pvPower1) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState(
      "pvPower2",
      // Reversed to adjust like offical app
      properties.pvPower1
    );
  }
  if ((properties == null ? void 0 : properties.pvPower2) != null && (properties == null ? void 0 : properties.pvPower2) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState(
      "pvPower1",
      // Reversed to adjust like offical app
      properties.pvPower2
    );
  }
  if ((properties == null ? void 0 : properties.solarPower1) != null && (properties == null ? void 0 : properties.solarPower1) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("pvPower1", properties.solarPower1);
  }
  if ((properties == null ? void 0 : properties.solarPower2) != null && (properties == null ? void 0 : properties.solarPower2) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("pvPower2", properties.solarPower2);
  }
  if ((properties == null ? void 0 : properties.solarPower3) != null && (properties == null ? void 0 : properties.solarPower3) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("pvPower3", properties.solarPower3);
  }
  if ((properties == null ? void 0 : properties.solarPower4) != null && (properties == null ? void 0 : properties.solarPower4) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("pvPower4", properties.solarPower4);
  }
  if ((properties == null ? void 0 : properties.remainOutTime) != null && (properties == null ? void 0 : properties.remainOutTime) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("remainOutTime", properties.remainOutTime);
  }
  if ((properties == null ? void 0 : properties.remainInputTime) != null && (properties == null ? void 0 : properties.remainInputTime) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("remainInputTime", properties.remainInputTime);
  }
  if ((properties == null ? void 0 : properties.socSet) != null && (properties == null ? void 0 : properties.socSet) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("socSet", Number(properties.socSet) / 10);
    device == null ? void 0 : device.updateSolarFlowControlState(
      "chargeLimit",
      Number(properties.socSet) / 10
    );
  }
  if ((properties == null ? void 0 : properties.minSoc) != null && (properties == null ? void 0 : properties.minSoc) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("minSoc", Number(properties.minSoc) / 10);
    device == null ? void 0 : device.updateSolarFlowControlState(
      "dischargeLimit",
      Number(properties.minSoc) / 10
    );
  }
  if ((properties == null ? void 0 : properties.inputLimit) != null && (properties == null ? void 0 : properties.inputLimit) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("inputLimit", properties.inputLimit);
    device == null ? void 0 : device.updateSolarFlowControlState("setInputLimit", properties.inputLimit);
  }
  if ((properties == null ? void 0 : properties.gridInputPower) != null && (properties == null ? void 0 : properties.gridInputPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("gridInputPower", properties.gridInputPower);
  }
  if ((properties == null ? void 0 : properties.acMode) != null && (properties == null ? void 0 : properties.acMode) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("acMode", properties.acMode);
    device == null ? void 0 : device.updateSolarFlowControlState("acMode", properties.acMode);
  }
  if ((properties == null ? void 0 : properties.hyperTmp) != null && (properties == null ? void 0 : properties.hyperTmp) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("hyperTmp", properties.hyperTmp / 10 - 273.15);
  }
  if ((properties == null ? void 0 : properties.acOutputPower) != null && (properties == null ? void 0 : properties.acOutputPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("acOutputPower", properties.acOutputPower);
  }
  if ((properties == null ? void 0 : properties.gridPower) != null && (properties == null ? void 0 : properties.gridPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("gridInputPower", properties.gridPower);
  }
  if ((properties == null ? void 0 : properties.acSwitch) != null && (properties == null ? void 0 : properties.acSwitch) != void 0) {
    const value = (properties == null ? void 0 : properties.acSwitch) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("acSwitch", value);
    device == null ? void 0 : device.updateSolarFlowControlState("acSwitch", value);
  }
  if ((properties == null ? void 0 : properties.dcSwitch) != null && (properties == null ? void 0 : properties.dcSwitch) != void 0) {
    const value = (properties == null ? void 0 : properties.dcSwitch) == 0 ? false : true;
    device == null ? void 0 : device.updateSolarFlowState("dcSwitch", value);
    device == null ? void 0 : device.updateSolarFlowControlState("dcSwitch", value);
  }
  if ((properties == null ? void 0 : properties.dcOutputPower) != null && (properties == null ? void 0 : properties.dcOutputPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("dcOutputPower", properties.dcOutputPower);
  }
  if ((properties == null ? void 0 : properties.pvBrand) != null && (properties == null ? void 0 : properties.pvBrand) != void 0) {
    const value = (properties == null ? void 0 : properties.pvBrand) == 0 ? "Others" : (properties == null ? void 0 : properties.pvBrand) == 1 ? "Hoymiles" : (properties == null ? void 0 : properties.pvBrand) == 2 ? "Enphase" : (properties == null ? void 0 : properties.pvBrand) == 3 ? "APSystems" : (properties == null ? void 0 : properties.pvBrand) == 4 ? "Anker" : (properties == null ? void 0 : properties.pvBrand) == 5 ? "Deye" : (properties == null ? void 0 : properties.pvBrand) == 6 ? "Bosswerk" : "Unknown";
    device == null ? void 0 : device.updateSolarFlowState("pvBrand", value);
  }
  if ((properties == null ? void 0 : properties.inverseMaxPower) != null && (properties == null ? void 0 : properties.inverseMaxPower) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("inverseMaxPower", properties.inverseMaxPower);
  }
  if ((properties == null ? void 0 : properties.wifiState) != null && (properties == null ? void 0 : properties.wifiState) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState(
      "wifiState",
      properties.wifiState == 1 ? "Connected" : "Disconnected"
    );
  }
  if ((properties == null ? void 0 : properties.packNum) != null && (properties == null ? void 0 : properties.packNum) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("packNum", properties.packNum);
  }
  if ((properties == null ? void 0 : properties.hubState) != null && (properties == null ? void 0 : properties.hubState) != void 0) {
    device == null ? void 0 : device.updateSolarFlowState("hubState", properties.hubState);
    device == null ? void 0 : device.updateSolarFlowControlState("hubState", properties.hubState);
  }
  if ((properties == null ? void 0 : properties.outputPackPower) != null && (properties == null ? void 0 : properties.outputPackPower) != void 0 || (properties == null ? void 0 : properties.packInputPower) != null && (properties == null ? void 0 : properties.packInputPower) != void 0) {
    let outputPower = 0;
    let inputPower = 0;
    if ((properties == null ? void 0 : properties.outputPackPower) != null && (properties == null ? void 0 : properties.outputPackPower) != void 0) {
      outputPower = properties.outputPackPower;
    } else {
      const outputPackPowerState = await ((_e = device.adapter) == null ? void 0 : _e.getStateAsync(
        device.productKey + "." + device.deviceKey + ".outputPackPower"
      ));
      outputPower = (outputPackPowerState == null ? void 0 : outputPackPowerState.val) || 0;
    }
    if ((properties == null ? void 0 : properties.packInputPower) != null && (properties == null ? void 0 : properties.packInputPower) != void 0) {
      inputPower = properties.packInputPower;
    } else {
      const packInputPowerState = await ((_f = device.adapter) == null ? void 0 : _f.getStateAsync(
        device.productKey + "." + device.deviceKey + ".packInputPower"
      ));
      inputPower = (packInputPowerState == null ? void 0 : packInputPowerState.val) || 0;
    }
    const netPower = outputPower - inputPower;
    device == null ? void 0 : device.updateSolarFlowState("packPower", netPower);
  }
  if (properties && device.adapter.log.level == "debug") {
    let found = false;
    Object.entries(properties).forEach(([key, value]) => {
      var _a2;
      device == null ? void 0 : device.states.forEach((state) => {
        if (state.title == key) {
          found = true;
        }
      });
      if (found) {
      } else {
        (_a2 = device.adapter) == null ? void 0 : _a2.log.debug(
          `[onMessage] ${device == null ? void 0 : device.deviceKey}: ${key} with value ${JSON.stringify(value)} is a UNKNOWN Mqtt Property!`
        );
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processDeviceProperties
});
//# sourceMappingURL=processDeviceProperties.js.map
