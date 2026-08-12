import type { IZenIobDeviceDetails } from "./IZenIobDeviceDetails";
import type { IZenIobMqttData } from "./IZenIobMqttData";

export interface IIobDeviceListData {
  deviceList: IZenIobDeviceDetails[];
  mqtt: IZenIobMqttData;
}
