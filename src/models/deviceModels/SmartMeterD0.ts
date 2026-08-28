import type { ZendureSolarflow } from "../../main";
import type { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenIobDevice } from "./ZenIobDevice";

/**
 * Zendure Smart Meter (D0, IEC 62056-21 optical reader). Read-only zenSDK device with no control states -
 * it only ever reports live measurements read from the utility meter.
 */
export class SmartMeterD0 extends ZenIobDevice {
  isZenSdkSupported = true;

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenIobDeviceDetails,
  ) {
    super(_adapter, _productKey, _deviceKey, _productName, _deviceName, true, _zenHaDeviceDetails);
  }
}
