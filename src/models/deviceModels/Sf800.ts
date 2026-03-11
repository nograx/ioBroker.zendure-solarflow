import { solarflow800ControlStates } from "../../constants/controlStates/solarflow800ControlStates";
import { solarflow800States } from "../../constants/sensorStates/solarflow800States";
import { ZendureSolarflow } from "../../main";
import { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenSdkIobDevice } from "./ZenSdkIobDevice";

export class Sf800 extends ZenSdkIobDevice {
  maxInputLimit = 800;
  maxOutputLimit = 800;
  isZenSdkSupported = true;

  states = solarflow800States;
  controlStates = solarflow800ControlStates;

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenIobDeviceDetails,
  ) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails,
    );
  }

  public async setAcMode(acMode: number): Promise<void> {
    if (this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        this.updateProperty("acMode", acMode);

        // Check if device is HUB, then check if smartMode is false - if so send a warning to log!
        const smartMode = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.smartMode",
        );

        if (smartMode && !smartMode.val) {
          this.adapter.log.warn(
            `[setAcMode] AC mode was switched and smartMode is false - changes will be written to flash memory. In the worst case, the device may break or changes may no longer be saved!`,
          );
        }
      } else {
        this.adapter.log.error(
          `[setAcMode] AC mode must be a value between 0 and 3!`,
        );
      }
    }
  }

  public setAcSwitch(acSwitch: boolean): void {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("acSwitch", acSwitch ? 1 : 0);
    }
  }
}
