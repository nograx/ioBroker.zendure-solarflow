import { IZenHaDeviceDetails } from "./IZenHaDeviceDetails";
import { IZenHaMqttData } from "./IZenHaMqttData";

/* eslint-disable @typescript-eslint/indent */
export interface IHaDeviceListData {
  deviceList: IZenHaDeviceDetails[];
  mqtt: IZenHaMqttData;
}
