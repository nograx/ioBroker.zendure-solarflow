/* eslint-disable @typescript-eslint/indent */
import { IPackData } from "./IPackData";

export interface IMqttData {
  timestamp?: number;
  properties?: ISolarFlowMqttProperties;
  packData?: IPackData[];
  power?: number;
}

export interface ISolarFlowMqttProperties {
  electricLevel?: number;
  packData?: IPackData[];
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
  sn?: string;
  inputLimit?: number;
  gridInputPower?: number;
  acOutputPower?: number;
  acSwitch?: number;
  dcSwitch?: number;
  dcOutputPower?: number;
  packNum?: number;
  gridPower?: number;
  energyPower?: number;
  batteryElectric?: number;
  acMode?: number;
  hyperTmp?: number;
  autoModel?: number;
  heatState?: number;
  // ambientLightNess
  // ambientLightColor
  // ambientLightMode
  // ambientSwitch
  // lowTemperature
  // solarInputPowerCycle
  // solarInputPowerCycle2
  // electricLevelCycle

  // autoHeat
  //
  // loraInvState
  // loraModuleState
  // invOutputPower
  // masterSoftVersion: 4112
  // inputMode
  // blueOta
}

export const knownMqttProps = [
  "electricLevel",
  "packData",
  "packState",
  "pass",
  "passMode",
  "autoRecover",
  "outputHomePower",
  "outputLimit",
  "buzzerSwitch",
  "outputPackPower",
  "packInputPower",
  "solarInputPower",
  "pvPower1",
  "pvPower2",
  "solarPower1",
  "solarPower2",
  "remainOutTime",
  "remainInputTime",
  "socSet",
  "minSoc",
  "pvBrand",
  "inverseMaxPower",
  "wifiState",
  "hubState",
  "sn",
  "inputLimit",
  "gridInputPower",
  "acOutputPower",
  "acSwitch",
  "dcSwitch",
  "autoModel",
  "dcOutputPower",
  "packNum",
  "gridPower",
  "energyPower",
  "batteryElectric",
  "acMode",
  "hyperTmp",
  "autoModel",
  "heatState",
];
