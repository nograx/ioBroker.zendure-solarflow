import { hyperControlStates } from "../../constants/hyperControlStates";
import { hyperStates } from "../../constants/hyperStates";
import { ZendureSolarflow } from "../../main";
import { IDeviceAutomationPayload } from "../IDeviceAutomationPayload";
import { IZenHaDeviceDetails } from "../IZenHaDeviceDetails";
import { ZenHaDevice } from "./ZenHaDevice";

export class Hyper2000 extends ZenHaDevice {
  maxInputLimit = 1200;
  maxOutputLimit = 1200;

  states = hyperStates;
  controlStates = hyperControlStates;

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenHaDeviceDetails
  ) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails
    );
  }

  public async setAcMode(acMode: number): Promise<void> {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        const setAcMode = { properties: { acMode: acMode } };
        this.adapter.log.debug(`[setAcMode] Set AC mode to ${acMode}!`);
        this.adapter.mqttClient?.publish(
          this.iotTopic,
          JSON.stringify(setAcMode)
        );
      } else {
        this.adapter.log.error(
          `[setAcMode] AC mode must be a value between 0 and 3!`
        );
      }
    }
  }

  public setAcSwitch(acSwitch: boolean): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setAcSwitchContent = {
        properties: { acSwitch: acSwitch ? 1 : 0 },
      };
      this.adapter.log.debug(
        `[setAcSwitch] Set AC Switch for device ${this.deviceKey} to ${acSwitch}!`
      );
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(setAcSwitchContent)
      );
    }
  }

  public async setDeviceAutomationInOutLimit(
    limit: number // can be negative, negative will trigger charging mode
  ): Promise<void> {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`
      );

      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }

      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
        );
        if (
          lowVoltageBlockState &&
          lowVoltageBlockState.val &&
          lowVoltageBlockState.val == true &&
          limit > 0
        ) {
          limit = 0;
        }

        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded"
        );

        if (
          fullChargeNeeded &&
          fullChargeNeeded.val &&
          fullChargeNeeded.val == true &&
          limit > 0
        ) {
          limit = 0;
        }
      }

      // Convert maxInputLimit to negative value and compare to limit
      if (limit < 0 && limit < -this.maxInputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is below the maximum input limit of ${this.maxInputLimit}, setting to ${-this.maxInputLimit}!`
        );
        limit = -this.maxInputLimit;
      } else if (limit > this.maxOutputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is higher the maximum output limit of ${this.maxOutputLimit}, setting to ${this.maxOutputLimit}!`
        );
        limit = this.maxOutputLimit;
      }

      this.adapter.msgCounter += 1;

      const timestamp = new Date();
      timestamp.setMilliseconds(0);

      let _arguments: IDeviceAutomationPayload[] = [];

      if (limit < 0) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using CHARGE variant of HYPER device automation, as device '${this.deviceKey}' detected and limit is negative!`
        );
        // Input / Charge
        _arguments = [
          {
            autoModelProgram: 1,
            autoModelValue: {
              chargingType: 1,
              price: 2,
              chargingPower: limit,
              prices: [
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                1, 1, 1,
              ],
              outPower: 0,
              freq: 0,
            },
            msgType: 1,
            autoModel: 8,
          },
        ];
      } else {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using FEED IN variant of HYPER device automation, as device '${this.productName}' detected and limit is positive!`
        );
        // Output
        _arguments = [
          {
            autoModelProgram: 2,
            autoModelValue: {
              chargingType: 0,
              chargingPower: 0,
              freq: 0,
              outPower: limit,
            },
            msgType: 1,
            autoModel: 8,
          },
        ];
      }

      const deviceAutomation = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: this.adapter.msgCounter,
        deviceKey: this.deviceKey,
        timestamp: timestamp.getTime() / 1000,
      };
      this.adapter.mqttClient?.publish(
        this.functionTopic,
        JSON.stringify(deviceAutomation)
      );
    }
  }
}
