import { IZenIobDeviceDetails } from "./IZenIobDeviceDetails";
import { IZenIobMqttData } from "./IZenIobMqttData";

export interface IIobDeviceListData {
  deviceList: IZenIobDeviceDetails[];
  mqtt: IZenIobMqttData;
}
