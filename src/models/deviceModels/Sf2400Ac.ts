import { ac2400ControlStates } from "../../constants/ac2400ControlStates";
import { ac2400States } from "../../constants/ac2400States";
import { ZendureSolarflow } from "../../main";
import { IHemsEpPayload } from "../IDeviceAutomationPayload";
import { IZenHaDeviceDetails } from "../IZenHaDeviceDetails";
import { ZenHaDevice } from "./ZenHaDevice";

export class Sf2400Ac extends ZenHaDevice {
  maxInputLimit = 2400;
  maxOutputLimit = 2400;

  states = ac2400States;
  controlStates = ac2400ControlStates;

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

  public async setAcMode(acMode: number) {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        const setAcMode = { properties: { acMode: acMode } };
        this.adapter.log.debug(`[setAcMode] Set AC mode to ${acMode}!`);
        this.adapter.mqttClient?.publish(
          this.iotTopic,
          JSON.stringify(setAcMode)
        );

        // Check if device is HUB, then check if smartMode is false - if so send a warning to log!
        const smartMode = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.smartMode"
        );

        if (smartMode && !smartMode.val) {
          this.adapter.log.warn(
            `[setAcMode] AC mode was switched and smartMode is false - changes will be written to flash memory. In the worst case, the device may break or changes may no longer be saved!`
          );
        }
      } else {
        this.adapter.log.error(
          `[setAcMode] AC mode must be a value between 0 and 3!`
        );
      }
    }
  }

  public setAcSwitch(acSwitch: boolean) {
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
  ) {
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

      if (limit < 0) {
        // Get input limit, make number positive and the new value negative
        if (limit < this.maxInputLimit) {
          limit = this.maxInputLimit;
        }
      } else {
        if (limit > this.maxOutputLimit) {
          limit = this.maxOutputLimit;
        }
      }

      this.adapter.msgCounter += 1;

      const timestamp = new Date();
      timestamp.setMilliseconds(0);

      // Device Automation for Solarflow 2400 AC and Solarflow 800
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Using HEMS Variant of device automation, as deviceKey '${this.deviceKey}' detected!`
      );

      // HEMS Variante
      let _arguments: IHemsEpPayload = {
        outputPower: limit > 0 ? limit : 0,
        chargeState: limit > 0 ? 0 : 1,
        chargePower: limit > 0 ? 0 : -limit,
        mode: 9,
      };

      const hemsEP = {
        arguments: _arguments,
        function: "hemsEP",
        messageId: this.adapter.msgCounter,
        deviceKey: this.deviceKey,
        timestamp: timestamp.getTime() / 1000,
      };
      this.adapter.mqttClient?.publish(
        this.functionTopic,
        JSON.stringify(hemsEP)
      );
    }
  }
}
