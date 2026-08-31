/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

import { zenLogin } from "./services/zenWebService";
import type { Job } from "node-schedule";
import {
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startRefreshAccessTokenTimerJob,
  startResetValuesJob,
  startZenSdkDataRefreshJob,
} from "./services/jobSchedule";
import { LocalMqttService } from "./services/mqtt/localMqttService";
import type { IZenIobDeviceDetails } from "./models/IZenIobDeviceDetails";
import { CloudMqttService } from "./services/mqtt/cloudMqttService";
import type { IZenIobMqttData } from "./models/IZenIobMqttData";
import type { ZenIobDevice } from "./models/deviceModels/ZenIobDevice";
import { createDeviceModel } from "./helpers/helpers";
import { FileHelper } from "./helpers/fileHelper";
import { discoverZendureDevicesViaMdns } from "./helpers/mdnsHelper";

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

  public zenIobDeviceList: ZenIobDevice[] = []; // All found devices for this instance will be in this array
  public mqttSettings: IZenIobMqttData | undefined = undefined;

  public lastLogin: Date | undefined = undefined;

  public localMqttService: LocalMqttService | undefined = undefined;
  public cloudMqttService: CloudMqttService | undefined = undefined;

  public resetValuesJob: Job | undefined = undefined;
  public checkStatesJob: Job | undefined = undefined;
  public calculationJob: Job | undefined = undefined;
  public zenSdkDataRefreshJob: Job | undefined = undefined;

  public refreshAccessTokenInterval: ioBroker.Interval | undefined = undefined;
  public retryTimeout: ioBroker.Timeout | undefined = undefined;

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  private async onReady(): Promise<void> {
    // Migration: 'useMdnsDiscovery' now defaults to enabled for new instances (see io-package.json), but
    // existing instances configured before this setting existed have no value saved for it at all. Self-heal
    // those once, so they also get mDNS discovery enabled by default instead of silently staying disabled.
    if (this.config.useMdnsDiscovery === undefined) {
      this.config.useMdnsDiscovery = true;
      await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, { native: { useMdnsDiscovery: true } });
      this.log.info("[onReady] Enabled mDNS discovery by default (was not previously configured)!");
    }

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
      case "authKey": {
        this.log.debug("[onReady] Using Authorization Cloud Key");

        if (this.config.useMdnsDiscovery) {
          discoverZendureDevicesViaMdns(this);
        } else {
          this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
        }

        if (!this.config.authorizationCloudKey) {
          this.log.error("[zenWebService.login] authorization cloud key is missing!");
          break;
        }

        const fileHelper = new FileHelper(this);
        let deviceList: IZenIobDeviceDetails[] | undefined;
        const data = await zenLogin(this);

        if (typeof data === "string" || data == undefined) {
          // Error, try to read device list from file, if possible. This allows the adapter to continue working with the last known devices, even if the connection to Zendure Cloud is currently not possible (e.g. due to network issues).
          this.setState("info.connection", false, true);

          fileHelper
            .readDeviceListFromFile()
            .then((data) => {
              if (data) {
                deviceList = data;

                this.log.debug(
                  "[onReady] No connection to Zendure Cloud possible, but device list found in file. Using device list from file.",
                );
              } else {
                this.log.error(
                  "[onReady] No connection to Zendure Cloud possible and no device list found in file. Cannot continue.",
                );
                return;
              }
            })
            .catch((err) => {
              this.log.error(
                `[onReady] No connection to Zendure Cloud possible and error reading device list from file: ${err.message}. Cannot continue.`,
              );
              return;
            });
        } else {
          // Connection successful, continue as normal
          this.mqttSettings = data.mqtt;

          this.cloudMqttService = new CloudMqttService(this);

          // Connect to cloud MQTT client
          if (!this.cloudMqttService.connect()) {
            this.log.error("[onReady] Could not connect to MQTT cloud server!");
          } else {
            deviceList = data.deviceList;

            if (deviceList.length == 0) {
              this.log.warn("[onReady] device list is empty!");
            }

            // Save device list to file
            void fileHelper.writeDeviceListToFile(deviceList);
          }

          // If enabled, also start local MQTT client
          if (this.config.useAddionalLocalMqtt) {
            this.localMqttService = new LocalMqttService(this);
            if (!this.localMqttService.connect()) {
              this.log.error("[onReady] Could not connect to MQTT local server!");
            }
          }
        }

        // Process device list, if available. If connection to cloud was successful, this is the fresh list from the cloud. If not, this is the last known list from file (if available).
        if (deviceList) {
          this.log.debug(`[onReady] Creating ${deviceList.length} devices...`);
          deviceList.forEach((device: IZenIobDeviceDetails) => {
            // Create states
            const deviceModel = createDeviceModel(this, device.productKey, device.deviceKey, device);

            if (deviceModel) {
              this.zenIobDeviceList.push(deviceModel);
            } else {
              this.log.error(
                `[onReady] Error creating device with productKey '${device.productKey}' / deviceKey '${device.deviceKey}' / productModel '${device.productModel}'`,
              );
            }
          });
        }

        // Devices discovered via mDNS are always zenSDK-only devices (see discoverZendureDevicesViaMdns), and may
        // be created after this point (mDNS discovery runs for up to 10s), so we start the job whenever zenSDK is
        // enabled at all rather than checking zenIobDeviceList for a zenSDK device right now.
        if (this.config.useZenSDK) {
          startZenSdkDataRefreshJob(this);
        }

        break;
      }
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");

        if (this.config.useMdnsDiscovery) {
          discoverZendureDevicesViaMdns(this);
        } else {
          this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
        }

        // Connect to local MQTT client, if one is configured. A pure mDNS + zenSDK setup (no legacy devices) doesn't
        // need one - startJobs() below is normally triggered by a successful MQTT connection, so we start those
        // jobs directly in that case instead.
        if (this.config.localMqttUrl) {
          this.localMqttService = new LocalMqttService(this);
          if (!this.localMqttService.connect()) {
            this.log.error("[onReady] Could not connect to MQTT local server!");
          }
        } else {
          startResetValuesJob(this);
          startCheckStatesAndConnectionJob(this);
          if (this.config.useCalculation) {
            startCalculationJob(this);
          }
        }

        // Subscribe to 1. device from local settings
        if (this.config.localDevice1ProductKey && this.config.localDevice1DeviceKey) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice1ProductKey,
            this.config.localDevice1DeviceKey,
          );

          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 2. device from local settings
        if (this.config.localDevice2ProductKey && this.config.localDevice2DeviceKey) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice2ProductKey,
            this.config.localDevice2DeviceKey,
          );

          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 3. device from local settings
        if (this.config.localDevice3ProductKey && this.config.localDevice3DeviceKey) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice3ProductKey,
            this.config.localDevice3DeviceKey,
          );

          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }

        // Subscribe to 4. device from local settings
        if (this.config.localDevice4ProductKey && this.config.localDevice4DeviceKey) {
          // States erstellen
          const deviceModel = createDeviceModel(
            this,
            this.config.localDevice4ProductKey,
            this.config.localDevice4DeviceKey,
          );

          if (deviceModel) {
            this.zenIobDeviceList.push(deviceModel);
          }
        }

        if (this.config.useRestart) {
          // Add interval to restart adapter every 3 hours
          startRefreshAccessTokenTimerJob(this);
        }

        // Devices discovered via mDNS are always zenSDK-only devices (see discoverZendureDevicesViaMdns), and are
        // created asynchronously as they're found, so we can't check zenIobDeviceList for a zenSDK device yet here.
        if (this.config.useZenSDK) {
          startZenSdkDataRefreshJob(this);
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
   *
   * @param callback
   */
  private async onUnload(callback: () => void): Promise<void> {
    try {
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }

      // Stop MQTT Cloud client
      try {
        await this.cloudMqttService?.mqttClient?.endAsync();
        this.log.info("[onUnload] MQTT cloud client stopped!");
        this.cloudMqttService = undefined;
      } catch (ex: any) {
        this.log.error(`[onUnload] Error stopping MQTT cloud client: !${ex.message}`);
      }

      // Stop MQTT Local client
      try {
        await this.localMqttService?.mqttClient?.endAsync();
        this.log.info("[onUnload] MQTT local client stopped!");
        this.localMqttService = undefined;
      } catch (ex: any) {
        this.log.error(`[onUnload] Error stopping MQTT local client: !${ex.message}`);
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

      if (this.zenSdkDataRefreshJob) {
        this.zenSdkDataRefreshJob.cancel();
        this.zenSdkDataRefreshJob = undefined;
      }

      this.zenIobDeviceList.forEach((device) => device.stopZenSdkPollingSchedule());

      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
      }

      callback();
    } catch {
      callback();
    }
  }

  /**
   * Is called if a subscribed state changes
   *
   * @param id
   * @param state
   */
  private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
    if (state) {
      // The state was changed

      // Read product and device key from string
      const splitted = id.split(".");
      const productKey = splitted[2]; // Product Key
      const deviceKey = splitted[3]; // Device Key
      const stateName1 = splitted[4]; // Folder/State Name 1 (e.g. 'control')
      const stateName2 = splitted[5]; // State Name, like 'setOutputLimit'

      const _device = this.zenIobDeviceList.find((x) => x.productKey == productKey && x.deviceKey == deviceKey);

      if (!_device) {
        this.log.error(`[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`);
        return;
      }

      // !!! Only stateChanges with ack==false are allowed to be processed.
      if (state.val != undefined && state.val != null && !state.ack) {
        switch (stateName1) {
          case "control":
            this.log.debug(
              `[onStateChange] Control state '${stateName2}' changed, new value is ${state.val}, ack = ${state.ack}!`,
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
              case "gridReverse":
                _device.setGridReverse(Number(state.val));
                break;
              case "gridOffMode":
                _device.setGridOffMode(Number(state.val));
                break;
              case "autoModel":
                _device.setAutoModel(Number(state.val));
                break;
              case "autoRecover":
                _device.setAutoRecover(state.val ? true : false);
                break;
              case "inverseMaxPower":
                _device.setInverseMaxPower(Number(state.val));
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
              case "hemsState":
                _device.setHemsState(state.val ? true : false);
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
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new ZendureSolarflow(options);
} else {
  // otherwise start the instance directly
  (() => new ZendureSolarflow())();
}
