/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

import { zenLogin } from "./services/zenWebService";
import type { Job } from "node-schedule";
import {
  startAdapterAutomationJob,
  startCalculationJob,
  startCheckStatesAndConnectionJob,
  startRefreshAccessTokenTimerJob,
  startResetValuesJob,
  startZenSdkDataRefreshJob,
} from "./services/jobSchedule";
import {
  resetAdapterAutomationController,
  runZeroFeedInAutomation,
  stopAdapterAutomation,
  stopDeviceAutomation,
} from "./services/adapterAutomation/adapterAutomation";
import { LocalMqttService } from "./services/mqtt/localMqttService";
import type { IZenIobDeviceDetails } from "./models/IZenIobDeviceDetails";
import { CloudMqttService } from "./services/mqtt/cloudMqttService";
import { MdnsDiscoveryService } from "./services/mdnsDiscoveryService";
import type { IZenIobMqttData } from "./models/IZenIobMqttData";
import type { ZenIobDevice } from "./models/deviceModels/ZenIobDevice";
import { createDeviceModel } from "./helpers/helpers";
import { FileHelper } from "./helpers/fileHelper";

// Maps each writable '<device>.control.<stateName>' to the device method that sends it to the device.
const CONTROL_STATE_HANDLERS: Record<string, (device: ZenIobDevice, value: ioBroker.StateValue) => unknown> = {
  setOutputLimit: (device, value) => device.setOutputLimit(Number(value)),
  setInputLimit: (device, value) => device.setInputLimit(Number(value)),
  chargeLimit: (device, value) => device.setChargeLimit(Number(value)),
  dischargeLimit: (device, value) => device.setDischargeLimit(Number(value)),
  passMode: (device, value) => device.setPassMode(Number(value)),
  dcSwitch: (device, value) => device.setDcSwitch(Boolean(value)),
  acSwitch: (device, value) => device.setAcSwitch(Boolean(value)),
  acMode: (device, value) => device.setAcMode(Number(value)),
  hubState: (device, value) => device.setHubState(Number(value)),
  gridReverse: (device, value) => device.setGridReverse(Number(value)),
  gridOffMode: (device, value) => device.setGridOffMode(Number(value)),
  autoModel: (device, value) => device.setAutoModel(Number(value)),
  autoRecover: (device, value) => device.setAutoRecover(Boolean(value)),
  inverseMaxPower: (device, value) => device.setInverseMaxPower(Number(value)),
  buzzerSwitch: (device, value) => device.setBuzzerSwitch(Boolean(value)),
  smartMode: (device, value) => device.setSmartMode(Boolean(value)),
  setDeviceAutomationInOutLimit: (device, value) => device.setDeviceAutomationInOutLimit(Number(value)),
  hemsState: (device, value) => device.setHemsState(Boolean(value)),
};

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
  public mdnsDiscoveryService: MdnsDiscoveryService | undefined = undefined;

  public resetValuesJob: Job | undefined = undefined;
  public checkStatesJob: Job | undefined = undefined;
  public calculationJob: Job | undefined = undefined;
  public zenSdkDataRefreshJob: Job | undefined = undefined;
  public adapterAutomationMetricsJob: Job | undefined = undefined;
  public adapterAutomationSortJob: Job | undefined = undefined;

  public refreshAccessTokenInterval: ioBroker.Interval | undefined = undefined;
  public retryTimeout: ioBroker.Timeout | undefined = undefined;
  public deviceStatisticsTimeout: ioBroker.Timeout | undefined = undefined;
  public deviceStatisticsInterval: ioBroker.Interval | undefined = undefined;

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

    if (this.config.enableAutomation) {
      await this.extendObject("adapterAutomation", {
        type: "channel",
        common: {
          name: {
            de: "Adapter-Automatisierung",
            en: "Adapter automation",
          },
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.automationEnabled", {
        type: "state",
        common: {
          name: {
            de: "Automatisierung aktiv",
            en: "Automation enabled",
          },
          type: "boolean",
          desc: "automationEnabled",
          role: "switch.enable",
          read: true,
          write: true,
          def: false,
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.ignoreSuggestedInverseMaxPower", {
        type: "state",
        common: {
          name: {
            de: "Vom Adapter empfohlene maximale Ausgangsleistung ignorieren",
            en: "Ignore suggested maximum inverter output power",
          },
          type: "boolean",
          desc: "ignoreSuggestedInverseMaxPower",
          role: "switch.enable",
          read: true,
          write: true,
          def: false,
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.setPoint", {
        type: "state",
        common: {
          name: {
            de: "Sollwert Netzeinspeisung",
            en: "Grid feed-in setpoint",
          },
          type: "number",
          desc: "setPoint",
          role: "level.power",
          read: true,
          write: true,
          unit: "W",
          def: 10,
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.setPointNearlyFull", {
        type: "state",
        common: {
          name: {
            de: "Sollwert Netzeinspeisung bei nahezu vollen Batterien",
            en: "Grid feed-in setpoint when batteries are nearly full",
          },
          type: "number",
          desc: "setPointNearlyFull",
          role: "level.power",
          read: true,
          write: true,
          unit: "W",
          def: -100,
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.acOnlyPenalty", {
        type: "state",
        common: {
          name: {
            de: "Bewertungsabschlag für reine AC-Geräte",
            en: "Score penalty for AC-only devices",
          },
          type: "number",
          desc: "acOnlyPenalty",
          role: "level",
          read: true,
          write: true,
          unit: "%",
          min: 0,
          def: 50,
        },
        native: {},
      });

      await this.extendObject("adapterAutomation.deviceOrder", {
        type: "state",
        common: {
          name: {
            de: "Gerätereihenfolge",
            en: "Device order",
          },
          type: "string",
          desc: "deviceOrder",
          role: "text",
          read: true,
          write: false,
        },
        native: {},
      });

      const ensureDefaultValue = async (id: string, def: boolean | number): Promise<void> => {
        const current = await this.getStateAsync(id);
        if (current?.val == null) {
          await this.setState(id, def, true);
        }
      };

      await ensureDefaultValue("adapterAutomation.automationEnabled", false);
      await ensureDefaultValue("adapterAutomation.ignoreSuggestedInverseMaxPower", false);
      await ensureDefaultValue("adapterAutomation.setPoint", 10);
      await ensureDefaultValue("adapterAutomation.setPointNearlyFull", -100);
      await ensureDefaultValue("adapterAutomation.acOnlyPenalty", 50);
    }

    switch (this.config.connectionMode) {
      case "authKey": {
        this.log.debug("[onReady] Using Authorization Cloud Key");

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

          // Must be awaited: the device list is processed right below
          try {
            const fileDeviceList = await fileHelper.readDeviceListFromFile();

            if (fileDeviceList) {
              deviceList = fileDeviceList;

              this.log.info(
                "[onReady] No connection to Zendure Cloud possible, but device list found in file. Using device list from file.",
              );
            } else {
              this.log.error("[onReady] No connection to Zendure Cloud possible and no device list found in file!");
            }
          } catch (err: any) {
            this.log.error(
              `[onReady] No connection to Zendure Cloud possible and error reading device list from file: ${err?.message}!`,
            );
          }
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
              const message = `[onReady] Error creating device with productKey '${device.productKey}' / deviceKey '${device.deviceKey}' / productModel '${device.productModel}'`;
              this.log.error(message);

              // Report unknown device to Sentry
              if (this.supportsFeature && this.supportsFeature("PLUGINS")) {
                const sentryInstance = this.getPluginInstance("sentry");
                sentryInstance?.getSentryObject()?.captureMessage(message, "error");
              }
            }
          });
        }

        // Started after the device list was processed, so discovered devices are matched against the known devices
        // instead of being created a second time
        this.startMdnsDiscovery();

        // Devices discovered via mDNS are always zenSDK-only devices (see handleDiscoveredService), and may be
        // created at any time while the adapter is running, so we start the job whenever zenSDK is enabled at all
        // rather than checking zenIobDeviceList for a zenSDK device right now.
        if (this.config.useZenSDK) {
          startZenSdkDataRefreshJob(this);
        }

        break;
      }
      case "local": {
        this.log.debug("[onReady] Using local MQTT server");

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

        this.startMdnsDiscovery();

        // Devices discovered via mDNS are always zenSDK-only devices (see handleDiscoveredService), and are
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

    if (this.config.enableAutomation) {
      if (this.config.automationTriggerStateId) {
        this.subscribeForeignStates(this.config.automationTriggerStateId);
        this.log.debug(`[onReady] Subscribed to automation trigger state '${this.config.automationTriggerStateId}'!`);
      }

      this.subscribeStates("adapterAutomation.automationEnabled");

      startAdapterAutomationJob(this);
    }

    // Report used device classes to Sentry. First report is delayed, as mDNS discovered devices are created asynchronously.
    this.deviceStatisticsTimeout = this.setTimeout(
      () => {
        this.reportDeviceStatistics();
        this.deviceStatisticsInterval = this.setInterval(() => this.reportDeviceStatistics(), 24 * 60 * 60 * 1000);
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Starts the continuous mDNS discovery of Zendure devices, if enabled.
   */
  private startMdnsDiscovery(): void {
    if (!this.config.useMdnsDiscovery) {
      this.log.info(`[onReady] mDNS discovery of zenSDK devices is disabled!`);
      return;
    }

    this.mdnsDiscoveryService = new MdnsDiscoveryService(this);
    this.mdnsDiscoveryService.start();
  }

  /**
   * Reports each used device class (once per instance) to Sentry, to get statistics about the used devices.
   */
  private reportDeviceStatistics(): void {
    if (!this.supportsFeature || !this.supportsFeature("PLUGINS")) {
      return;
    }

    const sentry = this.getPluginInstance("sentry")?.getSentryObject();
    if (!sentry) {
      return;
    }

    const reported = new Set<string>();
    this.zenIobDeviceList.forEach((device) => {
      const deviceClass = device.constructor.name;
      if (reported.has(deviceClass)) {
        return;
      }
      reported.add(deviceClass);

      sentry.withScope((scope: any) => {
        scope.setLevel("info");
        scope.setTag("deviceClass", deviceClass);
        scope.setTag("productKey", device.productKey);
        scope.setTag("productName", device.productName);
        scope.setTag("connectionMode", this.config.connectionMode);
        scope.setFingerprint(["device-statistics", deviceClass]);
        sentry.captureMessage(`Device statistics: ${deviceClass}`);
      });
    });
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback
   */
  private async onUnload(callback: () => void): Promise<void> {
    try {
      // Stop jobs and timers first, so nothing new is published while the MQTT clients are shutting down
      if (this.refreshAccessTokenInterval) {
        this.clearInterval(this.refreshAccessTokenInterval);
      }

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

      if (this.adapterAutomationMetricsJob) {
        this.adapterAutomationMetricsJob.cancel();
        this.adapterAutomationMetricsJob = undefined;
      }

      if (this.adapterAutomationSortJob) {
        this.adapterAutomationSortJob.cancel();
        this.adapterAutomationSortJob = undefined;
      }

      this.zenIobDeviceList.forEach((device) => device.stopZenSdkPollingSchedule());

      // Stop mDNS discovery and release its socket
      this.mdnsDiscoveryService?.stop();
      this.mdnsDiscoveryService = undefined;

      if (this.retryTimeout) {
        this.clearTimeout(this.retryTimeout);
      }

      if (this.deviceStatisticsTimeout) {
        this.clearTimeout(this.deviceStatisticsTimeout);
      }

      if (this.deviceStatisticsInterval) {
        this.clearInterval(this.deviceStatisticsInterval);
      }

      // Stop MQTT clients (cloud and local in parallel, each with a timeout)
      const cloudMqttService = this.cloudMqttService;
      const localMqttService = this.localMqttService;
      this.cloudMqttService = undefined;
      this.localMqttService = undefined;

      const [cloudResult, localResult] = await Promise.allSettled([
        cloudMqttService?.disconnect(),
        localMqttService?.disconnect(),
      ]);

      if (cloudMqttService) {
        if (cloudResult.status === "rejected") {
          this.log.error(`[onUnload] Error stopping MQTT cloud client: ${cloudResult.reason?.message}`);
        } else {
          this.log.info("[onUnload] MQTT cloud client stopped!");
        }
      }

      if (localMqttService) {
        if (localResult.status === "rejected") {
          this.log.error(`[onUnload] Error stopping MQTT local client: ${localResult.reason?.message}`);
        } else {
          this.log.info("[onUnload] MQTT local client stopped!");
        }
      }

      await this.setState("info.connection", false, true);
    } catch {
      // ignore, adapter is shutting down
    } finally {
      callback();
    }
  }

  /**
   * Is called if a subscribed state changes
   *
   * @param id full state id, e.g. 'zendure-solarflow.0.<productKey>.<deviceKey>.control.setOutputLimit'
   * @param state the new state, or null/undefined if it was deleted
   */
  private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
    if (!state) {
      return;
    }

    if (this.config.automationTriggerStateId && id === this.config.automationTriggerStateId) {
      this.onAutomationTriggerStateChange(state);
      return;
    }

    if (id === `${this.namespace}.adapterAutomation.automationEnabled`) {
      this.onAdapterAutomationEnabledChange(state);
      return;
    }

    // Device state: '<namespace>.<productKey>.<deviceKey>.<folder>.<stateName>'
    const [, , productKey, deviceKey, folder, stateName] = id.split(".");

    const device = this.zenIobDeviceList.find((x) => x.productKey == productKey && x.deviceKey == deviceKey);
    if (!device) {
      this.log.error(`[onStateChange] Device '${deviceKey}' not found in zenHaDeviceList!`);
      return;
    }

    // !!! Only commands (ack == false) are processed - acknowledged updates are the adapter's own writes.
    if (state.val == null || state.ack) {
      return;
    }

    if (folder === "control") {
      this.onControlStateChange(device, stateName, state.val);
    } else if (folder === "adapterAutomation" && stateName === "automationEnabled") {
      this.onDeviceAutomationEnabledChange(device, state);
    }
  }

  /**
   * Is called when a device's control state was written (ack == false): forwards the value to the device.
   *
   * @param device the device the control state belongs to
   * @param stateName name of the control state, like 'setOutputLimit'
   * @param value the new value
   */
  private onControlStateChange(device: ZenIobDevice, stateName: string, value: ioBroker.StateValue): void {
    this.log.debug(`[onStateChange] Control state '${stateName}' changed, new value is ${value}!`);

    const handler = CONTROL_STATE_HANDLERS[stateName];
    if (handler) {
      void handler(device, value);
    }
  }

  /**
   * Is called when a device's 'adapterAutomation.automationEnabled' was written (ack == false): releases the
   * device's automation limit to 0 when automation was switched off for it.
   *
   * @param device the device the state belongs to
   * @param state the new state
   */
  private onDeviceAutomationEnabledChange(device: ZenIobDevice, state: ioBroker.State): void {
    // Only on an actual on -> off change (lc === ts), so re-writing 'false' doesn't override a limit that
    // was set manually while automation is off for this device.
    if (state.val === true || state.lc !== state.ts) {
      return;
    }

    this.log.info(`[onDeviceAutomationEnabledChange] Adapter automation disabled for device '${device.deviceKey}'!`);
    void stopDeviceAutomation(this, device);
  }

  /**
   * Is called when the user-configured automation trigger state (an external state outside this adapter,
   * typically a grid meter's current power) changes value. Drives the adapterAutomation zero feed-in
   * control loop (see services/adapterAutomation/adapterAutomation.ts).
   *
   * @param state the new state of the automation trigger state
   */
  private onAutomationTriggerStateChange(state: ioBroker.State): void {
    if (state.val == null || Number.isNaN(Number(state.val))) {
      this.log.warn(
        `[onAutomationTriggerStateChange] Automation trigger state has a non-numeric value (${state.val}), ignoring!`,
      );
      return;
    }

    void runZeroFeedInAutomation(this, Number(state.val));
  }

  /**
   * Is called when 'adapterAutomation.automationEnabled' changes value. Logs the new state, sets all automation
   * device limits to 0 when automation is switched off, and warns if automation was enabled without an
   * automation trigger state configured, since it would then never run.
   *
   * @param state the new state of 'adapterAutomation.automationEnabled'
   */
  private onAdapterAutomationEnabledChange(state: ioBroker.State): void {
    const enabled = state.val === true;

    this.log.info(`[onAdapterAutomationEnabledChange] Adapter automation ${enabled ? "enabled" : "disabled"}!`);

    // Reset the PI controller on every on/off transition, so a windup accumulated before automation was
    // switched off (or before it starts fresh now) doesn't apply a stale correction based on old conditions.
    resetAdapterAutomationController(this);

    // Only on an actual on -> off change (lc === ts), so re-writing 'false' doesn't override limits that
    // were set manually while automation is off.
    if (!enabled && state.lc === state.ts) {
      void stopAdapterAutomation(this);
    }

    if (enabled && !this.config.automationTriggerStateId) {
      this.log.error(
        "[onAdapterAutomationEnabledChange] Adapter automation was enabled, but no automation trigger state is configured in the adapter settings - automation will never run!",
      );
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
