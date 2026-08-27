export interface IDeviceAutomationPayload {
  autoModelProgram: number;
  autoModelValue: IAutoModelValue | number;
  msgType: number;
  autoModel: number;
}

export interface IHemsEpPayload {
  outputPower: number;
  chargePower: number;
  freq: number;
  mode: number;
  chargeMode?: number;
  minSoc?: number;
  inverseMaxPower?: number;
}

interface IAutoModelValue {
  upTime?: number;
  chargingType: number;
  pullTime?: number;
  price?: number;
  chargingPower: number;
  prices?: number[];
  outPower: number;
  freq: number;
}
