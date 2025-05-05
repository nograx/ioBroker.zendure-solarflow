/* eslint-disable @typescript-eslint/indent */
import * as mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import {
  checkVoltage,
  updateSolarFlowControlState,
  updateSolarFlowState,
} from "./adapterService";
import { IPackData } from "../models/IPackData";
import { setEnergyWhMax, setSocToZero } from "./calculationService";
import { IMqttData } from "../models/ISolarFlowMqttProperties";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startResetValuesJob,
} from "./jobSchedule";
import { createSolarFlowLocalStates } from "../helpers/createSolarFlowLocalStates";
import { ISolarflowState } from "../models/ISolarflowState";
import { getStateDefinition } from "../helpers/createSolarFlowStates";

let adapter: ZendureSolarflow | undefined = undefined;

const knownPackDataProperties = [
  "sn",
  "totalVol",
  "maxVol",
  "minVol",
  "socLevel",
  "maxTemp",
  "soh",
];

export const addOrUpdatePackData = async (
  productKey: string,
  deviceKey: string,
  packData: IPackData[],
  isSolarFlow: boolean
): Promise<void> => {
  if (adapter && productKey && deviceKey) {
    await packData.forEach(async (x) => {
      // Process data only with a serial id!
      if (x.sn && adapter) {
        // Create channel (e.g. the device specific key)
        // We can determine the type of the battery by the SN number.
        let batType = "";
        if (productKey == "yWF7hV") {
          batType = "AIO2400";
        } else if (x.sn.startsWith("C")) {
          if (x.sn[3] == "F") {
            // It's a AB2000S
            batType = "AB2000S";
          } else {
            // It's a AB2000
            batType = "AB2000";
          }
        } else if (x.sn.startsWith("A")) {
          // It's a AB1000
          batType = "AB1000";
        }

        // Check if is in Pack2device list
        if (
          !adapter.pack2Devices.some(
            (y) => y.packSn == x.sn && y.deviceKey == deviceKey
          )
        ) {
          adapter.pack2Devices.push({
            packSn: x.sn,
            deviceKey: deviceKey,
            type: batType,
          });

          adapter.log.debug(
            `[addOrUpdatePackData] Added battery ${batType} with SN ${x.sn} on deviceKey ${deviceKey} to pack2Devices!`
          );
        }

        // create a state for the serial id
        const key = (
          productKey +
          "." +
          deviceKey +
          ".packData." +
          x.sn
        ).replace(adapter.FORBIDDEN_CHARS, "");

        await adapter?.extendObject(key, {
          type: "channel",
          common: {
            name: {
              de: batType,
              en: batType,
            },
          },
          native: {},
        });

        await adapter?.extendObject(key + ".model", {
          type: "state",
          common: {
            name: {
              de: "Batterietyp",
              en: "Battery type",
            },
            type: "string",
            desc: "model",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setState(key + ".model", batType, true);

        await adapter?.extendObject(key + ".sn", {
          type: "state",
          common: {
            name: {
              de: "Seriennummer",
              en: "Serial id",
            },
            type: "string",
            desc: "Serial ID",
            role: "value",
            read: true,
            write: false,
          },
          native: {},
        });

        await adapter?.setState(key + ".sn", x.sn, true);

        if (x.socLevel) {
          // State für socLevel
          await adapter?.extendObject(key + ".socLevel", {
            type: "state",
            common: {
              name: {
                de: "SOC der Batterie",
                en: "soc of battery",
              },
              type: "number",
              desc: "SOC Level",
              role: "value",
              read: true,
              write: false,
              unit: "%",
            },
            native: {},
          });

          await adapter?.setState(key + ".socLevel", x.socLevel, true);
        }

        if (x.maxTemp) {
          // State für maxTemp
          await adapter?.extendObject(key + ".maxTemp", {
            type: "state",
            common: {
              name: {
                de: "Max. Temperatur der Batterie",
                en: "max temp. of battery",
              },
              type: "number",
              desc: "Max. Temp",
              role: "value",
              read: true,
              write: false,
              unit: "°C",
            },
            native: {},
          });

          // Convert Kelvin to Celsius
          await adapter?.setState(
            key + ".maxTemp",
            x.maxTemp / 10 - 273.15,
            true
          );
        }

        if (x.minVol) {
          await adapter?.extendObject(key + ".minVol", {
            type: "state",
            common: {
              name: "minVol",
              type: "number",
              desc: "minVol",
              role: "value",
              read: true,
              write: false,
              unit: "V",
            },
            native: {},
          });

          await adapter?.setState(key + ".minVol", x.minVol / 100, true);
        }

        if (x.batcur) {
          await adapter?.extendObject(key + ".batcur", {
            type: "state",
            common: {
              name: "batcur",
              type: "number",
              desc: "batcur",
              role: "value",
              read: true,
              write: false,
              unit: "A",
            },
            native: {},
          });

          await adapter?.setState(key + ".batcur", x.batcur / 10, true);
        }

        if (x.maxVol) {
          await adapter?.extendObject(key + ".maxVol", {
            type: "state",
            common: {
              name: "maxVol",
              type: "number",
              desc: "maxVol",
              role: "value",
              read: true,
              write: false,
              unit: "V",
            },
            native: {},
          });

          await adapter?.setState(key + ".maxVol", x.maxVol / 100, true);
        }

        if (x.totalVol) {
          await adapter?.extendObject(key + ".totalVol", {
            type: "state",
            common: {
              name: "totalVol",
              type: "number",
              desc: "totalVol",
              role: "value",
              read: true,
              write: false,
              unit: "V",
            },
            native: {},
          });

          const totalVol = x.totalVol / 100;

          await adapter?.setState(key + ".totalVol", totalVol, true);

          // Send Voltage to checkVoltage Method (only if is Solarflow device)
          if (isSolarFlow) {
            checkVoltage(adapter, productKey, deviceKey, totalVol);
          }
        }

        if (x.soh) {
          await adapter?.extendObject(key + ".soh", {
            type: "state",
            common: {
              name: {
                de: "Gesundheitszustand",
                en: "State of Health",
              },
              type: "number",
              desc: "State of Health",
              role: "value",
              read: true,
              write: false,
              unit: "%",
            },
            native: {},
          });

          await adapter?.setState(key + ".soh", x.soh / 10, true);
        }

        // Debug, send message if property is unknown!
        let found = false;

        Object.entries(x).forEach(([key, value]) => {
          knownPackDataProperties.forEach((property: string) => {
            if (property == key) {
              found = true;
            }
          });

          if (found) {
            //console.log(
            //  `${productName?.val}: ${key} with value ${value} is a KNOWN Mqtt Prop!`
            //);
          } else {
            adapter?.log.debug(
              `[addOrUpdatePackData] ${key} with value ${value} is a UNKNOWN PackData Mqtt Property!`
            );
          }
        });
      }
    });
  }
};

const onMessage = async (topic: string, message: Buffer): Promise<void> => {
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
    const productName = await adapter.getStateAsync(
      `${productKey}.${deviceKey}.productName`
    );

    if (adapter.log.level == "debug") {
      adapter.log.debug(`[onMessage] MQTT message: ${message.toString()}`);
    }

    if (obj.timestamp) {
      const currentTimeStamp = new Date().getTime() / 1000;
      const diff = currentTimeStamp - obj.timestamp;

      if (diff > 600) {
        // Timestamp older than 5 Minutens, device is offline!
        updateSolarFlowState(
          adapter,
          productKey,
          deviceKey,
          "wifiState",
          "Disconnected"
        );
      } else {
        // Timestamp older than 5 Minutens, device is offline!
        updateSolarFlowState(
          adapter,
          productKey,
          deviceKey,
          "wifiState",
          "Connected"
        );
      }
    }

    // Check if device is an solarflow or hyper device. Don't use LowVoltageBlock on an ACE device?
    if (productKey != "8bM93H") {
      isSolarFlow = true;
    }

    // set lastUpdate for deviceKey
    updateSolarFlowState(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      new Date().getTime()
    );

    if (
      obj.properties?.autoModel != null &&
      obj.properties?.autoModel != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "autoModel",
        obj.properties.autoModel
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "autoModel",
        obj.properties.autoModel
      );
    }

    if (
      obj.properties?.heatState != null &&
      obj.properties?.heatState != undefined
    ) {
      const value = obj.properties?.heatState == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "heatState", value);
    }

    if (
      obj.properties?.electricLevel != null &&
      obj.properties?.electricLevel != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.properties.electricLevel
      );

      if (
        adapter?.config.useCalculation &&
        obj.properties.electricLevel == 100 &&
        isSolarFlow
      ) {
        setEnergyWhMax(adapter, productKey, deviceKey);
      }

      if (obj.properties.electricLevel == 100) {
        const fullChargeNeeded = await adapter.getStateAsync(
          productKey + "." + deviceKey + ".control.fullChargeNeeded"
        );

        if (
          fullChargeNeeded &&
          fullChargeNeeded.val &&
          fullChargeNeeded.val == true
        ) {
          await adapter?.setState(
            `${productKey}.${deviceKey}.control.fullChargeNeeded`,
            false,
            true
          );
        }
      }

      // if minSoc is reached, set the calculated soc to 0
      const minSoc = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.minSoc`
      );
      if (
        adapter?.config.useCalculation &&
        minSoc &&
        minSoc.val &&
        obj.properties.electricLevel == Number(minSoc.val) &&
        isSolarFlow
      ) {
        setSocToZero(adapter, productKey, deviceKey);
      }
    }

    if (obj.power != null && obj.power != undefined) {
      const value = obj.power / 10;
      updateSolarFlowState(adapter, productKey, deviceKey, "power", value);
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
      updateSolarFlowState(adapter, productKey, deviceKey, "packState", value);
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
      updateSolarFlowState(adapter, productKey, deviceKey, "passMode", value);

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "passMode",
        obj.properties?.passMode
      );
    }

    if (obj.properties?.pass != null && obj.properties?.pass != undefined) {
      const value = obj.properties?.pass == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "pass", value);
    }

    if (
      obj.properties?.autoRecover != null &&
      obj.properties?.autoRecover != undefined
    ) {
      const value = obj.properties?.autoRecover == 0 ? false : true;

      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );
    }

    if (
      obj.properties?.outputHomePower != null &&
      obj.properties?.outputHomePower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.properties.outputHomePower
      );
    }

    if (
      obj.properties?.energyPower != null &&
      obj.properties?.energyPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "energyPower",
        obj.properties.energyPower
      );
    }

    if (
      obj.properties?.outputLimit != null &&
      obj.properties?.outputLimit != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputLimit",
        obj.properties.outputLimit
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "setOutputLimit",
        obj.properties.outputLimit
      );
    }

    if (
      obj.properties?.buzzerSwitch != null &&
      obj.properties?.buzzerSwitch != undefined
    ) {
      const value = obj.properties?.buzzerSwitch == 0 ? false : true;

      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );
    }

    if (
      obj.properties?.outputPackPower != null &&
      obj.properties?.outputPackPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.properties.outputPackPower
      );

      // if outPutPackPower set packInputPower to 0
      updateSolarFlowState(adapter, productKey, deviceKey, "packInputPower", 0);
    }

    if (
      obj.properties?.packInputPower != null &&
      obj.properties?.packInputPower != undefined
    ) {
      let standbyUsage = 0;

      // Aktuelle Solar-Power abfragen, wenn 0 Standby-Verbrauch dazu rechnen
      const solarInputPower = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.solarInputPower`
      );

      if (solarInputPower && Number(solarInputPower.val) < 10) {
        standbyUsage = 7 - Number(solarInputPower.val);
      }

      // Check if connected with Ace, if so add 10 Watt to standby usage!
      const device = adapter?.deviceList?.find(
        (x) => x.deviceKey == deviceKey && x.productKey == productKey
      );

      if (device && device._connectedWithAce) {
        standbyUsage += 7;
      }

      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.properties.packInputPower + standbyUsage
      );

      // if packInputPower set outputPackPower to 0
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0
      );
    }

    if (
      obj.properties?.solarInputPower != null &&
      obj.properties?.solarInputPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.properties.solarInputPower
      );
    }

    if (
      obj.properties?.pvPower1 != null &&
      obj.properties?.pvPower1 != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower2", // Reversed to adjust like offical app
        obj.properties.pvPower1
      );
    }

    if (
      obj.properties?.pvPower2 != null &&
      obj.properties?.pvPower2 != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower1", // Reversed to adjust like offical app
        obj.properties.pvPower2
      );
    }

    if (
      obj.properties?.solarPower1 != null &&
      obj.properties?.solarPower1 != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.properties.solarPower1
      );
    }

    if (
      obj.properties?.solarPower2 != null &&
      obj.properties?.solarPower2 != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.properties.solarPower2
      );
    }

    if (
      obj.properties?.remainOutTime != null &&
      obj.properties?.remainOutTime != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.properties.remainOutTime
      );
    }

    if (
      obj.properties?.remainInputTime != null &&
      obj.properties?.remainInputTime != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime
      );
    }

    if (obj.properties?.socSet != null && obj.properties?.socSet != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.properties.socSet) / 10
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "chargeLimit",
        Number(obj.properties.socSet) / 10
      );
    }

    if (obj.properties?.minSoc != null && obj.properties?.minSoc != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.properties.minSoc) / 10
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "dischargeLimit",
        Number(obj.properties.minSoc) / 10
      );
    }

    if (
      obj.properties?.inputLimit != null &&
      obj.properties?.inputLimit != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "inputLimit",
        obj.properties.inputLimit
      );

      if (
        productName?.val?.toString().toLowerCase().includes("solarflow") ||
        productName?.val?.toString().toLowerCase().includes("ace") ||
        productName?.val?.toString().toLowerCase().includes("hyper")
      ) {
        updateSolarFlowControlState(
          adapter,
          productKey,
          deviceKey,
          "setInputLimit",
          obj.properties.inputLimit
        );
      }
    }

    if (
      obj.properties?.gridInputPower != null &&
      obj.properties?.gridInputPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridInputPower
      );
    }

    if (obj.properties?.acMode != null && obj.properties?.acMode != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "acMode",
        obj.properties.acMode
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "acMode",
        obj.properties.acMode
      );
    }

    if (
      obj.properties?.hyperTmp != null &&
      obj.properties?.hyperTmp != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "hyperTmp",
        obj.properties.hyperTmp / 10 - 273.15
      );
    }

    if (
      obj.properties?.acOutputPower != null &&
      obj.properties?.acOutputPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "acOutputPower",
        obj.properties.acOutputPower
      );
    }

    if (
      obj.properties?.gridPower != null &&
      obj.properties?.gridPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "gridInputPower",
        obj.properties.gridPower
      );
    }

    if (
      obj.properties?.acSwitch != null &&
      obj.properties?.acSwitch != undefined
    ) {
      const value = obj.properties?.acSwitch == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "acSwitch", value);

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "acSwitch",
        value
      );
    }

    if (
      obj.properties?.dcSwitch != null &&
      obj.properties?.dcSwitch != undefined
    ) {
      const value = obj.properties?.dcSwitch == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "dcSwitch", value);

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "dcSwitch",
        value
      );
    }

    if (
      obj.properties?.dcOutputPower != null &&
      obj.properties?.dcOutputPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "dcOutputPower",
        obj.properties.dcOutputPower
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
      updateSolarFlowState(adapter, productKey, deviceKey, "pvBrand", value);
    }

    if (
      obj.properties?.inverseMaxPower != null &&
      obj.properties?.inverseMaxPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.properties.inverseMaxPower
      );
    }

    if (
      obj.properties?.wifiState != null &&
      obj.properties?.wifiState != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.properties.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }

    if (
      obj.properties?.packNum != null &&
      obj.properties?.packNum != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "packNum",
        obj.properties.packNum
      );
    }

    if (
      obj.properties?.hubState != null &&
      obj.properties?.hubState != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.properties.hubState
      );

      updateSolarFlowControlState(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.properties.hubState
      );
    }

    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData, isSolarFlow);
    }

    if (obj.properties && adapter.log.level == "debug") {
      let type = "solarflow";
      const _productName = productName?.val?.toString();

      if (_productName?.toLowerCase().includes("hyper")) {
        type = "hyper";
      } else if (_productName?.toLowerCase().includes("ace")) {
        type = "ace";
      } else if (_productName?.toLowerCase().includes("aio")) {
        type = "aio";
      } else if (_productName?.toLowerCase().includes("smart plug")) {
        type = "smartPlug";
      }

      const states = getStateDefinition(type);
      let found = false;

      Object.entries(obj.properties).forEach(([key, value]) => {
        states.forEach((state: ISolarflowState) => {
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
            `[onMessage] ${productName?.val}: ${key} with value ${value} is a UNKNOWN Mqtt Property!`
          );
        }
      });
    }
  }
};

