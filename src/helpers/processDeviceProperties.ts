import { ZenIobDevice } from "../models/deviceModels/ZenIobDevice";
import { ISolarFlowMqttProperties } from "../models/ISolarFlowMqttProperties";
import { ISolarflowState } from "../models/ISolarflowState";

export const processDeviceProperties = async (
  device: ZenIobDevice,
  properties: ISolarFlowMqttProperties,
  isSolarFlow: boolean,
): Promise<void> => {
  if (properties?.autoModel != null && properties?.autoModel != undefined) {
    device?.updateSolarFlowState("autoModel", properties.autoModel);

    device?.updateSolarFlowControlState("autoModel", properties.autoModel);
  }

  if (properties?.heatState != null && properties?.heatState != undefined) {
    const value = properties?.heatState == 0 ? false : true;

    device?.updateSolarFlowState("heatState", value);
  }

  if (
    properties?.electricLevel != null &&
    properties?.electricLevel != undefined
  ) {
    device?.updateSolarFlowState("electricLevel", properties.electricLevel);

    if (
      device.adapter?.config.useCalculation &&
      properties.electricLevel == 100 &&
      isSolarFlow
    ) {
      device?.setEnergyWhMax();
    }

    if (properties.electricLevel == 100) {
      const fullChargeNeeded = await device.adapter.getStateAsync(
        device.productKey +
          "." +
          device.deviceKey +
          ".control.fullChargeNeeded",
      );

      if (
        fullChargeNeeded &&
        fullChargeNeeded.val &&
        fullChargeNeeded.val == true
      ) {
        await device.adapter?.setState(
          `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`,
          false,
          true,
        );
      }
    }

    // if minSoc is reached, set the calculated soc to 0
    const minSoc = await device.adapter?.getStateAsync(
      `${device.productKey}.${device.deviceKey}.minSoc`,
    );
    if (
      device.adapter?.config.useCalculation &&
      minSoc &&
      minSoc.val &&
      properties.electricLevel == Number(minSoc.val) &&
      isSolarFlow
    ) {
      device?.setSocToZero();
    }
  }

  /*
  if (properties.power != null && obj.power != undefined) {
    const value = obj.power / 10;
    device?.updateSolarFlowState("power", value);
  }*/

  if (properties?.packState != null && properties?.packState != undefined) {
    const value =
      properties?.packState == 0
        ? "Idle"
        : properties?.packState == 1
          ? "Charging"
          : properties?.packState == 2
            ? "Discharging"
            : "Unknown";
    device?.updateSolarFlowState("packState", value);
  }

  if (properties?.passMode != null && properties?.passMode != undefined) {
    const value =
      properties?.passMode == 0
        ? "Automatic"
        : properties?.passMode == 1
          ? "Always off"
          : properties?.passMode == 2
            ? "Always on"
            : "Unknown";
    device?.updateSolarFlowState("passMode", value);

    device?.updateSolarFlowControlState("passMode", properties?.passMode);
  }

  if (properties?.pass != null && properties?.pass != undefined) {
    const value = properties?.pass == 0 ? false : true;

    device?.updateSolarFlowState("pass", value);
  }

  if (properties?.autoRecover != null && properties?.autoRecover != undefined) {
    const value = properties?.autoRecover == 0 ? false : true;

    device?.updateSolarFlowState("autoRecover", value);

    device?.updateSolarFlowControlState("autoRecover", value);
  }

  if (
    properties?.outputHomePower != null &&
    properties?.outputHomePower != undefined
  ) {
    device?.updateSolarFlowState("outputHomePower", properties.outputHomePower);
  }

  if (properties?.energyPower != null && properties?.energyPower != undefined) {
    device?.updateSolarFlowState("energyPower", properties.energyPower);
  }

  if (properties?.outputLimit != null && properties?.outputLimit != undefined) {
    device?.updateSolarFlowState("outputLimit", properties.outputLimit);

    device?.updateSolarFlowControlState(
      "setOutputLimit",
      properties.outputLimit,
    );
  }

  if (properties?.smartMode != null && properties?.smartMode != undefined) {
    const value = properties?.smartMode == 0 ? false : true;

    device?.updateSolarFlowState("smartMode", value);

    device?.updateSolarFlowControlState("smartMode", value);
  }

  if (
    properties?.buzzerSwitch != null &&
    properties?.buzzerSwitch != undefined
  ) {
    const value = properties?.buzzerSwitch == 0 ? false : true;

    device?.updateSolarFlowState("buzzerSwitch", value);

    device?.updateSolarFlowControlState("buzzerSwitch", value);
  }

  if (
    properties?.outputPackPower != null &&
    properties?.outputPackPower != undefined
  ) {
    device?.updateSolarFlowState("outputPackPower", properties.outputPackPower);

    // if outPutPackPower is not 0 set packInputPower to 0
    if (properties.outputPackPower > 0) {
      device?.updateSolarFlowState("packInputPower", 0);
    }
  }

  if (
    properties?.packInputPower != null &&
    properties?.packInputPower != undefined
  ) {
    device?.updateSolarFlowState("packInputPower", properties.packInputPower);

    // if packInputPower is not 0 set outputPackPower to 0
    if (properties.packInputPower > 0) {
      device?.updateSolarFlowState("outputPackPower", 0);
    }
  }

  if (
    properties?.solarInputPower != null &&
    properties?.solarInputPower != undefined
  ) {
    device?.updateSolarFlowState("solarInputPower", properties.solarInputPower);
  }

  if (properties?.pvPower1 != null && properties?.pvPower1 != undefined) {
    device?.updateSolarFlowState(
      "pvPower2", // Reversed to adjust like offical app
      properties.pvPower1,
    );
  }

  if (properties?.pvPower2 != null && properties?.pvPower2 != undefined) {
    device?.updateSolarFlowState(
      "pvPower1", // Reversed to adjust like offical app
      properties.pvPower2,
    );
  }

  if (properties?.solarPower1 != null && properties?.solarPower1 != undefined) {
    device?.updateSolarFlowState("pvPower1", properties.solarPower1);
  }

  if (properties?.solarPower2 != null && properties?.solarPower2 != undefined) {
    device?.updateSolarFlowState("pvPower2", properties.solarPower2);
  }

  if (properties?.solarPower3 != null && properties?.solarPower3 != undefined) {
    device?.updateSolarFlowState("pvPower3", properties.solarPower3);
  }

  if (properties?.solarPower4 != null && properties?.solarPower4 != undefined) {
    device?.updateSolarFlowState("pvPower4", properties.solarPower4);
  }

  if (
    properties?.remainOutTime != null &&
    properties?.remainOutTime != undefined
  ) {
    device?.updateSolarFlowState("remainOutTime", properties.remainOutTime);
  }

  if (
    properties?.remainInputTime != null &&
    properties?.remainInputTime != undefined
  ) {
    device?.updateSolarFlowState("remainInputTime", properties.remainInputTime);
  }

  if (properties?.socSet != null && properties?.socSet != undefined) {
    device?.updateSolarFlowState("socSet", Number(properties.socSet) / 10);

    device?.updateSolarFlowControlState(
      "chargeLimit",
      Number(properties.socSet) / 10,
    );
  }

  if (properties?.minSoc != null && properties?.minSoc != undefined) {
    device?.updateSolarFlowState("minSoc", Number(properties.minSoc) / 10);

    device?.updateSolarFlowControlState(
      "dischargeLimit",
      Number(properties.minSoc) / 10,
    );
  }

  if (properties?.inputLimit != null && properties?.inputLimit != undefined) {
    device?.updateSolarFlowState("inputLimit", properties.inputLimit);

    device?.updateSolarFlowControlState("setInputLimit", properties.inputLimit);
  }

  if (
    properties?.gridInputPower != null &&
    properties?.gridInputPower != undefined
  ) {
    device?.updateSolarFlowState("gridInputPower", properties.gridInputPower);
  }

  if (properties?.acMode != null && properties?.acMode != undefined) {
    device?.updateSolarFlowState("acMode", properties.acMode);

    device?.updateSolarFlowControlState("acMode", properties.acMode);
  }

  if (properties?.hyperTmp != null && properties?.hyperTmp != undefined) {
    device?.updateSolarFlowState("hyperTmp", properties.hyperTmp / 10 - 273.15);
  }

  if (
    properties?.acOutputPower != null &&
    properties?.acOutputPower != undefined
  ) {
    device?.updateSolarFlowState("acOutputPower", properties.acOutputPower);
  }

  if (properties?.gridPower != null && properties?.gridPower != undefined) {
    device?.updateSolarFlowState("gridInputPower", properties.gridPower);
  }

  if (properties?.acSwitch != null && properties?.acSwitch != undefined) {
    const value = properties?.acSwitch == 0 ? false : true;

    device?.updateSolarFlowState("acSwitch", value);

    device?.updateSolarFlowControlState("acSwitch", value);
  }

  if (properties?.dcSwitch != null && properties?.dcSwitch != undefined) {
    const value = properties?.dcSwitch == 0 ? false : true;

    device?.updateSolarFlowState("dcSwitch", value);

    device?.updateSolarFlowControlState("dcSwitch", value);
  }

  if (
    properties?.dcOutputPower != null &&
    properties?.dcOutputPower != undefined
  ) {
    device?.updateSolarFlowState("dcOutputPower", properties.dcOutputPower);
  }

  if (properties?.pvBrand != null && properties?.pvBrand != undefined) {
    const value =
      properties?.pvBrand == 0
        ? "Others"
        : properties?.pvBrand == 1
          ? "Hoymiles"
          : properties?.pvBrand == 2
            ? "Enphase"
            : properties?.pvBrand == 3
              ? "APSystems"
              : properties?.pvBrand == 4
                ? "Anker"
                : properties?.pvBrand == 5
                  ? "Deye"
                  : properties?.pvBrand == 6
                    ? "Bosswerk"
                    : "Unknown";
    device?.updateSolarFlowState("pvBrand", value);
  }

  if (
    properties?.inverseMaxPower != null &&
    properties?.inverseMaxPower != undefined
  ) {
    device?.updateSolarFlowState("inverseMaxPower", properties.inverseMaxPower);
  }

  if (properties?.wifiState != null && properties?.wifiState != undefined) {
    device?.updateSolarFlowState(
      "wifiState",
      properties.wifiState == 1 ? "Connected" : "Disconnected",
    );
  }

  if (properties?.packNum != null && properties?.packNum != undefined) {
    device?.updateSolarFlowState("packNum", properties.packNum);
  }

  if (properties?.hubState != null && properties?.hubState != undefined) {
    device?.updateSolarFlowState("hubState", properties.hubState);

    device?.updateSolarFlowControlState("hubState", properties.hubState);
  }

  // Calculate packPower based on current outputPackPower and packInputPower values
  if (
    (properties?.outputPackPower != null &&
      properties?.outputPackPower != undefined) ||
    (properties?.packInputPower != null &&
      properties?.packInputPower != undefined)
  ) {
    // Use properties values if available, otherwise get current state values
    let outputPower = 0;
    let inputPower = 0;

    if (
      properties?.outputPackPower != null &&
      properties?.outputPackPower != undefined
    ) {
      outputPower = properties.outputPackPower;
    } else {
      const outputPackPowerState = await device.adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".outputPackPower",
      );
      outputPower = (outputPackPowerState?.val as number) || 0;
    }

    if (
      properties?.packInputPower != null &&
      properties?.packInputPower != undefined
    ) {
      inputPower = properties.packInputPower;
    } else {
      const packInputPowerState = await device.adapter?.getStateAsync(
        device.productKey + "." + device.deviceKey + ".packInputPower",
      );
      inputPower = (packInputPowerState?.val as number) || 0;
    }

    // Calculate net power: positive for discharge, negative for charge
    const netPower = outputPower - inputPower;

    device?.updateSolarFlowState("packPower", netPower);
  }

  if (properties && device.adapter.log.level == "debug") {
    let found = false;

    Object.entries(properties).forEach(([key, value]) => {
      device?.states.forEach((state: ISolarflowState) => {
        if (state.title == key) {
          found = true;
        }
      });

      if (found) {
        //console.log(
        //  `${productName?.val}: ${key} with value ${value} is a KNOWN Mqtt Prop!`
        //);
      } else {
        device.adapter?.log.debug(
          `[onMessage] ${device?.deviceKey}: ${key} with value ${JSON.stringify(value)} is a UNKNOWN Mqtt Property!`,
        );
      }
    });
  }
};
