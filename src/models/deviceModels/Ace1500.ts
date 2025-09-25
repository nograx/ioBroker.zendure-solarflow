import { aceControlStates } from "../../constants/aceControlStates";
import { aceStates } from "../../constants/aceStates";
import { ZendureSolarflow } from "../../main";
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

  public setDcSwitch(dcSwitch: boolean) {
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
}
