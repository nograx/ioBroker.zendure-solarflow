/* eslint-disable @typescript-eslint/indent */
export interface IDeviceAutomationPayload {
  autoModelProgram: number;
  autoModelValue: IAutoModelValue | number;
  msgType: number;
  autoModel: number;
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
