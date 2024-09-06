/* eslint-disable @typescript-eslint/indent */
export interface ISolarFlowDeviceDetails {
  _connectedWithAce?: boolean;
  batteryCode?: string;
  bindId?: number;
  bindStatus?: number;
  bindType?: number;
  blueState?: boolean;
  deviceKey: string;
  electricity?: number; // SOC
  fourGStatus?: boolean;
  id?: number;
  input?: boolean;
  inputPower?: number;
  isShareFlag?: string;
  isSwitch?: boolean;
  name?: string; // SolarFlow
  networkType?: number;
  onlineFlag?: string;
  output?: boolean;
  outputPower?: number;
  packList?: ISolarFlowDeviceDetails[];
  parallelMode?: number;
  productId?: number;
  productKey: string;
  productName: string;
  productType?: number;
  remainOutTime?: number;
  seriesMode?: number;
  slowChargePower?: number;
  snNumber?: string;
  standard?: string;
  temperature?: number;
  temperatureUnit?: number;
  upgradeStatus?: unknown;
  upgradeStatusDes?: string;
  upsMode?: boolean;
  url?: string;
  wifiStatus?: boolean;
}
