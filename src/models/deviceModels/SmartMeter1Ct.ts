import type { ZendureSolarflow } from "../../main";
import type { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenSdkIobDevice } from "./ZenSdkIobDevice";

/**
 * Zendure Smart Meter (1CT, one current transformer). Read-only zenSDK device with no control states -
 * it only ever reports live measurements (e.g. grid power of its single phase).
 */
export class SmartMeter1Ct extends ZenSdkIobDevice {
  isZenSdkSupported = true;
  hasPackData = false;

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenIobDeviceDetails,
  ) {
    super(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails);
  }
}
