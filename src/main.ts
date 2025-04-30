/* eslint-disable @typescript-eslint/indent */
/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import {
  connectCloudMqttClient,
  connectLocalMqttClient,
  setAcMode,
  setAcSwitch,
  setAutoModel,
  setAutoRecover,
  setBuzzerSwitch,
  setChargeLimit,
  setDcSwitch,
  setDischargeLimit,
  setHubState,
  setInputLimit,
  setOutputLimit,
  setPassMode,
} from "./services/mqttService";
import { getDeviceList, login } from "./services/webService";
import { ISolarFlowDeviceDetails } from "./models/ISolarFlowDeviceDetails";
import { ISolarFlowPaths } from "./models/ISolarFlowPaths";
import { pathsEu, pathsGlobal } from "./constants/paths";
import { Job } from "node-schedule";
import { MqttClient } from "mqtt";
import {
  checkDevicesServer,
  updateSolarFlowState,
} from "./services/adapterService";
import { createSolarFlowStates } from "./helpers/createSolarFlowStates";
import { createDeveloperAccount } from "./services/fallbackWebService";
import { ISolarFlowDevRegisterData } from "./models/ISolarflowDevRegisterResponse";
import { connectFallbackMqttClient } from "./services/fallbackMqttService";
import { IPack2Device } from "./models/IPack2Device";
import { startRefreshAccessTokenTimerJob } from "./services/jobSchedule";

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

  public userId: string | undefined = undefined; // User ID, needed for connection with Smart Plug
  public accessToken: string | undefined = undefined; // Access Token for Zendure Rest API
  public deviceList: ISolarFlowDeviceDetails[] = [];
  public paths: ISolarFlowPaths | undefined = undefined;
  public pack2Devices: IPack2Device[] = [];

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

    // Select paths by config value
    if (this.config.server && this.config.server == "eu") {
      this.paths = pathsEu;
    } else {
      this.paths = pathsGlobal;
    }

    this.log.debug("[onReady] Using server " + this.config.server);

    this.setState("info.errorMessage", "", true);

    if (this.config.server == "local") {
      this.log.debug("[onReady] Using local MQTT server");

      connectLocalMqttClient(this);

      if (this.config.useRestart) {
        // Add interval to restart adapter every 3 hours
        startRefreshAccessTokenTimerJob(this);
      }
    } else if (this.config.useFallbackService && this.config.snNumber) {
      this.log.debug("[onReady] Using Fallback Mode (Dev-Server)");
      // Use Fallback service. Using the developer version of the MQTT and Webservice from zendure
      createDeveloperAccount(this).then((data: ISolarFlowDevRegisterData) => {
        //console.log(data);
        if (data.appKey && data.mqttUrl && data.port && data.secret) {
          connectFallbackMqttClient(
            this,
            data.appKey,
            data.secret,
            data.mqttUrl,
            data.port
          );
        }
      });
    } else if (
      !this.config.useFallbackService &&
      this.config.userName &&
      this.config.password
    ) {
      // App mode: If Username and Password is provided, try to login and get the access token.
      let _accessToken: string | undefined = undefined;
      let retryCounter = 0;

      if (this.config.useRestart) {
        // Add interval to restart adapter every 3 hours
        startRefreshAccessTokenTimerJob(this);
      }

      while (retryCounter <= 10) {
        try {
          _accessToken = await login(this);
        } catch (ex: any) {
          this.setState("info.message", ex.message, true);
          if (ex.message.includes("Request failed with status code 400")) {
            this.log.warn(
              `[onReady] Error 400, maybe your credentials are invalid!`
            );
            break;
          } else {
            this.log.error(
              `[onReady] Error connecting to Zendure Cloud. Error: ${ex.message}`
            );
          }
        }

        if (_accessToken != undefined) {
          this.accessToken = _accessToken;
          break;
        }

        retryCounter++;

        const milliseconds = 4000 * retryCounter;

        this.log.warn(
          `[onReady] Retrying to connect to Zendure Cloud in ${milliseconds / 1000} seconds (Retry #${retryCounter} of 10).`
        );

        // Add a small sleep
        await new Promise(
          (r) =>
            (this.retryTimeout = this.setTimeout(r, milliseconds, undefined))
        );
      }

      if (_accessToken != undefined) {
        this.setState("info.connection", true, true);
        this.lastLogin = new Date();

        // Try to get the device list
        getDeviceList(this)
          .then(async (result: ISolarFlowDeviceDetails[]) => {
            if (result) {
              // Device List found. Save in the adapter properties and connect to MQTT

              // Filtering to SolarFlow devices
              this.deviceList = result.filter(
                (device) =>
                  device.productName.toLowerCase().includes("solarflow") ||
                  device.productName.toLowerCase().includes("hyper") ||
                  device.productName.toLowerCase() == "ace 1500" ||
                  device.productName.toLowerCase().includes("smart plug")
              );

              await checkDevicesServer(this);

              this.log.info(
                `[onReady] Found ${this.deviceList.length} SolarFlow device(s).`
              );

              await this.deviceList.forEach(
                async (device: ISolarFlowDeviceDetails) => {
                  let type = "solarflow";

                  if (
                    device.productName.toLocaleLowerCase().includes("hyper")
                  ) {
                    type = "hyper";
                  } else if (
                    device.productName.toLocaleLowerCase().includes("ace")
                  ) {
                    type = "ace";
                  } else if (
                    device.productName.toLocaleLowerCase().includes("aio")
                  ) {
                    type = "aio";
                  } else if (
                    device.productName
                      .toLocaleLowerCase()
                      .includes("smart plug")
                  ) {
                    //console.log(device);
                    type = "smartPlug";
                  }

                  // Check if has subdevice e.g. ACE?
                  if (device.packList && device.packList.length > 0) {
                    device.packList.forEach(async (subDevice) => {
                      if (
                        subDevice.productName.toLocaleLowerCase() == "ace 1500"
                      ) {
                        device._connectedWithAce = true;
                        // States erstellen
                        await createSolarFlowStates(this, subDevice, "ace");

                        await updateSolarFlowState(
                          this,
                          subDevice.productKey,
                          subDevice.deviceKey,
                          "registeredServer",
                          this.config.server
                        );
                      }
                    });
                  }

                  // States erstellen
                  await createSolarFlowStates(this, device, type);

                  if (
                    !device.productName.toLowerCase().includes("smart plug")
                  ) {
                    await updateSolarFlowState(
                      this,
                      device.productKey,
                      device.deviceKey,
                      "registeredServer",
                      this.config.server
                    );
                  } else if (this?.userId && device.id) {
                    await updateSolarFlowState(
                      this,
                      this.userId,
                      device.id?.toString(),
                      "registeredServer",
                      this.config.server
                    );
                  }
                }
              );

              connectCloudMqttClient(this);
            }
          })
          .catch(() => {
            this.setState("info.connection", false, true);
            this.log?.error("[onReady] Retrieving device failed!");
          });
      }
    } else {
      this.setState("info.connection", false, true);
      this.log.error("[onReady] No Login Information provided!");
      //this.stop?.();
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
      //this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

      // Read product and device key from string
      const splitted = id.split(".");
      const productKey = splitted[2];
      const deviceKey = splitted[3];
      const stateName1 = splitted[4];
      const stateName2 = splitted[5];

      if (this.config.useFallbackService && stateName1 == "control") {
        this.log.warn(
          `[onStateChange] Using Fallback server, control of Solarflow device is not possible!`
        );
      }
      // !!! Only stateChanges with ack==false are allowed to be processed.
      else if (state.val != undefined && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            if (stateName2 == "setOutputLimit") {
              setOutputLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "setInputLimit") {
              setInputLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dischargeLimit") {
              setDischargeLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "chargeLimit") {
              setChargeLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "passMode") {
              setPassMode(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dcSwitch") {
              setDcSwitch(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "acSwitch") {
              setAcSwitch(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "acMode") {
              setAcMode(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "hubState") {
              setHubState(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "autoModel") {
              setAutoModel(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "autoRecover") {
              setAutoRecover(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
            } else if (stateName2 == "buzzerSwitch") {
              setBuzzerSwitch(
                this,
                productKey,
                deviceKey,
                state.val ? true : false
              );
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
