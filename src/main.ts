/* eslint-disable @typescript-eslint/indent */
/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import {
  connectMqttClient,
  setChargeLimit,
  setDischargeLimit,
  setOutputLimit,
} from "./services/mqttService";
import { getDeviceList, login } from "./services/webService";
import { ISolarFlowDeviceDetails } from "./models/ISolarFlowDeviceDetails";
import { ISolarFlowPaths } from "./models/ISolarFlowPaths";
import { pathsGlobal } from "./constants/paths";
import { Job } from "node-schedule";
import {
  startCalculationJob,
  startCheckStatesJob,
  startReloginAndResetValuesJob,
} from "./services/jobSchedule";
import { MqttClient } from "mqtt";

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

  public accessToken: string | undefined = undefined; // Access Token for Zendure Rest API
  public deviceList: ISolarFlowDeviceDetails[] = [];
  public paths: ISolarFlowPaths | undefined = undefined;
  public interval: ioBroker.Interval | undefined = undefined;
  public lastLogin: Date | undefined = undefined;

  public mqttClient: MqttClient | undefined = undefined;

  public resetValuesJob: Job | undefined = undefined;
  public checkStatesJob: Job | undefined = undefined;
  public calculationJob: Job | undefined = undefined;

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  private async onReady(): Promise<void> {
    // Select paths by config value
    //if (this.config.server && this.config.server == "eu") {
    //  this.paths = pathsEu;
    //} else {
    this.paths = pathsGlobal;
    //}

    // If Username and Password is provided, try to login and get the access token.
    if (this.config.userName && this.config.password) {
      login(this)
        ?.then((_accessToken: string) => {
          this.accessToken = _accessToken;

          this.connected = true;
          this.lastLogin = new Date();

          // Try to get the device list
          getDeviceList(this)
            .then((result: ISolarFlowDeviceDetails[]) => {
              if (result) {
                // Device List found. Save in the adapter properties and connect to MQTT
                this.deviceList = result;
                connectMqttClient(this);

                // Schedule Job
                startReloginAndResetValuesJob(this);
                startCheckStatesJob(this);
                startCalculationJob(this);
              }
            })
            .catch(() => {
              this.connected = false;
              this.log?.error("[onReady] Retrieving device failed!");
            });
        })
        .catch((error) => {
          this.connected = false;
          this.log.error(
            "[onReady] Logon error at Zendure cloud service! Error: " +
              error.toString(),
          );
        });
    } else {
      this.connected = false;
      this.log.error("[onReady] No Login Information provided!");
      //this.stop?.();
    }
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  private onUnload(callback: () => void): void {
    try {
      if (this.interval) {
        this.clearInterval(this.interval);
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
    state: ioBroker.State | null | undefined,
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

      if (state.val != undefined && state.val != null) {
        switch (stateName1) {
          case "control":
            if (stateName2 == "setOutputLimit") {
              setOutputLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "dischargeLimit") {
              setDischargeLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "chargeLimit") {
              setChargeLimit(this, productKey, deviceKey, Number(state.val));
            } else if (stateName2 == "lowVoltageBlock") {
              if (this.config.useLowVoltageBlock) {
                if (state.val == true) {
                  // Low Voltage Block activated, stop power input
                  setOutputLimit(this, productKey, deviceKey, 0);
                }
              }
            }
            break;
          default:
            break;
        }
      } else {
        // The state was deleted
        this.log.debug(`state ${id} deleted`);
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
