/* eslint-disable @typescript-eslint/indent */
import { IPackData } from "./IPackData";

export interface IMqttData {
  properties?: ISolarFlowMqttProperties;
  packData?: IPackData[];
}

export interface ISolarFlowMqttProperties {
  electricLevel?: number;
  packState?: number;
  pass?: number;
  passMode?: number;
  autoRecover?: number;
  outputHomePower?: number;
  outputLimit?: number;
  buzzerSwitch?: number;
  outputPackPower?: number;
  packInputPower?: number;
  solarInputPower?: number;
  pvPower1?: number;
  pvPower2?: number;
  solarPower1?: number;
  solarPower2?: number;
  remainOutTime?: number;
  remainInputTime?: number;
  socSet?: number;
  minSoc?: number;
  pvBrand?: number;
  inverseMaxPower?: number;
  wifiState?: number;
  hubState?: number;
  // ambientLightNess
  // ambientLightColor
  // ambientLightMode
  // ambientSwitch
  // lowTemperature
  // solarInputPowerCycle
  // solarInputPowerCycle2
  // electricLevelCycle
  // autoModel
  // autoHeat
  // heatState
  // loraInvState
  // loraModuleState
  // invOutputPower
  // masterSoftVersion: 4112
  // inputMode
  // blueOta
}
