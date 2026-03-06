import { IZenIobDeviceDetails } from "./IZenIobDeviceDetails";
import { IZenIobMqttData } from "./IZenIobMqttData";

/* eslint-disable @typescript-eslint/indent */
export interface IIobDeviceListData {
  deviceList: IZenIobDeviceDetails[];
  mqtt: IZenIobMqttData;
}
