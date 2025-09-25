/* eslint-disable @typescript-eslint/indent */
/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

import { zenLogin } from "./services/zenWebService";
import { Job } from "node-schedule";
import { MqttClient } from "mqtt";
import { startRefreshAccessTokenTimerJob } from "./services/jobSchedule";
import { connectLocalMqttClient } from "./services/mqttLocalService";
import { IZenHaDeviceDetails } from "./models/IZenHaDeviceDetails";
import { connectCloudZenMqttClient } from "./services/mqttCloudZenService";
import { IZenHaMqttData } from "./models/IZenHaMqttData";
import { ZenHaDevice } from "./models/deviceModels/ZenHaDevice";
import { createDeviceModel } from "./helpers/helpers";

export class ZendureSolarflow extends utils.Adapter {
  public constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: "zendure-solarflow",
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }

  public zenHaDeviceList: ZenHaDevice[] = []; // All found devices for this instance will be in this array
  public mqttSettings: IZenHaMqttData | undefined = undefined;

  public msgCounter: number = 700000;
  public lastLogin: Date | undefined = undefined;

  public mqttClient: MqttClient | undefined = undefined;

  public resetValuesJob: Job | undefined = undefined;
  public checkStatesJob: Job | undefined = undefined;
  public calculationJob: Job | undefined = undefined;
  public refreshAccessTokenInterval: ioBroker.Interval | undefined = undefined;
  public retryTimeout: ioBroker.Timeout | undefined = undefined;

  public createdSnNumberSolarflowStates: string[] = [];

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  private async onReady(): Promise<void> {
    await this.extendObject("info", {
      type: "channel",
      common: {
        name: "Information",
      },
      native: {},
    });

    await this.extendObject(`info.connection`, {
      type: "state",
      common: {
        name: {
          de: "Mit Zendure Cloud verbunden",
          en: "Connected to Zendure cloud",
        },
        type: "boolean",
        desc: "connection",
        role: "indicator.connected",
        read: true,
        write: false,
      },
      native: {},
    });

    await this.extendObject(`info.errorMessage`, {
      type: "state",
      common: {
        name: {
          de: "Fehlermeldung der Verbindung zur Zendure Cloud",
          en: "Error message from Zendure Cloud",
        },
        type: "string",
        desc: "errorMessage",
        role: "value",
        read: true,
        write: false,
      },
      native: {},
    });

    this.setState("info.errorMessage", "", true);
    this.setState("info.connection", false, true);

    switch (this.config.connectionMode) {
      case "authKey":
        this.log.debug("[onReady] Using Authorization Cloud Key");
        const data = await zenLogin(this);

        if (typeof data === "string" || data == undefined) {
          // Fehler
          this.setState("info.connection", false, true);
        } else {
          this.mqttSettings = data.mqtt;

          if (!connectCloudZenMqttClient(this)) {
            return;
          }

          this.log.debug(
            `[onReady] Creating ${data.deviceList.length} devices...`
          );

          await data.deviceList.forEach(async (device: IZenHaDeviceDetails) => {
            // States erstellen
            const deviceModel = createDeviceModel(
              this,
              device.productKey,
              device.deviceKey,
              device
            );

            if (deviceModel) {
              this.zenHaDeviceList.push(deviceModel);
            }
          });
        }
        break;
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");

        connectLocalMqttClient(this);

        // Subscribe to 1. device from local settings
        if (
          this.config.localDevice1ProductKey &&
          this.config.localDevice1DeviceKey
        ) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice1ProductKey,
            this.config.localDevice1DeviceKey
          );

          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 2. device from local settings
        if (
          this.config.localDevice2ProductKey &&
          this.config.localDevice2DeviceKey
        ) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice2ProductKey,
            this.config.localDevice2DeviceKey
          );

          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 3. device from local settings
        if (
          this.config.localDevice3ProductKey &&
          this.config.localDevice3DeviceKey
        ) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice3ProductKey,
            this.config.localDevice3DeviceKey
          );

          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 4. device from local settings
        if (
          this.config.localDevice4ProductKey &&
          this.config.localDevice4DeviceKey
        ) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice4ProductKey,
            this.config.localDevice4DeviceKey
          );

          if (deviceModel) {
            this.zenHaDeviceList.push(deviceModel);
          }
        }

        if (this.config.useRestart) {
          // Add interval to restart adapter every 3 hours
          startRefreshAccessTokenTimerJob(this);
        }
        break;
      }
      default:
        this.setState("info.connection", false, true);
        this.log.error("[onReady] No connection mode found or mode invalid!");
        break;
    }
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  private async onUnload(callback: () => void): Promise<void> {
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }

      try {
        await this.mqttClient?.endAsync();
        this.log.info("[onUnload] MQTT client stopped!");
        this.mqttClient = undefined;
      } catch (ex: any) {
        this.log.error("[onUnload] Error stopping MQTT client: !" + ex.message);
      }

      this.setState("info.connection", false, true);

      // Scheduler beenden
      if (this.resetValuesJob) {
        this.resetValuesJob.cancel();
        this.resetValuesJob = undefined;
      }

      if (this.checkStatesJob) {
        this.checkStatesJob?.cancel();
        this.checkStatesJob = undefined;
      }

      if (this.calculationJob) {
        this.calculationJob.cancel();
        this.calculationJob = undefined;
      }

      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
      }

      callback();
    } catch (e) {
      callback();
    }
  }

  /**
   * Is called if a subscribed state changes
   */
  private onStateChange(
    id: string,
    state: ioBroker.State | null | undefined
  ): void {
    if (state) {
      // The state was changed

      // Read product and device key from string
      const splitted = id.split(".");
      const productKey = splitted[2]; // Product Key
      const deviceKey = splitted[3]; // Device Key
      const stateName1 = splitted[4]; // Folder/State Name 1 (e.g. 'control')
      const stateName2 = splitted[5]; // State Name, like 'setOutputLimit'

      const _device = this.zenHaDeviceList.find(
        (x) => x.productKey == productKey && x.deviceKey == deviceKey
      );

      if (!_device) {
        this.log.error(
          `[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`
        );
        return;
      }

      // !!! Only stateChanges with ack==false are allowed to be processed.
      if (state.val != undefined && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            this.log.debug(
              `[onStateChange] Control state '${stateName2}' changed, new value is ${state.val}, ack = ${state.ack}!`
            );
            switch (stateName2) {
              case "setOutputLimit":
                _device.setOutputLimit(Number(state.val));
                break;
              case "setInputLimit":
                _device.setInputLimit(Number(state.val));
                break;
              case "chargeLimit":
                _device.setChargeLimit(Number(state.val));
                break;
              case "dischargeLimit":
                _device.setDischargeLimit(Number(state.val));
                break;
              case "passMode":
                _device.setPassMode(Number(state.val));
                break;
              case "dcSwitch":
                _device.setDcSwitch(state.val ? true : false);
                break;
              case "acSwitch":
                _device.setAcSwitch(state.val ? true : false);
                break;
              case "acMode":
                _device.setAcMode(Number(state.val));
                break;
              case "hubState":
                _device.setHubState(Number(state.val));
                break;
              case "autoModel":
                _device.setAutoModel(Number(state.val));
                break;
              case "autoRecover":
                _device.setAutoRecover(state.val ? true : false);
                break;
              case "buzzerSwitch":
                _device.setBuzzerSwitch(state.val ? true : false);
                break;
              case "smartMode":
                _device.setSmartMode(state.val ? true : false);
                break;
              case "setDeviceAutomationInOutLimit":
                _device.setDeviceAutomationInOutLimit(Number(state.val));
                break;
            }
            break;
          default:
            break;
        }
      } else {
        // The state was deleted
        //this.log.debug(`state ${id} deleted`);
      }
    }
  }
}

if (require.main !== module) {
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) =>
    new ZendureSolarflow(options);
} else {
  // otherwise start the instance directly
  (() => new ZendureSolarflow())();
}