export const setAcMode = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  acMode: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (acMode >= 0 && acMode <= 2) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const setAcMode = { properties: { acMode: acMode } };
      adapter.log.debug(`[setAcMode] Set AC mode to ${acMode}!`);
      adapter.mqttClient?.publish(topic, JSON.stringify(setAcMode));
    } else {
      adapter.log.error(`[setAcMode] AC mode must be a value between 0 and 2!`);
    }
  }
};

export const setChargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  socSet: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (socSet >= 40 && socSet <= 100) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { socSet: socSet * 10 } };
      adapter.log.debug(
        `[setChargeLimit] Setting ChargeLimit for device key ${deviceKey} to ${socSet}!`
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(
        `[setChargeLimit] Charge limit is not in range 40<>100!`
      );
    }
  }
};

export const setDischargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  minSoc: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (minSoc >= 0 && minSoc <= 50) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter.log.debug(
        `[setDischargeLimit] Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(
        `[setDischargeLimit] Discharge limit is not in range 0<>50!`
      );
    }
  }
};

export const setHubState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  hubState: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (hubState == 0 || hubState == 1) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { hubState: hubState } };
      adapter.log.debug(
        `[setHubState] Setting Hub State for device key ${deviceKey} to ${hubState}!`
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(`[setHubState] Hub state is not 0 or 1!`);
    }
  }
};

export const setOutputLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  limit: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    // Check if autoModel is set to 0
    const autoModel = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".autoModel")
    )?.val;

    if (autoModel != 0) {
      adapter.log.warn(
        "Operation mode (autoModel) is not set to '0', we can't set the output limit!"
      );
      return;
    }

    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }

    if (adapter.config.useLowVoltageBlock) {
      const lowVoltageBlockState = await adapter.getStateAsync(
        productKey + "." + deviceKey + ".control.lowVoltageBlock"
      );
      if (
        lowVoltageBlockState &&
        lowVoltageBlockState.val &&
        lowVoltageBlockState.val == true
      ) {
        limit = 0;
      }

      const fullChargeNeeded = await adapter.getStateAsync(
        productKey + "." + deviceKey + ".control.fullChargeNeeded"
      );

      if (
        fullChargeNeeded &&
        fullChargeNeeded.val &&
        fullChargeNeeded.val == true
      ) {
        limit = 0;
      }
    }

    const currentLimit = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".outputLimit")
    )?.val;

    const productName = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".productName")
    )?.val
      ?.toString()
      .toLowerCase();

    if (currentLimit != null && currentLimit != undefined) {
      if (currentLimit != limit) {
        if (
          limit < 100 &&
          limit != 90 &&
          limit != 60 &&
          limit != 30 &&
          limit != 0
        ) {
          // NUR Solarflow HUB: Das Limit kann unter 100 nur in 30er Schritten gesetzt werden, dH. 30/60/90/100, wir rechnen das also um
          if (limit < 100 && limit > 90 && !productName?.includes("hyper")) {
            limit = 90;
          } else if (
            limit > 60 &&
            limit < 90 &&
            !productName?.includes("hyper")
          ) {
            limit = 60;
          } else if (
            limit > 30 &&
            limit < 60 &&
            !productName?.includes("hyper")
          ) {
            limit = 30;
          } else if (limit < 30) {
            limit = 30;
          }
        }

        if (limit > 1200) {
          limit = 1200;
        }

        const topic = `iot/${productKey}/${deviceKey}/properties/write`;

        const outputlimit = { properties: { outputLimit: limit } };
        adapter.mqttClient?.publish(topic, JSON.stringify(outputlimit));
      }
    }
  }
};

export const setInputLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  limit: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (limit) {
      limit = Math.round(limit);
    } else {
      limit = 0;
    }

    let maxLimit = 900;
    const currentLimit = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".inputLimit")
    )?.val;

    const productName = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".productName")
    )?.val
      ?.toString()
      .toLowerCase();

    if (productName?.includes("hyper")) {
      maxLimit = 1200;
    }

    if (productName?.includes("ace")) {
      // Das Limit kann nur in 100er Schritten gesetzt werden
      limit = Math.ceil(limit / 100) * 100;
    }

    if (limit < 0) {
      limit = 0;
    } else if (limit > 0 && limit <= 30) {
      limit = 30;
    } else if (limit > maxLimit) {
      limit = maxLimit;
    }

    if (currentLimit != null && currentLimit != undefined) {
      if (currentLimit != limit) {
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;

        const inputLimitContent = { properties: { inputLimit: limit } };
        adapter.mqttClient?.publish(topic, JSON.stringify(inputLimitContent));
      }
    }
  }
};

export const setBuzzerSwitch = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  buzzerOn: boolean
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    const setBuzzerSwitchContent = {
      properties: { buzzerSwitch: buzzerOn ? 1 : 0 },
    };
    adapter.log.debug(
      `[setBuzzer] Setting Buzzer for device key ${deviceKey} to ${buzzerOn}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setBuzzerSwitchContent));
  }
};

