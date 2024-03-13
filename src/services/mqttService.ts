/* eslint-disable @typescript-eslint/indent */
import * as mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { checkVoltage, updateSolarFlowState } from "./adapterService";
import { toHoursAndMinutes } from "../helpers/timeHelper";
import { createSolarFlowStates } from "../helpers/createSolarFlowStates";
import { IPackData } from "../models/IPackData";
import { setEnergyWhMax } from "./calculationService";

let adapter: ZendureSolarflow | undefined = undefined;

const onConnected = (): void => {
  adapter?.log.info("[onConnected] Connected with MQTT!");
};

const onError = (error: any): void => {
  adapter?.log.error("Connection to MQTT failed! Error: " + error);
};

const onSubscribe: any = (error: Error | null) => {
  if (error) {
    adapter?.log.error("Subscription to MQTT failed! Error: " + error);
  } else {
    adapter?.log.debug("Subscription successful!");
  }
};

export const addOrUpdatePackData = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  packData: IPackData[],
): Promise<void> => {
  await packData.forEach(async (x) => {
    // Process data only with a serial id!
    if (x.sn) {
      // create a state for the serial id
      const key = (productKey + "." + deviceKey + ".packData." + x.sn).replace(
        adapter.FORBIDDEN_CHARS,
        "",
      );

      await adapter?.extendObjectAsync(key + ".sn", {
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
        await adapter?.extendObjectAsync(key + ".socLevel", {
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
        await adapter?.extendObjectAsync(key + ".maxTemp", {
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
          true,
        );
      }

      if (x.minVol) {
        await adapter?.extendObjectAsync(key + ".minVol", {
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
        await adapter?.extendObjectAsync(key + ".maxVol", {
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

        await adapter?.setStateAsync(key + ".maxVol", x.maxVol / 100, true);
      }

      if (x.totalVol) {
        await adapter?.extendObjectAsync(key + ".totalVol", {
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

        await adapter?.setStateAsync(key + ".totalVol", totalVol, true);

        // Send Voltage to checkVoltage Method
        checkVoltage(adapter, productKey, deviceKey, totalVol);
      }
    }
  });
};

const onMessage = async (topic: string, message: Buffer): Promise<void> => {
  //adapter?.log.info(message.toString())
  if (adapter) {
    const splitted = topic.split("/");
    const productKey = splitted[1];
    const deviceKey = splitted[2];

    const obj = JSON.parse(message.toString());

    // lastUpdate für den deviceKey setzen
    updateSolarFlowState(
      adapter,
      productKey,
      deviceKey,
      "lastUpdate",
      new Date().getTime(),
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
        obj.properties.electricLevel,
      );

      if (adapter?.config.useCalculation && obj.properties.electricLevel == 100) {
        setEnergyWhMax(adapter, productKey, deviceKey);
      }
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
        obj.properties.outputHomePower,
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
        obj.properties.outputLimit,
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
        obj.properties.outputPackPower,
      );

      // if outPutPackPower set packInputPower to 0
      updateSolarFlowState(adapter, productKey, deviceKey, "packInputPower", 0);
    }

    if (
      obj.properties?.packInputPower != null &&
      obj.properties?.packInputPower != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "packInputPower",
        obj.properties.packInputPower,
      );

      // if packInputPower set outputPackPower to 0
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "outputPackPower",
        0,
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
        obj.properties.solarInputPower,
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
        obj.properties.pvPower1,
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
        obj.properties.pvPower2,
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
        obj.properties.solarPower1,
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
        obj.properties.solarPower2,
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
        obj.properties.remainOutTime,
      );

      // If Adapter calucation is used, calculate in and outtime
      if (adapter.config.useCalculation) {
        // Zendure use the same state for input und output values, if charging set remainInputTime, else remainOutTime
        const packInputPower = Number(
          (
            await adapter.getStateAsync(
              productKey + "." + deviceKey + ".packInputPower",
            )
          )?.val,
        );
        const outputPackPower = Number(
          (
            await adapter.getStateAsync(
              productKey + "." + deviceKey + ".outputPackPower",
            )
          )?.val,
        );

        if (packInputPower && packInputPower > 0) {
          // Calculate minutes to format hh:mm
          updateSolarFlowState(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainOutTime",
            obj.properties.remainOutTime < 59940
              ? toHoursAndMinutes(obj.properties.remainOutTime)
              : "",
          );

          // Set remainInputTime to blank
          updateSolarFlowState(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainInputTime",
            "",
          );
        } else if (outputPackPower && outputPackPower > 0) {
          // Calculate minutes to format hh:mm
          updateSolarFlowState(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainInputTime",
            obj.properties.remainInputTime < 59940
              ? toHoursAndMinutes(obj.properties.remainInputTime)
              : "",
          );

          // Set remainOutTime to blank
          updateSolarFlowState(
            adapter,
            productKey,
            deviceKey,
            "calculations.remainOutTime",
            "",
          );
        }
      }
    }

    if (obj.properties?.socSet != null && obj.properties?.socSet != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "socSet",
        Number(obj.properties.socSet) / 10,
      );
    }

    if (obj.properties?.minSoc != null && obj.properties?.minSoc != undefined) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "minSoc",
        Number(obj.properties.minSoc) / 10,
      );
    }

    if (obj.packData) {
      addOrUpdatePackData(adapter, productKey, deviceKey, obj.packData);
    }
  }

  if (adapter?.mqttClient) {
    //client.end();
  }
};

export const setChargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  socSet: number,
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (socSet > 40 && socSet <= 100) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { socSet: socSet * 10 } };
      adapter.log.debug(
        `[setChargeLimit] Setting ChargeLimit for device key ${deviceKey} to ${socSet}!`,
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(
        `[setChargeLimit] Charge limit is not in range 40<>100!`,
      );
    }
  }
};

