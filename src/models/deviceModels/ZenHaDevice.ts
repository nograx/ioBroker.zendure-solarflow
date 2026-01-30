import { createHash } from "crypto";
import { calculationStateKeys } from "../../constants/constants";
import { createCalculationStates } from "../../helpers/createCalculationStates";
import { toHoursAndMinutes } from "../../helpers/timeHelper";
import { ZendureSolarflow } from "../../main";
import {
  knownPackDataProperties,
  onSubscribeIotTopic,
  onSubscribeReportTopic,
} from "../../services/mqttSharedService";
import { IDevicePack } from "../IDevicePack";
import { IPackData } from "../IPackData";
import { ISolarflowState } from "../ISolarflowState";
import { IZenHaDeviceDetails } from "../IZenHaDeviceDetails";

export class ZenHaDevice {
  public zenHaDeviceDetails?: IZenHaDeviceDetails;
  public adapter: ZendureSolarflow;

  public productKey: string;
  public deviceKey: string;
  public productName: string;
  public deviceName: string;
  public messageId: number = 0;
  public batteries: IDevicePack[] = [];

  public iotTopic: string = "";
  public functionTopic = "";
  public password: string = "";

  public maxInputLimit: number = 0;
  public maxOutputLimit: number = 0;

  public states: ISolarflowState[] = [];
  public controlStates: ISolarflowState[] = [];

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenHaDeviceDetails,
  ) {
    this.zenHaDeviceDetails = _zenHaDeviceDetails;
    this.adapter = _adapter;
    this.productKey = _productKey;
    this.deviceKey = _deviceKey;

    this.deviceName = _deviceName;
    this.productName = _productName;

    this.iotTopic = `iot/${_productKey}/${_deviceKey}/properties/write`;
    this.functionTopic = `iot/${_productKey}/${_deviceKey}/function/invoke`;

    // Calculate device password
    this.password = createHash("md5")
      .update(_deviceKey, "utf8")
      .digest("hex")
      .toUpperCase()
      .substring(8, 24);

    // Create or update states
    this.createSolarFlowStates();

    // Subscribe to report topic (get telemetry)
    this.subscribeReportTopic();

    // Subscribe to Iot topic (push control values)
    this.subscribeIotTopic();

    // Get complete data from device after a timeout
    this.adapter.setTimeout(() => {
      this.triggerFullTelemetryUpdate();
    }, 5000);

    if (this.zenHaDeviceDetails?.online) {
      this.updateSolarFlowState("wifiState", "Connected");
    } else if (this.zenHaDeviceDetails?.online == false) {
      this.updateSolarFlowState("wifiState", "Disconnected");
    }
  }

  private async createSolarFlowStates(): Promise<void> {
    const productKey = this.productKey.replace(
      this.adapter.FORBIDDEN_CHARS,
      "",
    );
    const deviceKey = this.deviceKey.replace(this.adapter.FORBIDDEN_CHARS, "");

    this.adapter.log.debug(
      `[createSolarFlowStates] Creating or updating SolarFlow states for ${this.productName} (${productKey}/${deviceKey}) and name '${this.deviceName}'.`,
    );

    // Create device (e.g. the product type -> SolarFlow)
    await this.adapter?.extendObject(productKey, {
      type: "device",
      common: {
        name: {
          de: `${this.productName} (${productKey})`,
          en: `${this.productName} (${productKey})`,
        },
      },
      native: {},
    });

    // Create channel (e.g. the device specific key)
    await this.adapter?.extendObject(productKey + "." + deviceKey, {
      type: "channel",
      common: {
        name: {
          de: `${this.deviceName} (${deviceKey})`,
          en: `${this.deviceName} (${deviceKey})`,
        },
      },
      native: {},
    });

    // Create pack data folder
    await this.adapter?.extendObject(`${productKey}.${deviceKey}.packData`, {
      type: "channel",
      common: {
        name: {
          de: "Batterie Packs",
          en: "Battery packs",
        },
      },
      native: {},
    });

    // Create report states
    this.states.forEach(async (state: ISolarflowState) => {
      await this.adapter?.extendObject(
        `${productKey}.${deviceKey}.${state.title}`,
        {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn,
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: false,
            unit: state.unit,
            states: state.states,
          },
          native: {},
        },
      );
    });

    // Create control folder
    await this.adapter?.extendObject(`${productKey}.${deviceKey}.control`, {
      type: "channel",
      common: {
        name: {
          de: "Steuerung für Gerät " + deviceKey,
          en: "Control for device " + deviceKey,
        },
      },
      native: {},
    });

    this.controlStates.forEach(async (state: ISolarflowState) => {
      await this.adapter?.extendObject(
        `${productKey}.${deviceKey}.control.${state.title}`,
        {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn,
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: true,
            unit: state.unit,
            states: state.states,
          },
          native: {},
        },
      );

      // Subscribe to states to respond to changes
      this.adapter?.subscribeStates(
        `${productKey}.${deviceKey}.control.${state.title}`,
      );
    });

    if (this.adapter.config.useCalculation) {
      // Create calculations folder
      await this.adapter?.extendObject(
        `${productKey}.${deviceKey}.calculations`,
        {
          type: "channel",
          common: {
            name: {
              de: "Berechnungen für Gerät " + deviceKey,
              en: "Calculations for Device " + deviceKey,
            },
          },
          native: {},
        },
      );

      await createCalculationStates(this.adapter, productKey, deviceKey);
    }
  }

  public subscribeReportTopic(): void {
    const reportTopic = `/${this.productKey}/${this.deviceKey}/#`;

    if (this.adapter) {
      this.adapter.log.debug(
        `[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic}`,
      );
      this.adapter.mqttClient?.subscribe(reportTopic, onSubscribeReportTopic);
    }
  }

  private subscribeIotTopic(): void {
    const iotTopic = `iot/${this.productKey}/${this.deviceKey}/#`;

    this.adapter?.log.debug(
      `[subscribeIotTopic] Subscribing to MQTT Topic: ${iotTopic}`,
    );
    this.adapter?.mqttClient?.subscribe(iotTopic, (error) => {
      onSubscribeIotTopic(error, this.productKey, this.deviceKey);
    });
  }

  public setDeviceAutomationInOutLimit(limit: number): void {
    this.adapter?.log.error(
      `[setAcMode] Method setDeviceAutomationInOutLimit (set to ${limit}) not defined in base class!`,
    );
    return;
  }

  public setAcMode(acMode: number): void {
    this.adapter?.log.error(
      `[setAcMode] Method setAcMode (set to ${acMode}) not defined in base class!`,
    );
    return;
  }

  public setDcSwitch(dcSwitch: boolean): void {
    this.adapter?.log.error(
      `[setAcMode] Method setDcSwitch (set to ${dcSwitch}) not defined in base class!`,
    );
    return;
  }

  public setAcSwitch(acSwitch: boolean): void {
    this.adapter?.log.error(
      `[setAcMode] Method setAcSwitch (set to ${acSwitch}) not defined in base class!`,
    );
    return;
  }

  public setHubState(hubState: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (hubState == 0 || hubState == 1) {
        const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;

        const socSetLimit = { properties: { hubState: hubState } };
        this.adapter.log.debug(
          `[setHubState] Setting Hub State for deviceKey ${this.deviceKey} to ${hubState}!`,
        );
        this.adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
      } else {
        this.adapter.log.debug(`[setHubState] Hub state is not 0 or 1!`);
      }
    }
  }

  public setPassMode(passMode: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;

      const setPassModeContent = { properties: { passMode: passMode } };
      this.adapter.log.debug(
        `[setPassMode] Set passMode for deviceKey ${this.deviceKey} to ${passMode}!`,
      );
      this.adapter.mqttClient?.publish(
        topic,
        JSON.stringify(setPassModeContent),
      );
    }
  }

  public setAutoRecover(autoRecover: boolean): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;

      const setAutoRecoverContent = {
        properties: { autoRecover: autoRecover ? 1 : 0 },
      };
      this.adapter.log.debug(
        `[setAutoRecover] Set autoRecover for deviceKey ${this.deviceKey} to ${autoRecover}!`,
      );
      this.adapter.mqttClient?.publish(
        topic,
        JSON.stringify(setAutoRecoverContent),
      );
    }
  }

  /**
   * Will set the discharge limit (minSoc)
   * @param socSet the desired minimum soc
   * @returns void
   */
  public setDischargeLimit(minSoc: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (minSoc >= 0 && minSoc <= 50) {
        const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;

        const socSetLimit = { properties: { minSoc: minSoc * 10 } };
        this.adapter.log.debug(
          `[setDischargeLimit] Setting Discharge Limit for device key ${this.deviceKey} to ${minSoc}!`,
        );
        this.adapter.mqttClient?.publish(topic, JSON.stringify(socSetLimit));
      } else {
        this.adapter.log.debug(
          `[setDischargeLimit] Discharge limit is not in range 0<>50!`,
        );
      }
    }
  }

  /**
   * Will set the maximum charge limit
   * @param socSet the desired max SOC
   * @returns void
   */
  public setChargeLimit(socSet: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (socSet >= 40 && socSet <= 100) {
        const socSetLimit = { properties: { socSet: socSet * 10 } };
        this.adapter.log.debug(
          `[setChargeLimit] Setting ChargeLimit for device key ${this.deviceKey} to ${socSet}!`,
        );
        this.adapter.mqttClient?.publish(
          this.iotTopic,
          JSON.stringify(socSetLimit),
        );
      } else {
        this.adapter.log.debug(
          `[setChargeLimit] Charge limit is not in range 40<>100!`,
        );
      }
    }
  }

  /**
   * Will set the 'energy plan'
   * @param autoModel autoModel value, like 8 for smart matching
   * @returns void
   */
  public setAutoModel(autoModel: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      let setAutoModelContent: any = { properties: { autoModel: autoModel } };

      switch (autoModel) {
        case 8: {
          // Smart Matching Modus
          setAutoModelContent = {
            properties: {
              autoModelProgram: 1,
              autoModelValue: {
                chargingType: 0,
                chargingPower: 0,
                outPower: 0,
              },
              msgType: 1,
              autoModel: 8,
            },
          };
          break;
        }
        case 9: // Smart CT Modus
          setAutoModelContent = {
            properties: {
              autoModelProgram: 2,
              autoModelValue: {
                chargingType: 3,
                chargingPower: 0,
                outPower: 0,
              },
              msgType: 1,
              autoModel: 9,
            },
          };
          break;
      }

      this.adapter.log.debug(
        `[setAutoModel] Setting autoModel for device key ${this.deviceKey} to ${autoModel}!`,
      );
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(setAutoModelContent),
      );
    }
  }

  public async setOutputLimit(limit: number): Promise<void> {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      // Check if autoModel is set to 0 (Nothing) or 8 (Smart Matching)
      const autoModel = (
        await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".autoModel",
        )
      )?.val;

      if (autoModel != 0) {
        this.adapter.log.warn(
          "Operation mode (autoModel) is not set to '0', we can't set the output limit!",
        );
        return;
      }

      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }

      // Limit to the device max limit
      if (limit > this.maxOutputLimit) {
        limit = this.maxOutputLimit;
      }

      if (
        limit < 100 &&
        limit != 90 &&
        limit != 60 &&
        limit != 30 &&
        limit != 0 &&
        (this.productKey == "73bktv" || this.productKey == "a8yh63")
      ) {
        // NUR Solarflow HUB: Das Limit kann unter 100 nur in 30er Schritten gesetzt werden, dH. 30/60/90/100, wir rechnen das also um
        if (limit < 100 && limit > 90) {
          limit = 90;
        } else if (limit > 60 && limit < 90) {
          limit = 60;
        } else if (limit > 30 && limit < 60) {
          limit = 30;
        } else if (limit < 30) {
          limit = 30;
        }
      }

      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock",
        );
        if (
          lowVoltageBlockState &&
          lowVoltageBlockState.val &&
          lowVoltageBlockState.val == true
        ) {
          limit = 0;
        }

        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded",
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
        await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".outputLimit",
        )
      )?.val;

      if (currentLimit != null && currentLimit != undefined) {
        if (currentLimit != limit) {
          const outputlimit = { properties: { outputLimit: limit } };

          this.messageId += 1;

          const timestamp = new Date();
          timestamp.setMilliseconds(0);

          this.adapter.mqttClient?.publish(
            this.iotTopic,
            JSON.stringify(outputlimit),
          );
        }
      }
    }
  }

  public setInputLimit(limit: number): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      // Limit has always to be positive!
      if (limit < 0) {
        this.adapter.log.debug(
          `[setInputLimit] limit ${limit} is negative, converting to positive!`,
        );
        limit = Math.abs(limit);
      }

      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }

      if (limit < 0) {
        limit = 0;
      } else if (limit > 0 && limit <= 30) {
        limit = 30;
      } else if (limit > this.maxInputLimit) {
        limit = this.maxInputLimit;
      }

      if (this.productKey.includes("8bm93h")) {
        // Das Limit kann beim ACE nur in 100er Schritten gesetzt werden
        limit = Math.ceil(limit / 100) * 100;
      }

      const inputLimitContent = { properties: { inputLimit: limit } };
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(inputLimitContent),
      );
    }
  }

  public setSmartMode(smartModeOn: boolean): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setSmartModeContent = {
        properties: { smartMode: smartModeOn ? 1 : 0 },
      };

      this.adapter.log.debug(
        `[setBuzzer] Setting Smart Mode for device key ${this.deviceKey} to ${smartModeOn}!`,
      );
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(setSmartModeContent),
      );
    }
  }

  public setBuzzerSwitch(buzzerOn: boolean): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setBuzzerSwitchContent = {
        properties: { buzzerSwitch: buzzerOn ? 1 : 0 },
      };
      this.adapter.log.debug(
        `[setBuzzer] Setting Buzzer for device key ${this.deviceKey} to ${buzzerOn}!`,
      );
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(setBuzzerSwitchContent),
      );
    }
  }

  public triggerFullTelemetryUpdate(): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/read`;

      const getAllContent = { properties: ["getAll"] };
      this.adapter.log.debug(
        `[triggerFullTelemetryUpdate] Triggering full telemetry update for device key ${this.deviceKey}!`,
      );
      this.adapter.mqttClient?.publish(topic, JSON.stringify(getAllContent));
    }
  }

  public async updateSolarFlowState(
    state: string,
    val: number | string | boolean,
  ): Promise<void> {
    const currentValue = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.${state}`,
    );

    await this.adapter?.setState(
      `${this.productKey}.${this.deviceKey}.${state}`,
      val,
      true,
    );

    if (currentValue?.val != val && state != "wifiState") {
      // Set lastUpdate for deviceKey if a value was changed!
      await this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.lastUpdate`,
        new Date().getTime(),
        true,
      );

      // Check current wifiState, if Disconnected set it to Connected!
      const currentWifiState = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.wifiState`,
      );

      if (currentWifiState && currentWifiState.val == "Disconnected") {
        this.updateSolarFlowState("wifiState", "Connected");
      }
    }
  }

  public async updateSolarFlowControlState(
    state: string,
    val: number | string | boolean,
  ): Promise<void> {
    // First check if state exist
    const stateExist = await this.adapter?.objectExists(
      `${this.productKey}.${this.deviceKey}.control.${state}`,
    );

    // Update the control state
    if (stateExist) {
      await this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.control.${state}`,
        val,
        true,
      );
    }
  }

  addOrUpdatePackData = async (
    packData: IPackData[],
    isSolarFlow: boolean,
  ): Promise<void> => {
    if (this.adapter && this.productKey && this.deviceKey) {
      await packData.forEach(async (x) => {
        // Process data only with a serial id!
        if (x.sn && this.adapter) {
          // Create channel (e.g. the device specific key)
          // We can determine the type of the battery by the SN number.
          let batType = "";
          if (this.productKey == "yWF7hV") {
            batType = "AIO2400";
          } else if (x.sn.startsWith("A")) {
            batType = "AB1000";
          } else if (x.sn.startsWith("B")) {
            batType = "AB1000S";
          } else if (x.sn.startsWith("C")) {
            if (x.sn[3] == "F") {
              batType = "AB2000S";
            } else {
              batType = "AB2000";
            }
          } else if (x.sn.startsWith("F")) {
            batType = "AB3000X";
          }

          // Check if is in Pack2device list
          if (!this.batteries.some((y) => y.packSn == x.sn)) {
            this.batteries.push({
              packSn: x.sn,
              type: batType,
            });

            this.adapter.log.debug(
              `[addOrUpdatePackData] Added battery ${batType} with SN ${x.sn} on deviceKey ${this.deviceKey} to batteries array!`,
            );
          }

          // create a state for the serial id
          const key = (
            this.productKey +
            "." +
            this.deviceKey +
            ".packData." +
            x.sn
          ).replace(this.adapter.FORBIDDEN_CHARS, "");

          await this.adapter?.extendObject(key, {
            type: "channel",
            common: {
              name: {
                de: batType,
                en: batType,
              },
            },
            native: {},
          });

          await this.adapter?.extendObject(key + ".model", {
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

          await this.adapter?.setState(key + ".model", batType, true);

          await this.adapter?.extendObject(key + ".sn", {
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

          await this.adapter?.setState(key + ".sn", x.sn, true);

          if (x.socLevel) {
            // State für socLevel
            await this.adapter?.extendObject(key + ".socLevel", {
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

            await this.adapter?.setState(key + ".socLevel", x.socLevel, true);
          }

          if (x.maxTemp) {
            const maxTempCelsius = x.maxTemp / 10 - 273.15;
            const maxTempState = await this.adapter?.getStateAsync(
              key + ".maxTemp",
            );

            // Check if Value exist and changed, if so update lastUpdate!
            if (
              maxTempState &&
              maxTempState.val &&
              maxTempCelsius != maxTempState.val
            ) {
              // Value exist and value changed, update last update!
              await this.adapter?.setState(
                `${this.productKey}.${this.deviceKey}.lastUpdate`,
                new Date().getTime(),
                true,
              );

              // Check current wifiState, if Disconnected set it to Connected!
              const currentWifiState = await this.adapter.getStateAsync(
                `${this.productKey}.${this.deviceKey}.wifiState`,
              );

              if (currentWifiState && currentWifiState.val == "Disconnected") {
                this.updateSolarFlowState("wifiState", "Connected");
              }
            }

            // State für maxTemp
            await this.adapter?.extendObject(key + ".maxTemp", {
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
            await this.adapter?.setState(
              key + ".maxTemp",
              maxTempCelsius,
              true,
            );
          }

          if (x.minVol) {
            const minVol = x.minVol / 100;
            const minVolState = await this.adapter?.getStateAsync(
              key + ".minVol",
            );

            // Check if Value exist and changed, if so update lastUpdate!
            if (minVolState && minVolState.val && minVol != minVolState.val) {
              // Value exist and value changed, update last update!
              await this.adapter?.setState(
                `${this.productKey}.${this.deviceKey}.lastUpdate`,
                new Date().getTime(),
                true,
              );

              // Check current wifiState, if Disconnected set it to Connected!
              const currentWifiState = await this.adapter.getStateAsync(
                `${this.productKey}.${this.deviceKey}.wifiState`,
              );

              if (currentWifiState && currentWifiState.val == "Disconnected") {
                this.updateSolarFlowState("wifiState", "Connected");
              }
            }

            await this.adapter?.extendObject(key + ".minVol", {
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

            await this.adapter?.setState(key + ".minVol", minVol, true);
          }

          if (x.batcur) {
            await this.adapter?.extendObject(key + ".batcur", {
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

            await this.adapter?.setState(key + ".batcur", x.batcur / 10, true);
          }

          // Check if Value exist and changed, if so update lastUpdate!
          if (x.maxVol) {
            const maxVol = x.maxVol / 100;
            const maxVolState = await this.adapter?.getStateAsync(
              key + ".maxVol",
            );

            if (maxVolState && maxVolState.val && maxVol != maxVolState.val) {
              // Value exist and value changed, update last update!
              await this.adapter?.setState(
                `${this.productKey}.${this.deviceKey}.lastUpdate`,
                new Date().getTime(),
                true,
              );

              // Check current wifiState, if Disconnected set it to Connected!
              const currentWifiState = await this.adapter.getStateAsync(
                `${this.productKey}.${this.deviceKey}.wifiState`,
              );

              if (currentWifiState && currentWifiState.val == "Disconnected") {
                this.updateSolarFlowState("wifiState", "Connected");
              }
            }

            await this.adapter?.extendObject(key + ".maxVol", {
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

            await this.adapter?.setState(key + ".maxVol", maxVol, true);
          }

          // Check if Value exist and changed, if so update lastUpdate!
          if (x.totalVol) {
            const totalVol = x.totalVol / 100;

            const totalVolState = await this.adapter?.getStateAsync(
              key + ".totalVol",
            );

            if (
              totalVolState &&
              totalVolState.val &&
              totalVol != totalVolState.val
            ) {
              // Value exist and value changed, update last update!
              await this.adapter?.setState(
                `${this.productKey}.${this.deviceKey}.lastUpdate`,
                new Date().getTime(),
                true,
              );

              // Check current wifiState, if Disconnected set it to Connected!
              const currentWifiState = await this.adapter.getStateAsync(
                `${this.productKey}.${this.deviceKey}.wifiState`,
              );

              if (currentWifiState && currentWifiState.val == "Disconnected") {
                this.updateSolarFlowState("wifiState", "Connected");
              }
            }

            await this.adapter?.extendObject(key + ".totalVol", {
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

            await this.adapter?.setState(key + ".totalVol", totalVol, true);

            // Send Voltage to checkVoltage Method (only if is Solarflow device)
            if (isSolarFlow) {
              this.checkVoltage(totalVol);
            }
          }

          if (x.soh) {
            await this.adapter?.extendObject(key + ".soh", {
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

            await this.adapter?.setState(key + ".soh", x.soh / 10, true);
          }

          if (x.power) {
            await this.adapter?.extendObject(key + ".power", {
              type: "state",
              common: {
                name: {
                  de: "Energie",
                  en: "Power",
                },
                type: "number",
                desc: "Power",
                read: true,
                write: false,
                role: "value.power",
                unit: "W",
              },
              native: {},
            });

            await this.adapter?.setState(key + ".power", x.power, true);
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
              this.adapter?.log.debug(
                `[addOrUpdatePackData] ${key} with value ${value} is a UNKNOWN PackData Mqtt Property!`,
              );
            }
          });
        }
      });
    }
  };

  public async checkVoltage(voltage: number): Promise<void> {
    if (voltage < 46.1) {
      if (this.adapter.config.useCalculation) {
        this.setSocToZero();
      }

      if (this.adapter.config.useLowVoltageBlock) {
        // Activate Low Voltage Block
        await this.adapter?.setState(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
          true,
          true,
        );

        // Low Voltage Block activated, stop power input immediately
        const autoModel = (
          await this.adapter.getStateAsync(
            this.productKey + "." + this.deviceKey + ".autoModel",
          )
        )?.val;
        if (autoModel == 8) {
          this.setDeviceAutomationInOutLimit(0);
        } else {
          this.setOutputLimit(0);
        }

        if (this.adapter.config.forceShutdownOnLowVoltage) {
          const currentSoc = await this.adapter.getStateAsync(
            `${this.productKey}.${this.deviceKey}.electricLevel`,
          );

          if (currentSoc && Number(currentSoc.val) > 50) {
            // We can't shut down the device. Full charge needed!
            if (this.adapter.config.fullChargeIfNeeded) {
              await this.adapter?.setState(
                `${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`,
                true,
                true,
              );
            }
          } else {
            if (currentSoc && currentSoc.val) {
              this.setDischargeLimit(Number(currentSoc.val));
            }

            // Check if device setting is correct
            const hubState = await this.adapter.getStateAsync(
              `${this.productKey}.${this.deviceKey}.hubState`,
            );

            if (!hubState || Number(hubState.val) != 1) {
              this.adapter.log.warn(
                `[checkVoltage] hubState is not set to 'Stop output and shut down', device will NOT go offline!`,
              );
            }
          }
        }
      }
    } else if (voltage >= 47.5) {
      // Deactivate Low Voltage Block
      const lowVoltageBlock = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
      );

      if (lowVoltageBlock && lowVoltageBlock.val == true) {
        await this.adapter?.setState(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
          false,
          true,
        );

        if (
          this.adapter.config.useLowVoltageBlock &&
          this.adapter.config.forceShutdownOnLowVoltage
        ) {
          this.setDischargeLimit(
            this.adapter.config.dischargeLimit
              ? this.adapter.config.dischargeLimit
              : 5,
          );
        }
      }
    }
  }

  /**
   * Calculates the energy for all items in 'calculationStateKeys'.
   *
   * @returns Promise<void>
   *
   * @beta
   */
  public calculateEnergy(): void {
    calculationStateKeys.forEach(async (stateKey) => {
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";
      let stateNamePower = "";

      switch (stateKey) {
        case "pvPower1":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower1`;
          break;
        case "pvPower2":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower2`;
          break;
        case "pvPower3":
          if (this.states.find((x) => x.title == "pvPower3")) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodaykWh`;
            stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower3`;
          }
          break;
        case "pvPower4":
          if (this.states.find((x) => x.title == "pvPower4")) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodaykWh`;
            stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower4`;
          }
          break;
        default:
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
          stateNamePower = `${this.productKey}.${this.deviceKey}.${stateKey}Power`;
          break;
      }

      const currentPowerState =
        await this.adapter?.getStateAsync(stateNamePower);

      const currentEnergyState =
        await this.adapter?.getStateAsync(stateNameEnergyWh);

      if (!currentEnergyState?.val || currentEnergyState?.val == 0) {
        // Workaround, set Val to very low value to avoid Jump in data...
        await this.adapter?.setState(stateNameEnergyWh, 0.000001, true);
      } else if (
        currentEnergyState &&
        currentEnergyState.lc &&
        currentPowerState &&
        currentPowerState.val != undefined &&
        currentPowerState.val != null
      ) {
        // Timeframe = 30000ms, Job runs every 30 seconds...
        const timeFrame = 30000;

        // Calculate Energy value (Wh) from current power in the timeframe from last run...
        const addEnergyValue =
          (Number(currentPowerState.val) * timeFrame) / 3600000; // Wh

        /*       // Use efficiency factor (used the one from Youtube Channel VoltAmpereLux - thanks!)
        const chargingFactor = 0.96; // Efficiency 96%
        const dischargingFactor = 1.08 - addEnergyValue / 10000; // Efficiency 92% - 98% (92% + Energy / 10000 = 600W -> +6%)

        // Calculate energy from efficiency factor if value for charging or discharging
        addEnergyValue =
          stateKey == "outputPack" && addEnergyValue > 0
            ? addEnergyValue * chargingFactor
            : addEnergyValue;
        addEnergyValue =
          stateKey == "packInput" && addEnergyValue > 0
            ? addEnergyValue * dischargingFactor
            : addEnergyValue; */

        let newEnergyValue = Number(currentEnergyState.val) + addEnergyValue;

        // Fix negative value
        if (newEnergyValue < 0) {
          newEnergyValue = 0;
        }

        await this.adapter?.setState(stateNameEnergyWh, newEnergyValue, true);
        await this.adapter?.setState(
          stateNameEnergykWh,
          Number((newEnergyValue / 1000).toFixed(2)),
          true,
        );

        // SOC and energy in batteries
        if (
          (stateKey == "outputPack" || stateKey == "packInput") &&
          addEnergyValue > 0
        ) {
          await this.calculateSocAndEnergy(stateKey, addEnergyValue);
        } else {
          if (stateKey == "outputPack") {
            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
              "",
              true,
            );
          } else if (stateKey == "packInput") {
            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
              "",
              true,
            );
          }
        }
      } else if (currentPowerState && currentEnergyState) {
        await this.adapter?.setState(stateNameEnergyWh, 0, true);
        await this.adapter?.setState(stateNameEnergykWh, 0, true);
      }
    });
  }

  public calculateSocAndEnergy = async (
    stateKey: string,
    value: number,
  ): Promise<void> => {
    this.adapter.log.debug(
      `[calculateSocAndEnergy] Calculating for: ${this.productKey}.${this.deviceKey} and stateKey ${stateKey}!`,
    );

    let energyWhMax: number | undefined = undefined;

    const minSoc = (
      await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.minSoc`,
      )
    )?.val;
    const currentSoc = (
      await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.electricLevel`,
      )
    )?.val;

    if (currentSoc && minSoc && Number(currentSoc) < Number(minSoc)) {
      // Don't calculate if current SOC is lower then minimum
      this.adapter.log.debug(
        `[calculateSocAndEnergy] Don't calculate, currentSoc (${Number(currentSoc)}) is lower than minSoc (${Number(minSoc)})!`,
      );

      return;
    }

    const currentEnergyState = await this.adapter?.getStateAsync(
      this.productKey + "." + this.deviceKey + ".calculations.energyWh",
    );

    const currentEnergyMaxState = await this.adapter?.getStateAsync(
      this.productKey + "." + this.deviceKey + ".calculations.energyWhMax",
    );

    const lowVoltageBlock = await this.adapter?.getStateAsync(
      this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock",
    );

    const currentMaxValue = Number(
      currentEnergyMaxState ? currentEnergyMaxState.val : 0,
    );

    let currentEnergyWh = currentEnergyState?.val
      ? Number(currentEnergyState?.val)
      : 0;

    if (
      currentEnergyWh == null ||
      currentEnergyWh == undefined ||
      currentEnergyWh <= 0
    ) {
      currentEnergyWh = 0;
    }

    if (this.productKey == "yWF7hV") {
      // The device is an AIO 2400, so set maximum Wh to 2400!
      energyWhMax = 2400;
    } else {
      // Iterate over all batteries!
      for (let i = 0; i < this.batteries.length; i++) {
        if (this.batteries[i].type == "AB1000") {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 960;
        } else if (this.batteries[i].type == "AB2000") {
          energyWhMax = (energyWhMax ? energyWhMax : 0) + 1920;
        }
      }
    }

    // newValue is the current available energy in the batteries. If outputPack (charging) add value, if packInput (discharging) subtract value.
    let newEnergyWh =
      stateKey == "outputPack"
        ? currentEnergyWh + value
        : currentEnergyWh - value;

    // If greater than Max of batteries, set it to this value.
    if (
      stateKey == "outputPack" &&
      energyWhMax != undefined &&
      newEnergyWh > energyWhMax
    ) {
      newEnergyWh = energyWhMax;

      this.adapter.log.debug(
        `[calculateSocAndEnergy] newEnergyWh (${newEnergyWh}) is greater than energyWhMax (${energyWhMax}), don't extend value!`,
      );
    }

    if (newEnergyWh > 0) {
      this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.calculations.energyWh`,
        newEnergyWh,
        true,
      );

      this.adapter.log.debug(
        `[calculateSocAndEnergy] set '${this.productKey}.${this.deviceKey}.calculations.energyWh' to ${newEnergyWh}!`,
      );

      if (currentEnergyMaxState) {
        const soc = Number(((newEnergyWh / currentMaxValue) * 100).toFixed(1));

        await this.adapter?.setState(
          `${this.productKey}.${this.deviceKey}.calculations.soc`,
          soc > 100.0 ? 100 : soc,
          true,
        );

        if (newEnergyWh > currentMaxValue && !lowVoltageBlock?.val) {
          // Extend maxVal
          await this.adapter?.setState(
            `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
            newEnergyWh,
            true,
          );
        }

        const currentOutputPackPower = await this.adapter?.getStateAsync(
          `${this.productKey}.${this.deviceKey}.outputPackPower`,
        );

        const currentPackInputPower = await this.adapter?.getStateAsync(
          this.productKey + "." + this.deviceKey + ".packInputPower",
        );

        if (
          stateKey == "outputPack" &&
          currentOutputPackPower?.val != null &&
          currentOutputPackPower != undefined
        ) {
          // Charging, calculate remaining charging time
          const toCharge = currentMaxValue - newEnergyWh;

          const remainHoursAsDecimal =
            toCharge / Number(currentOutputPackPower.val);

          if (remainHoursAsDecimal < 48.0) {
            const remainFormatted = toHoursAndMinutes(
              Math.round(remainHoursAsDecimal * 60),
            );

            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
              remainFormatted,
              true,
            );
          } else {
            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
              "",
              true,
            );
          }
        } else if (
          stateKey == "packInput" &&
          currentPackInputPower != null &&
          currentPackInputPower != undefined
        ) {
          // Discharging, calculate remaining discharge time
          const remainHoursAsDecimal =
            newEnergyWh / Number(currentPackInputPower.val);
          const remainFormatted = toHoursAndMinutes(
            Math.round(remainHoursAsDecimal * 60),
          );

          if (remainHoursAsDecimal < 48.0) {
            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
              remainFormatted,
              true,
            );
          } else {
            await this.adapter?.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
              "",
              true,
            );
          }
        }
      }
    } else if (newEnergyWh <= 0 && stateKey == "outputPack") {
      await this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
        "",
        true,
      );
    } else if (newEnergyWh <= 0 && stateKey == "packInput") {
      await this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
        "",
        true,
      );

      // TEST: if SOC == 0, add newValue as positive to energyWhMax
      const newEnergyWhPositive = Math.abs(newEnergyWh);

      if (energyWhMax && currentMaxValue + newEnergyWhPositive <= energyWhMax) {
        await this.adapter?.setState(
          `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
          currentMaxValue + newEnergyWhPositive,
          true,
        );
      }
    }
  };

  public async setSocToZero(): Promise<void> {
    // Set SOC to 0
    await this.adapter?.setState(
      `${this.productKey}.${this.deviceKey}.calculations.soc`,
      0,
      true,
    );

    // Calculate new Wh Max Value
    const energyWhState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`,
    );
    const energyWhMaxState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
    );

    const newMax = Number(energyWhMaxState?.val) - Number(energyWhState?.val);

    // Set Max Energy to value minus current energy
    await this.adapter?.setState(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
      newMax,
      true,
    );

    // Set Energy in Battery to 0
    await this.adapter?.setState(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`,
      0,
      true,
    );
  }

  public async setEnergyWhMax(): Promise<void> {
    const currentEnergyState = await this.adapter?.getStateAsync(
      this.productKey + "." + this.deviceKey + ".calculations.energyWh",
    );

    if (currentEnergyState) {
      await this.adapter?.setState(
        `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
        currentEnergyState?.val,
        true,
      );
    }
  }

  public resetValuesForDevice(): void {
    calculationStateKeys.forEach(async (stateKey: string) => {
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";

      switch (stateKey) {
        case "pvPower1":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
          break;
        case "pvPower2":
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
          break;
        case "pvPower3":
          if (this.states.find((x) => x.title == "pvPower3")) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv3EnergyTodaykWh`;
          }
          break;
        case "pvPower4":
          if (this.states.find((x) => x.title == "pvPower4")) {
            stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodayWh`;
            stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv4EnergyTodaykWh`;
          }
          break;
        default:
          stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
          stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
          break;
      }

      await this.adapter?.setState(stateNameEnergyWh, 0, true);
      await this.adapter?.setState(stateNameEnergykWh, 0, true);
    });
  }
}