export const setAutoModel = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  autoModel: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    let setAutoModelContent: any = { properties: { autoModel: autoModel } };

    switch (autoModel) {
      case 8: // Smart Matching Modus
        setAutoModelContent = {
          properties: {
            autoModelProgram: 1,
            autoModelValue: { chargingType: 0, chargingPower: 0, outPower: 0 },
            msgType: 1,
            autoModel: 8,
          },
        };
        break;
      case 9: // Smart CT Modus
        setAutoModelContent = {
          properties: {
            autoModelProgram: 2,
            autoModelValue: { chargingType: 3, chargingPower: 0, outPower: 0 },
            msgType: 1,
            autoModel: 9,
          },
        };
        break;
    }

    adapter.log.debug(
      `[setAutoModel] Setting autoModel for device key ${deviceKey} to ${autoModel}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setAutoModelContent));
  }
};

export const triggerFullTelemetryUpdate = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/read`;

    const getAllContent = { properties: ["getAll"] };
    adapter.log.debug(
      `[triggerFullTelemetryUpdate] Triggering full telemetry update for device key ${deviceKey}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(getAllContent));
  }
};

export const setPassMode = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  passMode: number
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    const setPassModeContent = { properties: { passMode: passMode } };
    adapter.log.debug(
      `[setPassMode] Set passMode for device ${deviceKey} to ${passMode}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setPassModeContent));
  }
};