export const setDischargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  minSoc: number,
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (minSoc > 0 && minSoc < 90) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter.log.debug(
        `[setDischargeLimit] Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`,
      );
      adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(
        `[setDischargeLimit] Discharge limit is not in range 0<>90!`,
      );
    }
  }
};

export const setOutputLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  limit: number,
): Promise<void> => {
  if (adapter.mqttClient && productKey && deviceKey) {
    if (adapter.config.useLowVoltageBlock) {
      const lowVoltageBlockState = await adapter.getStateAsync(
        productKey + "." + deviceKey + ".control.lowVoltageBlock",
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

        // 'iot/{auth.productKey}/{auth.deviceKey}/properties/write' == Topic? Oder productKey,deviceKey aus Device Details?
        const topic = `iot/${productKey}/${deviceKey}/properties/write`;

        const outputlimit = { properties: { outputLimit: limit } };
        adapter.log.debug(
          `[setOutputLimit] Setting Output Limit for device key ${deviceKey} to ${limit}!`,
        );
        adapter.mqttClient?.publish(topic, JSON.stringify(outputlimit));
      } else {
        adapter.log.debug(
          `[setOutputLimit] Output Limit for device key ${deviceKey} is already at ${limit}!`,
        );
      }
    }
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
    adapter.log.debug("[connectMqttClient] Connecting to MQTT client...");
    adapter.mqttClient = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options,
    ); // create a client

    if (adapter && adapter.mqttClient) {
      adapter.mqttClient.on("connect", onConnected);
      adapter.mqttClient.on("error", onError);

      adapter.log.debug(
        `[connectMqttClient] Found ${adapter.deviceList.length} SolarFlow devices.`,
      );

      // Subscribe to Topic (appkey von Zendure)
      adapter.deviceList.forEach((device: ISolarFlowDeviceDetails) => {
        // States erstellen
        if (adapter) {
          createSolarFlowStates(adapter, device.productKey, device.deviceKey);

          // Set electricLevel (soc) from device details.
          updateSolarFlowState(
            adapter,
            device.productKey,
            device.deviceKey,
            "electricLevel",
            device.electricity,
          );

          const reportTopic = `/${device.productKey}/${device.deviceKey}/properties/report`;
          const iotTopic = `iot/${device.productKey}/${device.deviceKey}/#`;

          adapter.log.debug(
            `[connectMqttClient] Subscribing to MQTT Topic: ${reportTopic}`,
          );
          adapter.mqttClient?.subscribe(reportTopic, onSubscribe);
          adapter.log.debug(
            `[connectMqttClient] Subscribing to MQTT Topic: ${iotTopic}`,
          );
          adapter.mqttClient?.subscribe(iotTopic, onSubscribe);
        }
      });

      adapter.mqttClient.on("message", onMessage);
    }
  }
};
