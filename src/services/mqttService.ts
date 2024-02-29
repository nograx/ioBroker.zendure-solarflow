/* eslint-disable @typescript-eslint/indent */
import { MqttClient } from "mqtt";
import * as mqtt from "mqtt";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import {
  addOrUpdatePackData,
  createSolarFlowStates,
  updateSolarFlowState,
} from "./adapterService";
import { toHoursAndMinutes } from "../helpers/timeHelper";

let client: MqttClient | undefined = undefined;
let adapter: ZendureSolarflow | undefined = undefined;

const onConnected = (): void => {
  adapter?.log.info("Connected with MQTT!");
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
      obj.properties?.remainInputTime != null &&
      obj.properties?.remainInputTime != undefined
    ) {
      updateSolarFlowState(
        adapter,
        productKey,
        deviceKey,
        "remainInputTime",
        obj.properties.remainInputTime,
      );

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

  if (client) {
    //client.end();
  }
};

export const setChargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  socSet: number,
): Promise<void> => {
  if (client && productKey && deviceKey) {
    if (socSet > 40 && socSet <= 100) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { socSet: socSet * 10 } };
      adapter.log.debug(
        `Setting ChargeLimit for device key ${deviceKey} to ${socSet}!`,
      );
      client?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(`Charge limit is not in range 40<>100!`);
    }
  }
};

export const setDischargeLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  minSoc: number,
): Promise<void> => {
  if (client && productKey && deviceKey) {
    if (minSoc > 0 && minSoc < 90) {
      const topic = `iot/${productKey}/${deviceKey}/properties/write`;

      const socSetLimit = { properties: { minSoc: minSoc * 10 } };
      adapter.log.debug(
        `Setting Discharge Limit for device key ${deviceKey} to ${minSoc}!`,
      );
      client?.publish(topic, JSON.stringify(socSetLimit));
    } else {
      adapter.log.debug(`Discharge limit is not in range 0<>90!`);
    }
  }
};

export const setOutputLimit = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  limit: number,
): Promise<void> => {
  if (client && productKey && deviceKey) {
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
          `Setting Output Limit for device key ${deviceKey} to ${limit}!`,
        );
        client?.publish(topic, JSON.stringify(outputlimit));
      } else {
        adapter.log.debug(
          `Output Limit for device key ${deviceKey} is already at ${limit}!`,
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
    password: "oK#PCgy6OZxd",
    clean: true,
    protocolVersion: 5,
  };

  if (mqtt && adapter && adapter.paths) {
    client = mqtt.connect(
      "mqtt://" + adapter.paths.mqttUrl + ":" + adapter.paths.mqttPort,
      options,
    ); // create a client

    if (client && adapter) {
      client.on("connect", onConnected);
      client.on("error", onError);

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

          adapter.log.debug(`Subscribing to MQTT Topic: ${reportTopic}`);
          client?.subscribe(reportTopic, onSubscribe);
          adapter.log.debug(`Subscribing to MQTT Topic: ${iotTopic}`);
          client?.subscribe(iotTopic, onSubscribe);
        }
      });

      client.on("message", onMessage);
    }
  }
};