export const setAutoRecover = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  autoRecover: boolean
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    const setAutoRecoverContent = {
      properties: { autoRecover: autoRecover ? 1 : 0 },
    };
    adapter.log.debug(
      `[setAutoRecover] Set autoRecover for device ${deviceKey} to ${autoRecover}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setAutoRecoverContent));
  }
};

export const setDcSwitch = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  dcSwitch: boolean
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    const setDcSwitchContent = {
      properties: { dcSwitch: dcSwitch ? 1 : 0 },
    };
    adapter.log.debug(
      `[setDcSwitch] Set DC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setDcSwitchContent));
  }
};

export const setAcSwitch = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  acSwitch: boolean
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    const topic = `iot/${productKey}/${deviceKey}/properties/write`;

    const setAcSwitchContent = {
      properties: { acSwitch: acSwitch ? 1 : 0 },
    };
    adapter.log.debug(
      `[setAcSwitch] Set AC Switch for device ${deviceKey} to ${acSwitch}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setAcSwitchContent));
  }
};

const onConnected = (): void => {
  adapter?.log.info("[onConnected] Connected with MQTT!");
};

const onError = (error: any): void => {
  adapter?.log.error("Connection to MQTT failed! Error: " + error);
};

const onSubscribeReportTopic: any = (error: Error | null) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter?.log.debug("Subscription of Report Topic successful!");
  }
};

const onSubscribeIotTopic: any = (
  error: Error | null,
  productKey: string,
  deviceKey: string
) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else if (adapter) {
    adapter?.log.debug("Subscription of IOT Topic successful!");
    triggerFullTelemetryUpdate(adapter, productKey, deviceKey);
  }
};

export const subscribeReportTopic = (
  productKey: string,
  deviceKey: string,
  timeout: number
): void => {
  const reportTopic = `/${productKey}/${deviceKey}/#`;

  setTimeout(() => {
    if (adapter) {
      adapter.log.debug(
        `[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic}`
      );
      adapter.mqttClient?.subscribe(reportTopic, onSubscribeReportTopic);
    }
  }, timeout);
};

