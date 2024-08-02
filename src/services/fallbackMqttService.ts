/* eslint-disable @typescript-eslint/indent */
import mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import { generateUniqSerial } from "../helpers/uuidHelper";
import { IPackData } from "../models/IPackData";
import { updateSolarFlowState } from "./adapterService";
import { ISolarFlowMqttProperties } from "../models/ISolarFlowMqttProperties";
import { setEnergyWhMax } from "./calculationService";
import { createSolarFlowStates } from "../helpers/createSolarFlowStates";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startResetValuesJob,
} from "./jobSchedule";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

let adapter: ZendureSolarflow | undefined = undefined;

export const addOrUpdatePackData = async (
  productKey: string,
  deviceKey: string,
  packData: IPackData[]
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
            },
            native: {},
          });

          await adapter?.setState(key + ".minVol", x.minVol / 100, true);
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

          // Send Voltage to checkVoltage Method - Check Voltage makes no sense, as no control is possible in fallback mode!
          //checkVoltage(adapter, productKey, deviceKey, totalVol);
        }
      }
    });
  }
};

const onMessage = async (topic: string, message: Buffer): Promise<void> => {
  if (adapter) {
    let obj: ISolarFlowMqttProperties = {};
    try {
      //console.log("Topic: " + topic);
      //console.log("Message: " + message.toString());
      obj = JSON.parse(message.toString());
    } catch (e) {
      const txt = message.toString();
      adapter.log.error(`[JSON PARSE ERROR] ${txt}`);
      return;
    }

    const topicSplitted = topic.split("/");
    let productKey = topicSplitted[0];
    const deviceKey = topicSplitted[1];

    //console.log("productKey: " + productKey + " / deviceKey: " + deviceKey);

    if (deviceKey == "sensor" || deviceKey == "switch") {
      return;
    }

    if (productKey == "E8OdVAA4") {
      // E8OdVAA4 vom Dev MQTT ist 73bkTV vom App MQTT - wir überschreiben diesen damit die angelegten States beim Umswitchen des MQTT weitergenutzt werden können.
      productKey = "73bkTV";
    }

    if (
      !adapter.deviceList.some(
        (x) => x.deviceKey == deviceKey && x.productKey == productKey
      )
    ) {
      // Create an "fake" device
      const device: ISolarFlowDeviceDetails = {
        productName: "Solarflow",
        deviceKey: deviceKey,
        productKey: productKey,
      };
      adapter.deviceList.push(device);

      // Wir erstellen bzw. aktualisieren die States, erfolgt im "normalen" MQTT in der main.ts
      await createSolarFlowStates(adapter, device, "solarflow");

      await updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "registeredServer",
        adapter.config.server
      );
    }

    // set lastUpdate for deviceKey
    updateSolarFlowState(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      new Date().getTime()
    );

    if (obj?.electricLevel != null && obj?.electricLevel != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "electricLevel",
        obj.electricLevel
      );

      if (adapter?.config.useCalculation && obj.electricLevel == 100) {
        setEnergyWhMax(adapter, productKey, deviceKey);
      }
    }

    if (obj?.packState != null && obj?.packState != undefined) {
      const value =
        obj?.packState == 0
          ? "Idle"
          : obj?.packState == 1
            ? "Charging"
            : obj?.packState == 2
              ? "Discharging"
              : "Unknown";
      updateSolarFlowState(adapter, productKey, deviceKey, "packState", value);
    }

    if (obj?.passMode != null && obj?.passMode != undefined) {
      const value =
        obj?.passMode == 0
          ? "Automatic"
          : obj?.passMode == 1
            ? "Always off"
            : obj?.passMode == 2
              ? "Always on"
              : "Unknown";
      updateSolarFlowState(adapter, productKey, deviceKey, "passMode", value);
    }

    if (obj?.pass != null && obj?.pass != undefined) {
      const value = obj?.pass == 0 ? false : true;

      updateSolarFlowState(adapter, productKey, deviceKey, "pass", value);
    }

    if (obj?.autoRecover != null && obj?.autoRecover != undefined) {
      const value = obj?.autoRecover == 0 ? false : true;

      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "autoRecover",
        value
      );
    }

    if (obj?.outputHomePower != null && obj?.outputHomePower != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputHomePower",
        obj.outputHomePower
      );
    }

    if (obj?.outputLimit != null && obj?.outputLimit != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputLimit",
        obj.outputLimit
      );
    }

    if (obj?.buzzerSwitch != null && obj?.buzzerSwitch != undefined) {
      const value = obj?.buzzerSwitch == 0 ? false : true;

      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "buzzerSwitch",
        value
      );
    }

    if (obj?.outputPackPower != null && obj?.outputPackPower != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        obj.outputPackPower
      );

      // if outPutPackPower set packInputPower to 0
      updateSolarFlowState(adapter, productKey, deviceKey, "packInputPower", 0);
    }

    if (obj?.packInputPower != null && obj?.packInputPower != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.packInputPower
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

    if (obj?.solarInputPower != null && obj?.solarInputPower != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "solarInputPower",
        obj.solarInputPower
      );
    }

    if (obj?.pvPower1 != null && obj?.pvPower1 != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower2", // Reversed to adjust like offical app
        obj.pvPower1
      );
    }

    if (obj?.pvPower2 != null && obj?.pvPower2 != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower1", // Reversed to adjust like offical app
        obj.pvPower2
      );
    }

    if (obj?.solarPower1 != null && obj?.solarPower1 != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower1",
        obj.solarPower1
      );
    }

    if (obj?.solarPower2 != null && obj?.solarPower2 != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "pvPower2",
        obj.solarPower2
      );
    }

    if (obj?.remainOutTime != null && obj?.remainOutTime != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "remainOutTime",
        obj.remainOutTime
      );
    }

    if (obj?.remainInputTime != null && obj?.remainInputTime != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.remainInputTime
      );
    }

    if (obj?.socSet != null && obj?.socSet != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.socSet) / 10
      );
    }

    if (obj?.minSoc != null && obj?.minSoc != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.minSoc) / 10
      );
    }

    if (obj?.pvBrand != null && obj?.pvBrand != undefined) {
      const value =
        obj?.pvBrand == 0
          ? "Others"
          : obj?.pvBrand == 1
            ? "Hoymiles"
            : obj?.pvBrand == 2
              ? "Enphase"
              : obj?.pvBrand == 3
                ? "APSystems"
                : obj?.pvBrand == 4
                  ? "Anker"
                  : obj?.pvBrand == 5
                    ? "Deye"
                    : obj?.pvBrand == 6
                      ? "Bosswerk"
                      : "Unknown";
      updateSolarFlowState(adapter, productKey, deviceKey, "pvBrand", value);
    }

    if (obj?.inverseMaxPower != null && obj?.inverseMaxPower != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "inverseMaxPower",
        obj.inverseMaxPower
      );
    }

    if (obj?.wifiState != null && obj?.wifiState != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "wifiState",
        obj.wifiState == 1 ? "Connected" : "Disconnected"
      );
    }

    if (obj?.hubState != null && obj?.hubState != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "hubState",
        obj.hubState == 0
          ? "Stop output and standby"
          : "Stop output and shut down"
      );
    }

    if (obj.packData) {
      addOrUpdatePackData(productKey, deviceKey, obj.packData);
    }
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

export const connectFallbackMqttClient = (
  _adapter: ZendureSolarflow,
  appKey: string,
  secret: string,
  mqttServer: string,
  mqttPort: number
): boolean => {
  //console.log("connectFallbackMqttClient");
  adapter = _adapter;

  const options: mqtt.IClientOptions = {
    clientId: generateUniqSerial(),
    username: appKey,
    password: secret,
    clean: true,
    protocolVersion: 5,
  };

  if (mqtt && adapter && adapter.paths && adapter.deviceList) {
    adapter.log.debug(
      `[connectMqttClient] Connecting to DEV MQTT broker ${
        mqttServer + ":" + mqttPort
      }...`
    );
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + mqttServer + ":" + mqttPort,
      options
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      // Subscribe to Topic (appkey von Zendure)

      if (adapter) {
        const reportTopic = `${appKey}/#`;

        adapter.log.debug(
          `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`
        );
        adapter.mqttClient?.subscribe(reportTopic, onSubscribeReportTopic);
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

      return true;
    }
  }
  return false;
};
