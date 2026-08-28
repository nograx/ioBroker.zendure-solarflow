import type { ZendureSolarflow } from "../../main";
import type { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenIobDevice } from "./ZenIobDevice";

/**
 * Zendure Smart Meter (3CT, three current transformers). Read-only zenSDK device with no control states -
 * it only ever reports live measurements (e.g. grid power/voltage/current per phase).
 */
export class SmartMeter3Ct extends ZenIobDevice {
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