export const subscribeIotTopic = (
  productKey: string,
  deviceKey: string,
  timeout: number
): void => {
  const iotTopic = `iot/${productKey}/${deviceKey}/#`;

  setTimeout(() => {
    adapter?.log.debug(
      `[subscribeIotTopic] Subscribing to MQTT Topic: ${iotTopic}`
    );
    adapter?.mqttClient?.subscribe(iotTopic, (error) => {
      onSubscribeIotTopic(error, productKey, deviceKey);
    });
  }, timeout);
};

export const connectCloudMqttClient = (_adapter: ZendureSolarflow): void => {
  adapter = _adapter;

  if (!adapter.paths?.mqttPassword) {
    adapter.log.error(`[connectCloudMqttClient] MQTT Password is missing!`);
    return;
  }

  const mqttPassword = atob(adapter.paths?.mqttPassword);

  const options: mqtt.IClientOptions = {
    clientId: adapter.accessToken,
    username: "zenApp",
    password: mqttPassword,
    clean: true,
    protocolVersion: 5,
  };

  if (mqtt && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug(
      `[connectCloudMqttClient] Connecting to MQTT broker ${
        adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort
      }...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      // Subscribe to Topic (appkey von Zendure)
      adapter.deviceList.forEach(
        (device: ISolarFlowDeviceDetails, index: number) => {
          if (adapter) {
            let connectIot = true;

            if (device.productKey == "s3Xk4x") {
              const smartPlugReportTopic = `/server/app/${adapter.userId}/${device.id}/smart/power`;

              adapter.mqttClient?.subscribe(
                smartPlugReportTopic,
                onSubscribeReportTopic
              );

              connectIot = false;
            }

            subscribeReportTopic(
              device.productKey,
              device.deviceKey,
              1000 * index
            );

            if (connectIot) {
              subscribeIotTopic(
                device.productKey,
                device.deviceKey,
                1000 * index
              );
            }

            // Check if has subdevice e.g. ACE and connect to this also?
            if (device.packList && device.packList.length > 0) {
              device.packList.forEach(async (subDevice) => {
                if (subDevice.productName.toLocaleLowerCase() == "ace 1500") {
                  subscribeReportTopic(
                    subDevice.productKey,
                    subDevice.deviceKey,
                    1000 * index
                  );

                  subscribeIotTopic(
                    subDevice.productKey,
                    subDevice.deviceKey,
                    2000 * index
                  );
                }
              });
            }
          }
        }
      );

      adapter.mqttClient.on("message", onMessage);

      // Job starten die states in der Nacht zu resetten
      startResetValuesJob(adapter);

      // Job starten die States zu checken
      startCheckStatesAndConnectionJob(adapter);

      // Calculation Job starten sofern aktiviert
      if (adapter.config.useCalculation) {
        startCalculationJob(adapter);
      }
    }
  }
};

export const connectLocalMqttClient = (_adapter: ZendureSolarflow): void => {
  adapter = _adapter;

  const options: mqtt.IClientOptions = {
    clientId: "ioBroker.zendure-solarflow." + adapter.instance,
  };

  if (mqtt && adapter && adapter.config && adapter.config.localMqttUrl) {
    adapter.log.debug(
      `[connectLocalMqttClient] Connecting to MQTT broker ${
        adapter.config.localMqttUrl + ":" + 1883
      }...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.config.localMqttUrl + ":" + 1883,
      options
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      adapter.setState("info.connection", true, true);

      // Subscribe to 1. device from local settings
      if (
        adapter.config.localDevice1ProductKey &&
        adapter.config.localDevice1DeviceKey
      ) {
        // Create states and subscribe device 1
        createSolarFlowLocalStates(
          adapter,
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey
        );

        subscribeReportTopic(
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey,
          1000
        );

        subscribeIotTopic(
          adapter.config.localDevice1ProductKey,
          adapter.config.localDevice1DeviceKey,
          1000
        );
      }

      // Subscribe to 2. device from local settings
      if (
        adapter.config.localDevice2ProductKey &&
        adapter.config.localDevice2DeviceKey
      ) {
        // Create states and subscribe device 2
        createSolarFlowLocalStates(
          adapter,
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey
        );

        subscribeReportTopic(
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey,
          2000
        );

        subscribeIotTopic(
          adapter.config.localDevice2ProductKey,
          adapter.config.localDevice2DeviceKey,
          2000
        );
      }

      // Subscribe to 3. device from local settings
      if (
        adapter.config.localDevice3ProductKey &&
        adapter.config.localDevice3DeviceKey
      ) {
        // Create states and subscribe device 2
        createSolarFlowLocalStates(
          adapter,
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey
        );

        subscribeReportTopic(
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey,
          2000
        );

        subscribeIotTopic(
          adapter.config.localDevice3ProductKey,
          adapter.config.localDevice3DeviceKey,
          2000
        );
      }

      // Subscribe to 3. device from local settings
      if (
        adapter.config.localDevice4ProductKey &&
        adapter.config.localDevice4DeviceKey
      ) {
        // Create states and subscribe device 2
        createSolarFlowLocalStates(
          adapter,
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey
        );

        subscribeReportTopic(
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey,
          2000
        );

        subscribeIotTopic(
          adapter.config.localDevice4ProductKey,
          adapter.config.localDevice4DeviceKey,
          2000
        );
      }

      adapter.mqttClient.on("message", onMessage);

      // Job starten die states in der Nacht zu resetten
      startResetValuesJob(adapter);

      // Job starten die States zu checken
      startCheckStatesAndConnectionJob(adapter);

      // Calculation Job starten sofern aktiviert
      if (adapter.config.useCalculation) {
        startCalculationJob(adapter);
      }
    }
  }
};
