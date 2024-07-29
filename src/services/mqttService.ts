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
import { IMqttData, knownMqttProps } from "../models/ISolarFlowMqttProperties";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startRefreshAccessTokenTimerJob,
  startResetValuesJob,
} from "./jobSchedule";

let adapter: ZendureSolarflow | undefined = undefined;

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
        // create a state for the serial id
        const key = (
          productKey +
          "." +
          deviceKey +
          ".packData." +
          x.sn
        ).replace(adapter.FORBIDDEN_CHARS, "");

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

        await adapter?.setStateAsync(key + ".sn", x.sn, true);

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
            },
            native: {},
          });

          await adapter?.setStateAsync(key + ".socLevel", x.socLevel, true);
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
            },
            native: {},
          });

          // Convert Kelvin to Celsius
          await adapter?.setStateAsync(
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
            },
            native: {},
          });

          await adapter?.setStateAsync(key + ".minVol", x.minVol / 100, true);
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
      }
    });
  }
};

const onMessage = async (topic: string, message: Buffer): Promise<void> => {
  if (adapter) {
    const topicSplitted = topic.split("/");
    const productKey = topicSplitted[1];
    const deviceKey = topicSplitted[2];

    let obj: IMqttData = {};
    try {
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[JSON PARSE ERROR] ${txt}`);
    }

    let isSolarFlow = false;
    const productName = await adapter.getStateAsync(
      `${productKey}.${deviceKey}.productName`
    );

    // Check if device is an solarflow or hyper device. Don't use LowVoltageBlock on an ACE device?
    if (
      productName?.val?.toString().toLowerCase().includes("solarflow") ||
      productName?.val?.toString().toLowerCase().includes("hyper")
    ) {
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

      // if minSoc is reached, set the calculated soc to 0
      const minSoc = await adapter?.getStateAsync(
        `${productKey}.${deviceKey}.minSoc`
      );
      if (
        adapter?.config.useCalculation &&
        minSoc &&
        minSoc.val &&
        obj.properties.electricLevel <= Number(minSoc.val) &&
        isSolarFlow
      ) {
        setSocToZero(adapter, productKey, deviceKey);
      }
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
        standbyUsage = 10 - Number(solarInputPower.val);
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
        "gridPower",
        obj.properties.gridPower
      );
    }

    if (
      obj.properties?.acSwitch != null &&
      obj.properties?.acSwitch != undefined
    ) {
      const value = obj.properties?.acSwitch == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "acSwitch", value);
    }

    if (
      obj.properties?.dcSwitch != null &&
      obj.properties?.dcSwitch != undefined
    ) {
      const value = obj.properties?.dcSwitch == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "dcSwitch", value);
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
        obj.properties.hubState == 0
          ? "Stop output and standby"
          : "Stop output and shut down"
      );
    }

    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData, isSolarFlow);
    }

    if (obj.properties) {
      Object.entries(obj.properties).forEach(([key, value]) => {
        if (knownMqttProps.includes(key)) {
          //console.log(`${key} with value ${value} is a known Mqtt Prop!`);
        } else {
          console.log(
            `${productName?.val}: ${key} with value ${value} is a UNKNOWN Mqtt Prop!`
          );
        }
      });
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
    if (socSet > 40 && socSet <= 100) {
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
    if (minSoc > 0 && minSoc < 90) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter.log.debug(
        `[setDischargeLimit] Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(
        `[setDischargeLimit] Discharge limit is not in range 0<>90!`
      );
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
    }

    // Das Limit kann unter 100 nur in 30er Schritten gesetzt werden, dH. 30/60/90/100, wir rechnen das also um
    const currentLimit = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".outputLimit")
    )?.val;

    if (currentLimit != null && currentLimit != undefined) {
      if (currentLimit != limit) {
        if (
          limit < 100 &&
          limit != 90 &&
          limit != 60 &&
          limit != 30 &&
          limit != 0
        ) {
          if (limit < 100 && limit > 90) {
            limit = 90;
          } else if (limit < 90 && limit > 60) {
            limit = 60;
          } else if (limit < 60 && limit > 30) {
            limit = 30;
          } else if (limit < 30) {
            limit = 30;
          }
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
    const currentLimit = (
      await adapter.getStateAsync(productKey + "." + deviceKey + ".inputLimit")
    )?.val;

    // Das Limit kann nur in 100er Schritten gesetzt werden
    limit = Math.ceil(limit / 100) * 100;
    if (limit < 0) {
      limit = 0;
    } else if (limit > 900) {
      limit = 900;
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

    const socSetLimit = { properties: { buzzerSwitch: buzzerOn ? 1 : 0 } };
    adapter.log.debug(
      `[setBuzzer] Setting Buzzer for device key ${deviceKey} to ${buzzerOn}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
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
      `[setPassMode] Set autoRecover for device ${deviceKey} to ${autoRecover}!`
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
      `[setPassMode] Set DC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setDcSwitchContent));
  }
};

export const setAcSwitch = async (
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
      `[setPassMode] Set AC Switch for device ${deviceKey} to ${dcSwitch}!`
    );
    adapter.mqttClient?.publish(topic, JSON.stringify(setDcSwitchContent));
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

export const connectMqttClient = (_adapter: ZendureSolarflow): void => {
  adapter = _adapter;

  const options: mqtt.IClientOptions = {
    clientId: adapter.accessToken,
    username: "zenApp",
    password:
      adapter.config.server && adapter.config.server == "eu"
        ? "H6s$j9CtNa0N"
        : "oK#PCgy6OZxd",
    clean: true,
    protocolVersion: 5,
  };

  if (mqtt && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug(
      `[connectMqttClient] Connecting to MQTT broker ${
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
            const reportTopic = `/${device.productKey}/${device.deviceKey}/properties/report`;
            const iotTopic = `iot/${device.productKey}/${device.deviceKey}/#`;

            setTimeout(() => {
              if (adapter) {
                adapter.log.debug(
                  `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
                );
                adapter.mqttClient?.subscribe(
                  reportTopic,
                  onSubscribeReportTopic
                );
              }
            }, 1000 * index);

            setTimeout(() => {
              adapter?.log.debug(
                `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic}`
              );
              adapter?.mqttClient?.subscribe(iotTopic, (error) => {
                onSubscribeIotTopic(error, device.productKey, device.deviceKey);
              });
            }, 1500 * index);
          }
        }
      );

      adapter.mqttClient.on("message", onMessage);

      // Job starten die states in der Nacht zu resetten
      startResetValuesJob(adapter);

      // Job starten die States zu checken
      startCheckStatesAndConnectionJob(adapter);

      // Den Access Token aktualiseren
      startRefreshAccessTokenTimerJob(adapter);

      // Calculation Job starten sofern aktiviert
      if (adapter.config.useCalculation) {
        startCalculationJob(adapter);
      }
    }
  }
};
