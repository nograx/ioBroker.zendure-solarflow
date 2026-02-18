/* eslint-disable @typescript-eslint/indent */
import { ZendureSolarflow } from "../main";

import { IMqttData } from "../models/ISolarFlowMqttProperties";
import { ISolarflowState } from "../models/ISolarflowState";

export let adapter: ZendureSolarflow | undefined = undefined;

export const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh",
  "power",
  "batcur",
];

export const initAdapter = (_adapter: ZendureSolarflow): boolean => {
  adapter = _adapter;

  adapter.log.debug("[initAdapter] Init adapter in mqttSharedService!");

  return true;
};

export const onMessage = async (
  topic: string,
  message: Buffer,
): Promise<void> => {
  if (adapter) {
    if (topic.toLowerCase().includes("loginOut/force")) {
      // TODO: Ausloggen???
    }

    const topicSplitted = topic.replace("/server/app", "").split("/");
    const productKey = topicSplitted[1];
    const deviceKey = topicSplitted[2];

    let obj: IMqttData = {};
    try {
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[onMessage] JSON Parse error!`);

      adapter.log.debug(`[onMessage] JSON Parse error: ${txt}!`);
    }

    let isSolarFlow = false;

    const _device = adapter?.zenHaDeviceList.find(
      (x) => x.deviceKey == deviceKey,
    );

    if (!_device) {
      adapter.log.error(
        `[onMessage] DeviceKey '${deviceKey} not found in device list!'}`,
      );
    }

    if (adapter.log.level == "debug") {
      adapter.log.debug(
        `[onMessage] MQTT message on topic '${topic}': ${message.toString()}`,
      );
    }

    /*     if (obj.timestamp) {
      const currentTimeStamp = new Date().getTime() / 1000;
      const diff = currentTimeStamp - obj.timestamp;

      if (diff > 600) {
        // Timestamp older than 5 Minutens, device is offline!
        _device?.updateSolarFlowState("wifiState", "Disconnected");
      } else {
        // Timestamp older than 5 Minutens, device is offline!
        _device?.updateSolarFlowState("wifiState", "Connected");
      }
    } */

    // Check if device is an solarflow or hyper device. Don't use LowVoltageBlock on an ACE device?
    if (productKey != "8bM93H") {
      isSolarFlow = true;
    }

    //
    if (obj.function == "deviceAutomation" && obj.success == 1) {
      // setDeviceAutomationInOutLimit ack = true setzen;
      const currentValue = await adapter.getStateAsync(
        productKey + "." + deviceKey + ".control.setDeviceAutomationInOutLimit",
      );

      _device?.updateSolarFlowControlState(
        "setDeviceAutomationInOutLimit",
        currentValue?.val ? currentValue.val : 0,
      );
    } else if (obj.function == "deviceAutomation" && obj.success == 0) {
      adapter?.log.warn(
        `[onMessage] device automation failed for ${_device?.productName}: ${productKey}/${deviceKey}!`,
      );
    }

    if (
      obj.properties?.autoModel != null &&
      obj.properties?.autoModel != undefined
    ) {
      _device?.updateSolarFlowState("autoModel", obj.properties.autoModel);

      _device?.updateSolarFlowControlState(
        "autoModel",
        obj.properties.autoModel,
      );
    }

    if (
      obj.properties?.heatState != null &&
      obj.properties?.heatState != undefined
    ) {
      const value = obj.properties?.heatState == 0 ? false : true;

      _device?.updateSolarFlowState("heatState", value);
    }

    if (
      obj.properties?.electricLevel != null &&
      obj.properties?.electricLevel != undefined
    ) {
      _device?.updateSolarFlowState(
        "electricLevel",
        obj.properties.electricLevel,
      );

      if (
        adapter?.config.useCalculation &&
        obj.properties.electricLevel == 100 &&
        isSolarFlow
      ) {
        _device?.setEnergyWhMax();
      }

      if (obj.properties.electricLevel == 100) {
        const fullChargeNeeded = await adapter.getStateAsync(
          productKey + "." + deviceKey + ".control.fullChargeNeeded",
        );

        if (
          fullChargeNeeded &&
          fullChargeNeeded.val &&
          fullChargeNeeded.val == true
        ) {
          await adapter?.setState(
            `${productKey}.${deviceKey}.control.fullChargeNeeded`,
            false,
            true,
          );
        }
      }

      // if minSoc is reached, set the calculated soc to 0
      const minSoc = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.minSoc`,
      );
      if (
        adapter?.config.useCalculation &&
        minSoc &&
        minSoc.val &&
        obj.properties.electricLevel == Number(minSoc.val) &&
        isSolarFlow
      ) {
        _device?.setSocToZero();
      }
    }

    if (obj.power != null && obj.power != undefined) {
      const value = obj.power / 10;
      _device?.updateSolarFlowState("power", value);
    }

    if (
      obj.properties?.packState != null &&
      obj.properties?.packState != undefined
    ) {
      const value =
        obj.properties?.packState == 0
          ? "Idle"
          : obj.properties?.packState == 1
            ? "Charging"
            : obj.properties?.packState == 2
              ? "Discharging"
              : "Unknown";
      _device?.updateSolarFlowState("packState", value);

      if (obj.properties?.packState) {
        // Update combined data point
        _device?.updateSolarFlowState("packPower", 0);
      }
    }

    if (
      obj.properties?.passMode != null &&
      obj.properties?.passMode != undefined
    ) {
      const value =
        obj.properties?.passMode == 0
          ? "Automatic"
          : obj.properties?.passMode == 1
            ? "Always off"
            : obj.properties?.passMode == 2
              ? "Always on"
              : "Unknown";
      _device?.updateSolarFlowState("passMode", value);

      _device?.updateSolarFlowControlState(
        "passMode",
        obj.properties?.passMode,
      );
    }

    if (obj.properties?.pass != null && obj.properties?.pass != undefined) {
      const value = obj.properties?.pass == 0 ? false : true;

      _device?.updateSolarFlowState("pass", value);
    }

    if (
      obj.properties?.autoRecover != null &&
      obj.properties?.autoRecover != undefined
    ) {
      const value = obj.properties?.autoRecover == 0 ? false : true;

      _device?.updateSolarFlowState("autoRecover", value);

      _device?.updateSolarFlowControlState("autoRecover", value);
    }

    if (
      obj.properties?.outputHomePower != null &&
      obj.properties?.outputHomePower != undefined
    ) {
      _device?.updateSolarFlowState(
        "outputHomePower",
        obj.properties.outputHomePower,
      );
    }

    if (
      obj.properties?.energyPower != null &&
      obj.properties?.energyPower != undefined
    ) {
      _device?.updateSolarFlowState("energyPower", obj.properties.energyPower);
    }

    if (
      obj.properties?.outputLimit != null &&
      obj.properties?.outputLimit != undefined
    ) {
      _device?.updateSolarFlowState("outputLimit", obj.properties.outputLimit);

      _device?.updateSolarFlowControlState(
        "setOutputLimit",
        obj.properties.outputLimit,
      );
    }

    if (
      obj.properties?.smartMode != null &&
      obj.properties?.smartMode != undefined
    ) {
      const value = obj.properties?.smartMode == 0 ? false : true;

      _device?.updateSolarFlowState("smartMode", value);

      _device?.updateSolarFlowControlState("smartMode", value);
    }

    if (
      obj.properties?.buzzerSwitch != null &&
      obj.properties?.buzzerSwitch != undefined
    ) {
      const value = obj.properties?.buzzerSwitch == 0 ? false : true;

      _device?.updateSolarFlowState("buzzerSwitch", value);

      _device?.updateSolarFlowControlState("buzzerSwitch", value);
    }

    if (
      obj.properties?.outputPackPower != null &&
      obj.properties?.outputPackPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "outputPackPower",
        obj.properties.outputPackPower,
      );

      if (obj.properties?.outputPackPower > 0) {
        // Update combined data point
        _device?.updateSolarFlowState(
          "packPower",
          obj.properties.outputPackPower,
        );
      } else if (obj.properties?.outputPackPower == 0) {
        // Check if packInputPower is 0
        const packInputPower = await adapter?.getStateAsync(
          productKey + "." + deviceKey + ".packInputPower",
        );

        if (packInputPower?.val == 0) {
          // Update combined data point to 0 as both are 0
          _device?.updateSolarFlowState(
            "packPower",
            -Math.abs(obj.properties.outputPackPower),
          );
        }
      }

      // if outPutPackPower set packInputPower to 0
      _device?.updateSolarFlowState("packInputPower", 0);
    }

    if (
      obj.properties?.packInputPower != null &&
      obj.properties?.packInputPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "packInputPower",
        obj.properties.packInputPower,
      );

      if (obj.properties?.packInputPower > 0) {
        // Update combined data point
        _device?.updateSolarFlowState(
          "packPower",
          -Math.abs(obj.properties.packInputPower),
        );
      } else if (obj.properties?.packInputPower == 0) {
        // Check if outputPackPower is 0
        const outputPackPower = await adapter?.getStateAsync(
          productKey + "." + deviceKey + ".outputPackPower",
        );

        if (outputPackPower?.val == 0) {
          // Update combined data point to 0 as both are 0
          _device?.updateSolarFlowState(
            "packPower",
            -Math.abs(obj.properties.packInputPower),
          );
        }
      }

      // if packInputPower set outputPackPower to 0
      _device?.updateSolarFlowState("outputPackPower", 0);
    }

    if (
      obj.properties?.solarInputPower != null &&
      obj.properties?.solarInputPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "solarInputPower",
        obj.properties.solarInputPower,
      );
    }

    if (
      obj.properties?.pvPower1 != null &&
      obj.properties?.pvPower1 != undefined
    ) {
      _device?.updateSolarFlowState(
        "pvPower2", // Reversed to adjust like offical app
        obj.properties.pvPower1,
      );
    }

    if (
      obj.properties?.pvPower2 != null &&
      obj.properties?.pvPower2 != undefined
    ) {
      _device?.updateSolarFlowState(
        "pvPower1", // Reversed to adjust like offical app
        obj.properties.pvPower2,
      );
    }

    if (
      obj.properties?.solarPower1 != null &&
      obj.properties?.solarPower1 != undefined
    ) {
      _device?.updateSolarFlowState("pvPower1", obj.properties.solarPower1);
    }

    if (
      obj.properties?.solarPower2 != null &&
      obj.properties?.solarPower2 != undefined
    ) {
      _device?.updateSolarFlowState("pvPower2", obj.properties.solarPower2);
    }

    if (
      obj.properties?.solarPower3 != null &&
      obj.properties?.solarPower3 != undefined
    ) {
      _device?.updateSolarFlowState("pvPower3", obj.properties.solarPower3);
    }

    if (
      obj.properties?.solarPower4 != null &&
      obj.properties?.solarPower4 != undefined
    ) {
      _device?.updateSolarFlowState("pvPower4", obj.properties.solarPower4);
    }

    if (
      obj.properties?.remainOutTime != null &&
      obj.properties?.remainOutTime != undefined
    ) {
      _device?.updateSolarFlowState(
        "remainOutTime",
        obj.properties.remainOutTime,
      );
    }

    if (
      obj.properties?.remainInputTime != null &&
      obj.properties?.remainInputTime != undefined
    ) {
      _device?.updateSolarFlowState(
        "remainInputTime",
        obj.properties.remainInputTime,
      );
    }

    if (obj.properties?.socSet != null && obj.properties?.socSet != undefined) {
      _device?.updateSolarFlowState(
        "socSet",
        Number(obj.properties.socSet) / 10,
      );

      _device?.updateSolarFlowControlState(
        "chargeLimit",
        Number(obj.properties.socSet) / 10,
      );
    }

    if (obj.properties?.minSoc != null && obj.properties?.minSoc != undefined) {
      _device?.updateSolarFlowState(
        "minSoc",
        Number(obj.properties.minSoc) / 10,
      );

      _device?.updateSolarFlowControlState(
        "dischargeLimit",
        Number(obj.properties.minSoc) / 10,
      );
    }

    if (
      obj.properties?.inputLimit != null &&
      obj.properties?.inputLimit != undefined
    ) {
      _device?.updateSolarFlowState("inputLimit", obj.properties.inputLimit);

      _device?.updateSolarFlowControlState(
        "setInputLimit",
        obj.properties.inputLimit,
      );
    }

    if (
      obj.properties?.gridInputPower != null &&
      obj.properties?.gridInputPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "gridInputPower",
        obj.properties.gridInputPower,
      );
    }

    if (obj.properties?.acMode != null && obj.properties?.acMode != undefined) {
      _device?.updateSolarFlowState("acMode", obj.properties.acMode);

      _device?.updateSolarFlowControlState("acMode", obj.properties.acMode);
    }

    if (
      obj.properties?.hyperTmp != null &&
      obj.properties?.hyperTmp != undefined
    ) {
      _device?.updateSolarFlowState(
        "hyperTmp",
        obj.properties.hyperTmp / 10 - 273.15,
      );
    }

    if (
      obj.properties?.acOutputPower != null &&
      obj.properties?.acOutputPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "acOutputPower",
        obj.properties.acOutputPower,
      );
    }

    if (
      obj.properties?.gridPower != null &&
      obj.properties?.gridPower != undefined
    ) {
      _device?.updateSolarFlowState("gridInputPower", obj.properties.gridPower);
    }

    if (
      obj.properties?.acSwitch != null &&
      obj.properties?.acSwitch != undefined
    ) {
      const value = obj.properties?.acSwitch == 0 ? false : true;

      _device?.updateSolarFlowState("acSwitch", value);

      _device?.updateSolarFlowControlState("acSwitch", value);
    }

    if (
      obj.properties?.dcSwitch != null &&
      obj.properties?.dcSwitch != undefined
    ) {
      const value = obj.properties?.dcSwitch == 0 ? false : true;

      _device?.updateSolarFlowState("dcSwitch", value);

      _device?.updateSolarFlowControlState("dcSwitch", value);
    }

    if (
      obj.properties?.dcOutputPower != null &&
      obj.properties?.dcOutputPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "dcOutputPower",
        obj.properties.dcOutputPower,
      );
    }

    if (
      obj.properties?.pvBrand != null &&
      obj.properties?.pvBrand != undefined
    ) {
      const value =
        obj.properties?.pvBrand == 0
          ? "Others"
          : obj.properties?.pvBrand == 1
            ? "Hoymiles"
            : obj.properties?.pvBrand == 2
              ? "Enphase"
              : obj.properties?.pvBrand == 3
                ? "APSystems"
                : obj.properties?.pvBrand == 4
                  ? "Anker"
                  : obj.properties?.pvBrand == 5
                    ? "Deye"
                    : obj.properties?.pvBrand == 6
                      ? "Bosswerk"
                      : "Unknown";
      _device?.updateSolarFlowState("pvBrand", value);
    }

    if (
      obj.properties?.inverseMaxPower != null &&
      obj.properties?.inverseMaxPower != undefined
    ) {
      _device?.updateSolarFlowState(
        "inverseMaxPower",
        obj.properties.inverseMaxPower,
      );
    }

    if (
      obj.properties?.wifiState != null &&
      obj.properties?.wifiState != undefined
    ) {
      _device?.updateSolarFlowState(
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected",
      );
    }

    if (
      obj.properties?.packNum != null &&
      obj.properties?.packNum != undefined
    ) {
      _device?.updateSolarFlowState("packNum", obj.properties.packNum);
    }

    if (
      obj.properties?.hubState != null &&
      obj.properties?.hubState != undefined
    ) {
      _device?.updateSolarFlowState("hubState", obj.properties.hubState);

      _device?.updateSolarFlowControlState("hubState", obj.properties.hubState);
    }

    if (obj.packData) {
      _device?.addOrUpdatePackData(obj.packData, isSolarFlow);
    }

    if (obj.properties && adapter.log.level == "debug") {
      let found = false;

      Object.entries(obj.properties).forEach(([key, value]) => {
        _device?.states.forEach((state: ISolarflowState) => {
          if (state.title == key) {
            found = true;
          }
        });

        if (found) {
          //console.log(
          //  `${productName?.val}: ${key} with value ${value} is a KNOWN Mqtt Prop!`
          //);
        } else {
          adapter?.log.debug(
            `[onMessage] ${_device?.deviceKey}: ${key} with value ${JSON.stringify(value)} is a UNKNOWN Mqtt Property!`,
          );
        }
      });
    }
  }
};

export const onConnected = (): void => {
  if (adapter) {
    adapter.lastLogin = new Date();
    adapter.setState("info.connection", true, true);
    adapter.log.info("[onConnected] Connected with MQTT!");
  }
};

export const onDisconnected = (): void => {
  if (adapter) {
    adapter.lastLogin = new Date();
    adapter.setState("info.connection", false, true);
    adapter.log.info("[onDisconnected] Disconnected from MQTT!");
  }
};

export const onError = (error: any): void => {
  if (adapter) {
    adapter.setState("info.connection", false, true);
    adapter.log.error("Connection to MQTT failed! Error: " + error);
  }
};

export const onSubscribeReportTopic: any = (error: Error | null) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter?.log.debug("Subscription of Report Topic successful!");
  }
};

export const onSubscribeIotTopic: any = (
  error: Error | null,
  productKey: string,
  deviceKey: string,
) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else if (adapter) {
    adapter?.log.debug("Subscription of IOT Topic successful!");

    const _device = adapter.zenHaDeviceList.find(
      (x) => x.productKey == productKey && x.deviceKey == deviceKey,
    );

    if (_device) {
      _device.triggerFullTelemetryUpdate();
    }
  }
};
