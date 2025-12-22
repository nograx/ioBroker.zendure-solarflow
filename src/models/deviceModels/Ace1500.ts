import { aceControlStates } from "../../constants/aceControlStates";
import { aceStates } from "../../constants/aceStates";
import { ZendureSolarflow } from "../../main";
import { IDeviceAutomationPayload } from "../IDeviceAutomationPayload";
import { IZenHaDeviceDetails } from "../IZenHaDeviceDetails";
import { ZenHaDevice } from "./ZenHaDevice";

export class Ace1500 extends ZenHaDevice {
  maxInputLimit = 900;
  maxOutputLimit = 900;

  states = aceStates;
  controlStates = aceControlStates;

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

  public setDcSwitch(dcSwitch: boolean): void {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setDcSwitchContent = {
        properties: { dcSwitch: dcSwitch ? 1 : 0 },
      };
      this.adapter.log.debug(
        `[setDcSwitch] Set DC Switch for device ${this.deviceKey} to ${dcSwitch}!`
      );
      this.adapter.mqttClient?.publish(
        this.iotTopic,
        JSON.stringify(setDcSwitchContent)
      );
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

      if (limit > 0) {
        this.adapter.log.error(
          `[setDeviceAutomationInOutLimit] ACE 1500 can not feed in!`
        );
      }

      // Convert maxInputLimit to negative value and compare to limit
      if (limit < 0 && limit < -this.maxInputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is below the maximum input limit of ${this.maxInputLimit}, setting to ${-this.maxInputLimit}!`
        );
        limit = -this.maxInputLimit;
      }

      this.messageId += 1;

      const timestamp = new Date();
      timestamp.setMilliseconds(0);

      let _arguments: IDeviceAutomationPayload[] = [];

      if (limit < 0) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using CHARGE variant of ACE 1500 device automation, as device '${this.productKey}' detected and limit (${limit}) is negative!`
        );
        _arguments = [
          {
            autoModelProgram: 2,
            autoModelValue: {
              chargingType: 1,
              chargingPower: Math.abs(limit),
              freq: 0,
              outPower: 0,
            },
            msgType: 1,
            autoModel: 8,
          },
        ];
      }

      const deviceAutomation = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: this.messageId,
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
